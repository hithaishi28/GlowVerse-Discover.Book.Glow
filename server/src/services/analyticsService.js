import { Booking } from '../models/Booking.js';
import { Membership } from '../models/Membership.js';
import { Offer } from '../models/Offer.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';
import { Salon } from '../models/Salon.js';
import { User } from '../models/User.js';
import { buildSalonAvailability, crowdFromAvailability, getTodayKey } from './availabilityService.js';

const paidStatuses = ['paid'];
const activeBookingStatuses = ['pending_payment', 'confirmed', 'rescheduled'];
const completedBookingStatuses = ['confirmed', 'completed', 'rescheduled'];

function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function dateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

function monthKey(date) {
  return new Date(date).toLocaleString('en-IN', { month: 'short' });
}

function sum(items, picker) {
  return items.reduce((total, item) => total + Number(picker(item) || 0), 0);
}

function serviceCounts(bookings) {
  const counts = new Map();
  for (const booking of bookings) {
    const name = booking.service?.name || 'Service';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, bookings]) => ({ name, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);
}

function revenueByMonth(payments) {
  const buckets = new Map();
  for (const payment of payments) {
    const key = monthKey(payment.paidAt || payment.createdAt);
    buckets.set(key, (buckets.get(key) || 0) + Number(payment.amount || 0));
  }
  return [...buckets.entries()].map(([month, revenue]) => ({ month, revenue }));
}

function revenueByDay(payments) {
  const buckets = new Map();
  for (const payment of payments) {
    const key = new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-IN', { weekday: 'short' });
    const current = buckets.get(key) || { day: key, revenue: 0, bookings: 0 };
    current.revenue += Number(payment.amount || 0);
    current.bookings += 1;
    buckets.set(key, current);
  }
  return [...buckets.values()];
}

export async function buildAdminDashboardSnapshot() {
  const [users, salons, bookings, payments, reviews, memberships] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Salon.find().sort({ createdAt: -1 }).lean(),
    Booking.find().sort({ createdAt: -1 }).limit(200).populate('user', 'name email phone role').populate('salon', 'name locality approved').lean(),
    Payment.find().sort({ createdAt: -1 }).limit(200).lean(),
    Review.find().sort({ createdAt: -1 }).limit(100).populate('salon', 'name locality').lean(),
    Membership.find().sort({ monthlyPrice: 1 }).lean()
  ]);

  const paidPayments = payments.filter((payment) => paidStatuses.includes(payment.status));
  const revenue = sum(paidPayments, (payment) => payment.amount);
  const bookingRows = bookings.slice(0, 40).map((booking) => ({
    id: booking.invoiceNumber || String(booking._id).slice(-6),
    salon: booking.salon?.name || 'Salon',
    customer: booking.user?.name || 'Customer',
    slot: `${booking.date || '-'} ${booking.slot || ''}`.trim(),
    status: booking.status,
    amount: rupees(booking.amount)
  }));

  const paymentRows = payments.slice(0, 40).map((payment) => ({
    id: payment.transactionId || payment.providerOrderId || String(payment._id).slice(-6),
    booking: String(payment.booking || '').slice(-6),
    method: payment.method || 'upi',
    status: payment.status,
    amount: rupees(payment.amount),
    paidAt: payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : 'Not paid'
  }));

  return {
    source: 'database',
    metrics: {
      totalUsers: users.length,
      totalCustomers: users.filter((user) => user.role === 'user').length,
      totalOwners: users.filter((user) => user.role === 'owner').length,
      totalSalons: salons.length,
      approvedSalons: salons.filter((salon) => salon.approved).length,
      totalBookings: bookings.length,
      totalRevenue: revenue,
      totalCommission: Math.round(revenue * 0.12)
    },
    users: users.slice(0, 50).map((user) => ({
      id: String(user._id).slice(-6),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      bookings: bookings.filter((booking) => String(booking.user?._id || booking.user) === String(user._id)).length
    })),
    salonApprovals: salons.slice(0, 50).map((salon) => ({
      id: String(salon._id).slice(-6),
      salon: salon.name,
      locality: salon.locality,
      status: salon.approved ? 'Approved' : 'Pending verification',
      rating: salon.rating || 0,
      bookings: bookings.filter((booking) => String(booking.salon?._id || booking.salon) === String(salon._id)).length
    })),
    reviews: reviews.slice(0, 40).map((review) => ({
      id: String(review._id).slice(-6),
      salon: review.salon?.name || 'Salon',
      rating: review.rating,
      sentiment: review.sentiment,
      status: review.status || (review.sentiment === 'negative' ? 'Needs moderation' : 'Published')
    })),
    bookings: bookingRows,
    payments: paymentRows,
    memberships: memberships.map((membership) => ({
      tier: membership.tier,
      members: users.filter((user) => user.membershipTier === membership.tier).length,
      revenue: rupees(users.filter((user) => user.membershipTier === membership.tier).length * membership.monthlyPrice),
      discount: `${membership.discountPercent}%`
    })),
    revenueForecast: revenueByMonth(paidPayments),
    popularServices: serviceCounts(bookings),
    recentBookings: bookingRows.slice(0, 10),
    recentPayments: paymentRows.slice(0, 10)
  };
}

export async function buildOwnerDashboardSnapshot(ownerId) {
  let salons = await Salon.find({ owner: ownerId }).sort({ createdAt: -1 }).lean();
  const salonIds = salons.map((salon) => salon._id);
  const [bookings, payments, reviews, offers] = await Promise.all([
    Booking.find({ salon: { $in: salonIds } }).sort({ createdAt: -1 }).populate('user', 'name email phone').lean(),
    Payment.find().sort({ createdAt: -1 }).limit(300).lean(),
    Review.find({ salon: { $in: salonIds } }).sort({ createdAt: -1 }).populate('salon', 'name').lean(),
    Offer.find({ salon: { $in: salonIds } }).sort({ createdAt: -1 }).lean()
  ]);
  const bookingIds = new Set(bookings.map((booking) => String(booking._id)));
  const salonPayments = payments.filter((payment) => bookingIds.has(String(payment.booking)));
  const paidPayments = salonPayments.filter((payment) => paidStatuses.includes(payment.status));
  const today = getTodayKey();
  const selectedSalon = salons[0];
  const todayBookings = bookings.filter((booking) => booking.date === today);
  const availability = selectedSalon ? buildSalonAvailability(selectedSalon, todayBookings) : null;

  const customersById = new Map();
  for (const booking of bookings) {
    const user = booking.user || {};
    const key = String(user._id || booking.user || booking.customerName || 'guest');
    const current = customersById.get(key) || {
      id: key.slice(-6),
      name: user.name || 'Customer',
      email: user.email || 'Not available',
      phone: user.phone || 'Not available',
      totalOrders: 0,
      totalSpend: 0
    };
    current.totalOrders += 1;
    current.totalSpend += Number(booking.amount || 0);
    customersById.set(key, current);
  }

  return {
    source: 'database',
    salon: selectedSalon,
    metrics: {
      todayBookings: todayBookings.length,
      upcomingAppointments: bookings.filter((booking) => activeBookingStatuses.includes(booking.status)).length,
      totalRevenue: sum(paidPayments, (payment) => payment.amount),
      occupancy: availability?.occupancy || 0,
      totalCustomers: customersById.size,
      totalServices: salons.reduce((count, salon) => count + (salon.services?.length || 0), 0),
      totalStylists: salons.reduce((count, salon) => count + (salon.stylists?.length || 0), 0)
    },
    services: salons.flatMap((salon) => (salon.services || []).map((service) => ({
      id: String(service._id).slice(-6),
      salon: salon.name,
      name: service.name,
      category: service.category,
      duration: `${service.durationMinutes || 0} min`,
      price: rupees(service.price),
      bookings: bookings.filter((booking) => booking.service?.id === String(service._id)).length
    }))).slice(0, 80),
    staff: salons.flatMap((salon) => (salon.stylists || []).map((stylist) => ({
      id: String(stylist._id).slice(-6),
      salon: salon.name,
      name: stylist.name,
      role: stylist.title,
      rating: stylist.rating || '-',
      bookings: bookings.filter((booking) => booking.stylist?.id === String(stylist._id)).length
    }))).slice(0, 80),
    appointments: bookings.slice(0, 80).map((booking) => ({
      id: booking.invoiceNumber || String(booking._id).slice(-6),
      customer: booking.user?.name || 'Customer',
      service: booking.service?.name || 'Service',
      stylist: booking.stylist?.name || 'Any stylist',
      slot: `${booking.date || '-'} ${booking.slot || ''}`.trim(),
      status: booking.status,
      amount: rupees(booking.amount)
    })),
    customers: [...customersById.values()].map((customer) => ({
      ...customer,
      totalSpend: rupees(customer.totalSpend)
    })),
    payments: salonPayments.slice(0, 80).map((payment) => ({
      id: payment.transactionId || payment.providerOrderId || String(payment._id).slice(-6),
      method: payment.method,
      status: payment.status,
      amount: rupees(payment.amount),
      paidAt: payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : 'Not paid'
    })),
    invoices: bookings.filter((booking) => booking.invoiceNumber).slice(0, 80).map((booking) => ({
      invoice: booking.invoiceNumber,
      customer: booking.user?.name || 'Customer',
      service: booking.service?.name || 'Service',
      total: rupees(booking.amount),
      status: booking.status
    })),
    reviews: reviews.slice(0, 80).map((review) => ({
      id: String(review._id).slice(-6),
      salon: review.salon?.name || 'Salon',
      customer: review.userName || 'Customer',
      rating: review.rating,
      sentiment: review.sentiment,
      status: review.status || 'Published'
    })),
    promotions: offers.map((offer) => ({
      id: String(offer._id).slice(-6),
      campaign: offer.title,
      discount: `${offer.discountPercent || 0}%`,
      status: offer.active ? 'Live' : 'Disabled',
      validUntil: offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('en-IN') : 'No expiry'
    })),
    revenue: revenueByDay(paidPayments),
    popularServices: serviceCounts(bookings),
    occupancy: availability ? { ...availability, crowd: crowdFromAvailability(availability) } : null,
    completedBookings: bookings.filter((booking) => completedBookingStatuses.includes(booking.status)).length
  };
}

export async function buildAnalyticsSnapshot(user = null) {
  if (user?.role === 'owner') return buildOwnerDashboardSnapshot(user._id);
  return buildAdminDashboardSnapshot();
}
