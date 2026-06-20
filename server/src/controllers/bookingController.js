import { body } from 'express-validator';
import { Booking } from '../models/Booking.js';
import { Salon } from '../models/Salon.js';
import { Payment } from '../models/Payment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/paymentService.js';
import { createNotification } from '../services/notificationService.js';

export const bookingRules = [
  body('salonId').notEmpty(),
  body('serviceId').notEmpty(),
  body('stylistId').notEmpty(),
  body('date').notEmpty(),
  body('slot').notEmpty(),
  body('paymentMethod').isIn(['upi', 'gpay', 'phonepe', 'paytm', 'card', 'netbanking', 'wallet'])
];

function invoiceNumber() {
  return `GV-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function slotToHour(slot) {
  const match = String(slot).match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3].toUpperCase();
  if (meridian === 'PM' && hour !== 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  return hour + minutes / 60;
}

function dateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

async function assertSlotAvailable({ salon, stylist, date, slot, excludeBookingId = null }) {
  const openHour = Number((salon.workingHours?.open || '09:00').split(':')[0]);
  const closeHour = Number((salon.workingHours?.close || '21:00').split(':')[0]);
  const slotHour = slotToHour(slot);
  if (slotHour === null || slotHour < openHour || slotHour >= closeHour) {
    throw new ApiError(422, 'Selected slot is outside salon operating hours.');
  }

  const today = dateKey();
  const requestedDate = dateKey(date);
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  if (requestedDate < today) throw new ApiError(422, 'Cannot book an appointment in the past.');
  if (requestedDate === today && (nowHour < openHour || nowHour >= closeHour || slotHour <= nowHour)) {
    throw new ApiError(422, 'Selected slot is no longer available today.');
  }

  const conflictQuery = {
    salon: salon._id,
    date: requestedDate,
    slot,
    'stylist.id': stylist._id.toString(),
    status: { $in: ['pending_payment', 'confirmed', 'rescheduled'] }
  };
  if (excludeBookingId) conflictQuery._id = { $ne: excludeBookingId };
  const existingStylistBooking = await Booking.findOne(conflictQuery).lean();
  if (existingStylistBooking) throw new ApiError(409, 'This stylist is already booked for the selected slot.');
}

export const createBooking = asyncHandler(async (req, res) => {
  const salon = await Salon.findById(req.body.salonId);
  if (!salon) throw new ApiError(404, 'Salon not found');
  const service = salon.services.id(req.body.serviceId);
  const stylist = salon.stylists.id(req.body.stylistId);
  if (!service || !stylist) throw new ApiError(422, 'Invalid service or stylist');
  await assertSlotAvailable({ salon, stylist, date: req.body.date, slot: req.body.slot });

  const membershipDiscount = { none: 0, silver: 5, gold: 10, platinum: 15 }[req.user.membershipTier] || 0;
  const discount = Math.round((service.price * membershipDiscount) / 100);
  const convenienceFee = 24;
  const amount = service.price - discount + convenienceFee;
  const booking = await Booking.create({
    user: req.user._id,
    salon: salon._id,
    service: {
      id: service._id.toString(),
      name: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes
    },
    stylist: { id: stylist._id.toString(), name: stylist.name },
    date: dateKey(req.body.date),
    slot: req.body.slot,
    amount,
    discount,
    convenienceFee,
    invoiceNumber: invoiceNumber(),
    calendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service.name)}`
  });

  const order = await createRazorpayOrder(amount, booking.invoiceNumber);
  const payment = await Payment.create({
    booking: booking._id,
    user: req.user._id,
    amount,
    method: req.body.paymentMethod,
    providerOrderId: order.id
  });
  if (order.demo) {
    const transactionId = `demo_pay_${Date.now()}`;
    payment.status = 'paid';
    payment.providerPaymentId = transactionId;
    payment.transactionId = transactionId;
    payment.paidAt = new Date();
    booking.status = 'confirmed';
  }
  booking.payment = payment._id;
  await Promise.all([booking.save(), payment.save()]);

  await createNotification({
    user: req.user._id,
    title: 'Payment order created',
    body: order.demo
      ? `${service.name} at ${salon.name} is confirmed for ${req.body.date}, ${req.body.slot}.`
      : `Complete payment to confirm ${service.name} at ${salon.name} for ${req.body.date}, ${req.body.slot}.`,
    event: order.demo ? 'booking_confirmed' : 'payment_order_created'
  });

  res.status(201).json({ booking, payment, razorpayOrder: order });
});

export const verifyBookingPayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id }).populate('salon', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found');
  const payment = await Payment.findById(booking.payment);
  if (!payment) throw new ApiError(404, 'Payment record not found');
  if (payment.providerOrderId !== razorpay_order_id) throw new ApiError(422, 'Payment order mismatch');
  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });
  if (!valid) {
    payment.status = 'failed';
    await payment.save();
    throw new ApiError(400, 'Payment verification failed');
  }
  payment.status = 'paid';
  payment.providerPaymentId = razorpay_payment_id;
  payment.providerSignature = razorpay_signature;
  payment.transactionId = razorpay_payment_id;
  payment.paidAt = new Date();
  await payment.save();

  booking.status = 'confirmed';
  await booking.save();

  await createNotification({
    user: req.user._id,
    title: 'Booking confirmed',
    body: `${booking.service.name} at ${booking.salon.name} is confirmed for ${booking.date}, ${booking.slot}.`,
    event: 'booking_confirmed'
  });

  res.json({ booking, payment });
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('salon', 'name slug locality images rating').sort({ createdAt: -1 });
  res.json({ bookings });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { status: 'cancelled' },
    { new: true }
  );
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ booking });
});

export const rescheduleBooking = asyncHandler(async (req, res) => {
  const current = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!current) throw new ApiError(404, 'Booking not found');
  const salon = await Salon.findById(current.salon);
  if (!salon) throw new ApiError(404, 'Salon not found');
  const stylist = salon.stylists.id(current.stylist.id);
  if (!stylist) throw new ApiError(422, 'Assigned stylist no longer exists');
  await assertSlotAvailable({ salon, stylist, date: req.body.date, slot: req.body.slot, excludeBookingId: current._id });
  current.date = dateKey(req.body.date);
  current.slot = req.body.slot;
  current.status = 'rescheduled';
  await current.save();
  res.json({ booking: current });
});
