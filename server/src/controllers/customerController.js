import { body } from 'express-validator';
import { Booking } from '../models/Booking.js';
import { Notification } from '../models/Notification.js';
import { Salon } from '../models/Salon.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';

export const serviceSnapshotRules = [
  body('salonId').notEmpty(),
  body('serviceId').notEmpty()
];

export const supportRules = [
  body('subject').trim().notEmpty(),
  body('message').trim().isLength({ min: 5 })
];

async function activeUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, 'Invalid session');
  return user;
}

async function findSalonService(salonId, serviceId) {
  const salon = await Salon.findById(salonId);
  if (!salon) throw new ApiError(404, 'Salon not found');
  const service = salon.services.id(serviceId);
  if (!service) throw new ApiError(404, 'Service not found');
  return { salon, service };
}

function serviceSnapshot(salon, service, quantity = 1) {
  return {
    salon: salon._id,
    salonName: salon.name,
    salonSlug: salon.slug,
    serviceId: service._id.toString(),
    name: service.name,
    category: service.category,
    price: service.price,
    durationMinutes: service.durationMinutes,
    image: salon.images?.[0],
    quantity
  };
}

function cartTotals(cart = []) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const tax = Math.round(subtotal * 0.18);
  return { subtotal, tax, grandTotal: subtotal + tax };
}

export const customerSummary = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedSalons', 'name slug locality images rating');
  res.json({
    wishlistCount: (user.savedSalons?.length || 0) + (user.savedServices?.length || 0),
    cartCount: (user.cart || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    notificationCount: await Notification.countDocuments({ user: req.user._id, read: false })
  });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedSalons', 'name slug locality address images rating priceLevel');
  res.json({ salons: user.savedSalons || [], services: user.savedServices || [] });
});

export const toggleWishlistSalon = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const salon = await Salon.findById(req.params.salonId);
  if (!salon) throw new ApiError(404, 'Salon not found');
  const exists = user.savedSalons.some((id) => String(id) === String(salon._id));
  if (exists) user.savedSalons = user.savedSalons.filter((id) => String(id) !== String(salon._id));
  else user.savedSalons.push(salon._id);
  await user.save();
  res.json({ saved: !exists, wishlistCount: user.savedSalons.length + user.savedServices.length });
});

export const removeWishlistSalon = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  user.savedSalons = user.savedSalons.filter((id) => String(id) !== String(req.params.salonId));
  await user.save();
  res.json({ ok: true });
});

export const toggleWishlistService = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const { salon, service } = await findSalonService(req.body.salonId, req.body.serviceId);
  const exists = user.savedServices.some((item) => String(item.salon) === String(salon._id) && item.serviceId === service._id.toString());
  if (exists) {
    user.savedServices = user.savedServices.filter((item) => !(String(item.salon) === String(salon._id) && item.serviceId === service._id.toString()));
  } else {
    user.savedServices.push(serviceSnapshot(salon, service));
  }
  await user.save();
  res.json({ saved: !exists, wishlistCount: user.savedSalons.length + user.savedServices.length });
});

export const removeWishlistService = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  user.savedServices = user.savedServices.filter((item) => item.serviceId !== req.params.serviceId);
  await user.save();
  res.json({ ok: true });
});

export const getCart = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  res.json({ items: user.cart || [], totals: cartTotals(user.cart) });
});

export const addToCart = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const { salon, service } = await findSalonService(req.body.salonId, req.body.serviceId);
  const existing = user.cart.find((item) => String(item.salon) === String(salon._id) && item.serviceId === service._id.toString());
  if (existing) existing.quantity = Number(existing.quantity || 1) + Number(req.body.quantity || 1);
  else user.cart.push(serviceSnapshot(salon, service, Number(req.body.quantity || 1)));
  await user.save();
  res.status(201).json({ items: user.cart, totals: cartTotals(user.cart) });
});

export const moveWishlistServiceToCart = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const saved = user.savedServices.find((item) => item.serviceId === req.params.serviceId);
  if (!saved) throw new ApiError(404, 'Saved service not found');
  const existing = user.cart.find((item) => String(item.salon) === String(saved.salon) && item.serviceId === saved.serviceId);
  if (existing) existing.quantity = Number(existing.quantity || 1) + 1;
  else user.cart.push({ ...saved.toObject?.() || saved, quantity: 1 });
  user.savedServices = user.savedServices.filter((item) => item.serviceId !== req.params.serviceId);
  await user.save();
  res.json({ items: user.cart, totals: cartTotals(user.cart) });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const item = user.cart.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  item.quantity = Math.max(1, Number(req.body.quantity || 1));
  await user.save();
  res.json({ items: user.cart, totals: cartTotals(user.cart) });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  const item = user.cart.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  item.deleteOne();
  await user.save();
  res.json({ items: user.cart, totals: cartTotals(user.cart) });
});

export const clearCart = asyncHandler(async (req, res) => {
  const user = await activeUser(req.user._id);
  user.cart = [];
  await user.save();
  res.json({ items: [], totals: cartTotals([]) });
});

export const orders = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('salon', 'name slug locality address images')
    .populate('payment')
    .sort({ createdAt: -1 });
  res.json({ orders: bookings });
});

export const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject: req.body.subject,
    message: req.body.message,
    category: req.body.category || 'general',
    priority: 'medium'
  });
  res.status(201).json({ ticket });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ notification });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ ok: true });
});
