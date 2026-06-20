import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';
import { Salon } from '../models/Salon.js';
import { Offer } from '../models/Offer.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Category } from '../models/Category.js';
import { Banner } from '../models/Banner.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { buildAdminDashboardSnapshot, buildOwnerDashboardSnapshot } from '../services/analyticsService.js';

const bookingStatuses = ['pending_payment', 'confirmed', 'cancelled', 'rescheduled', 'completed'];
const offerTypes = ['percentage', 'flat', 'first_time', 'seasonal', 'festival', 'membership', 'combo', 'referral', 'limited_time'];

function csvEscape(value) {
  const raw = String(value ?? '');
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function toCsv(rows) {
  if (!rows.length) return 'message\nNo records';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

async function ownedSalon(ownerId, salonId) {
  const salon = await Salon.findOne({ _id: salonId, owner: ownerId });
  if (!salon) throw new ApiError(404, 'Salon not found for this owner');
  return salon;
}

async function ownedSalonIds(ownerId) {
  const salons = await Salon.find({ owner: ownerId }).select('_id');
  return salons.map((salon) => salon._id);
}

function servicePayload(body, current = {}) {
  return {
    category: body.category ?? current.category,
    name: body.name ?? current.name,
    price: Number(body.price ?? current.price ?? 0),
    durationMinutes: Number(body.durationMinutes ?? current.durationMinutes ?? 30),
    description: body.description ?? current.description ?? '',
    popularity: Number(body.popularity ?? current.popularity ?? 70)
  };
}

function stylistPayload(body, current = {}) {
  return {
    name: body.name ?? current.name,
    title: body.title ?? current.title,
    rating: Number(body.rating ?? current.rating ?? 4.5),
    specialties: Array.isArray(body.specialties) ? body.specialties : (current.specialties || []),
    image: body.image ?? current.image ?? '',
    experienceYears: Number(body.experienceYears ?? current.experienceYears ?? 0)
  };
}

function offerPayload(body, current = {}) {
  const type = offerTypes.includes(body.type) ? body.type : (current.type || 'percentage');
  return {
    title: body.title ?? current.title,
    description: body.description ?? current.description ?? '',
    type,
    discountPercent: body.discountPercent === '' ? undefined : Number(body.discountPercent ?? current.discountPercent ?? 0),
    flatDiscount: body.flatDiscount === '' ? undefined : Number(body.flatDiscount ?? current.flatDiscount ?? 0),
    packageType: body.packageType ?? current.packageType ?? '',
    eligibleServices: Array.isArray(body.eligibleServices) ? body.eligibleServices : (current.eligibleServices || []),
    code: (body.code ?? current.code ?? `GV${Date.now().toString().slice(-6)}`).toUpperCase(),
    startsAt: body.startsAt ? new Date(body.startsAt) : (current.startsAt || new Date()),
    validUntil: body.validUntil ? new Date(body.validUntil) : (current.validUntil || new Date(Date.now() + 30 * 86400000)),
    active: body.active ?? current.active ?? true
  };
}

export const ownerWorkspace = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const [salons, bookings, payments, reviews, offers, inventory, dashboard] = await Promise.all([
    Salon.find({ _id: { $in: salonIds } }).sort({ updatedAt: -1 }).lean(),
    Booking.find({ salon: { $in: salonIds } }).populate('user', 'name email phone').populate('salon', 'name slug').sort({ createdAt: -1 }).limit(200).lean(),
    Payment.find().sort({ createdAt: -1 }).limit(500).lean(),
    Review.find({ salon: { $in: salonIds } }).populate('salon', 'name').sort({ createdAt: -1 }).limit(100).lean(),
    Offer.find({ salon: { $in: salonIds } }).sort({ createdAt: -1 }).lean(),
    InventoryItem.find({ salon: { $in: salonIds } }).sort({ updatedAt: -1 }).lean(),
    buildOwnerDashboardSnapshot(req.user._id)
  ]);
  const bookingIds = new Set(bookings.map((booking) => String(booking._id)));
  res.json({
    ...dashboard,
    editable: {
      salons,
      services: salons.flatMap((salon) => (salon.services || []).map((service) => ({ ...service, salonId: salon._id, salonName: salon.name }))),
      staff: salons.flatMap((salon) => (salon.stylists || []).map((stylist) => ({ ...stylist, salonId: salon._id, salonName: salon.name }))),
      bookings,
      payments: payments.filter((payment) => bookingIds.has(String(payment.booking))),
      reviews,
      offers,
      inventory
    }
  });
});

export const updateOwnerSalon = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  const fields = ['name', 'description', 'address', 'locality', 'priceLevel', 'luxury', 'ecoFriendly', 'organicProducts', 'crueltyFree', 'sustainablePractices'];
  for (const field of fields) if (req.body[field] !== undefined) salon[field] = req.body[field];
  if (req.body.contact) salon.contact = { ...(salon.contact?.toObject?.() || salon.contact || {}), ...req.body.contact };
  if (req.body.workingHours) salon.workingHours = { ...(salon.workingHours?.toObject?.() || salon.workingHours || {}), ...req.body.workingHours };
  await salon.save();
  res.json({ salon });
});

export const updateOwnerPhotos = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  salon.images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : salon.images;
  salon.coverImage = req.body.coverImage || salon.images?.[0] || salon.coverImage;
  await salon.save();
  res.json({ salon });
});

export const createOwnerService = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  salon.services.push(servicePayload(req.body));
  await salon.save();
  res.status(201).json({ service: salon.services[salon.services.length - 1] });
});

export const updateOwnerService = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  const service = salon.services.id(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found');
  service.set(servicePayload(req.body, service.toObject()));
  await salon.save();
  res.json({ service });
});

export const deleteOwnerService = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  const service = salon.services.id(req.params.id);
  if (!service) throw new ApiError(404, 'Service not found');
  service.deleteOne();
  await salon.save();
  res.json({ ok: true });
});

export const createOwnerStylist = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  salon.stylists.push(stylistPayload(req.body));
  await salon.save();
  res.status(201).json({ stylist: salon.stylists[salon.stylists.length - 1] });
});

export const updateOwnerStylist = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  const stylist = salon.stylists.id(req.params.id);
  if (!stylist) throw new ApiError(404, 'Stylist not found');
  stylist.set(stylistPayload(req.body, stylist.toObject()));
  await salon.save();
  res.json({ stylist });
});

export const deleteOwnerStylist = asyncHandler(async (req, res) => {
  const salon = await ownedSalon(req.user._id, req.params.salonId);
  const stylist = salon.stylists.id(req.params.id);
  if (!stylist) throw new ApiError(404, 'Stylist not found');
  stylist.deleteOne();
  await salon.save();
  res.json({ ok: true });
});

export const updateOwnerBookingStatus = asyncHandler(async (req, res) => {
  if (!bookingStatuses.includes(req.body.status)) throw new ApiError(422, 'Invalid booking status');
  const salonIds = await ownedSalonIds(req.user._id);
  const booking = await Booking.findOneAndUpdate({ _id: req.params.id, salon: { $in: salonIds } }, { status: req.body.status }, { new: true });
  if (!booking) throw new ApiError(404, 'Booking not found for this owner');
  res.json({ booking });
});

export const createOwnerOffer = asyncHandler(async (req, res) => {
  await ownedSalon(req.user._id, req.params.salonId);
  const offer = await Offer.create({ ...offerPayload(req.body), salon: req.params.salonId });
  res.status(201).json({ offer });
});

export const updateOwnerOffer = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const current = await Offer.findOne({ _id: req.params.id, salon: { $in: salonIds } });
  if (!current) throw new ApiError(404, 'Offer not found');
  current.set(offerPayload(req.body, current.toObject()));
  await current.save();
  res.json({ offer: current });
});

export const deleteOwnerOffer = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const offer = await Offer.findOneAndDelete({ _id: req.params.id, salon: { $in: salonIds } });
  if (!offer) throw new ApiError(404, 'Offer not found');
  res.json({ ok: true });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  await ownedSalon(req.user._id, req.params.salonId);
  const item = await InventoryItem.create({ ...req.body, salon: req.params.salonId });
  res.status(201).json({ item });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const item = await InventoryItem.findOneAndUpdate({ _id: req.params.id, salon: { $in: salonIds } }, req.body, { new: true });
  if (!item) throw new ApiError(404, 'Inventory item not found');
  res.json({ item });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const item = await InventoryItem.findOneAndDelete({ _id: req.params.id, salon: { $in: salonIds } });
  if (!item) throw new ApiError(404, 'Inventory item not found');
  res.json({ ok: true });
});

export const replyToReview = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const review = await Review.findOne({ _id: req.params.id, salon: { $in: salonIds } });
  if (!review) throw new ApiError(404, 'Review not found');
  review.ownerReply = { text: req.body.text || '', repliedAt: new Date() };
  await review.save();
  res.json({ review });
});

export const reportReview = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const review = await Review.findOne({ _id: req.params.id, salon: { $in: salonIds } });
  if (!review) throw new ApiError(404, 'Review not found');
  review.reported = true;
  review.reportReason = req.body.reason || 'Reported by owner';
  review.status = 'reported';
  await review.save();
  res.json({ review });
});

export const ownerReport = asyncHandler(async (req, res) => {
  const salonIds = await ownedSalonIds(req.user._id);
  const [bookings, payments, inventory] = await Promise.all([
    Booking.find({ salon: { $in: salonIds } }).populate('user', 'name email').populate('salon', 'name').lean(),
    Payment.find().lean(),
    InventoryItem.find({ salon: { $in: salonIds } }).lean()
  ]);
  const bookingIds = new Set(bookings.map((booking) => String(booking._id)));
  const rows = [
    ...bookings.map((booking) => ({ section: 'booking', id: booking._id, salon: booking.salon?.name, customer: booking.user?.name, status: booking.status, amount: money(booking.amount) })),
    ...payments.filter((payment) => bookingIds.has(String(payment.booking))).map((payment) => ({ section: 'payment', id: payment._id, status: payment.status, amount: money(payment.amount) })),
    ...inventory.map((item) => ({ section: 'inventory', id: item._id, name: item.name, quantity: item.quantity, lowStock: Number(item.quantity || 0) <= Number(item.lowStockThreshold || 0) }))
  ];
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="owner-business-report.csv"');
    res.send(toCsv(rows));
    return;
  }
  res.json({ rows });
});

export const adminWorkspace = asyncHandler(async (_req, res) => {
  const [dashboard, users, salons, bookings, payments, reviews, categories, tickets, banners, settings] = await Promise.all([
    buildAdminDashboardSnapshot(),
    User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(100).lean(),
    Salon.find().sort({ createdAt: -1 }).limit(100).lean(),
    Booking.find().populate('user', 'name email').populate('salon', 'name slug').sort({ createdAt: -1 }).limit(200).lean(),
    Payment.find().sort({ createdAt: -1 }).limit(200).lean(),
    Review.find({ $or: [{ reported: true }, { status: 'reported' }, { sentiment: 'negative' }] }).populate('salon', 'name').sort({ updatedAt: -1 }).limit(100).lean(),
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    SupportTicket.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(100).lean(),
    Banner.find().sort({ createdAt: -1 }).lean(),
    PlatformSettings.findOneAndUpdate({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { new: true, upsert: true }).lean()
  ]);
  res.json({ ...dashboard, editable: { users, salons, bookings, payments, reviews, categories, tickets, banners, settings } });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const update = {};
  if (req.body.role) update.role = req.body.role;
  if (req.body.status) update.status = req.body.status;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ ok: true });
});

export const adminModerateSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findById(req.params.id);
  if (!salon) throw new ApiError(404, 'Salon not found');
  for (const field of ['approved', 'suspended', 'verificationStatus', 'suspensionReason']) {
    if (req.body[field] !== undefined) salon[field] = req.body[field];
  }
  await salon.save();
  res.json({ salon });
});

export const adminDeleteSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findByIdAndDelete(req.params.id);
  if (!salon) throw new ApiError(404, 'Salon not found');
  res.json({ ok: true });
});

export const adminUpdateBookingStatus = asyncHandler(async (req, res) => {
  if (!bookingStatuses.includes(req.body.status)) throw new ApiError(422, 'Invalid booking status');
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ booking });
});

export const adminModerateReview = asyncHandler(async (req, res) => {
  const update = {};
  for (const field of ['status', 'reported', 'reportReason']) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }
  const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  res.json({ review });
});

export const adminUpsertCategory = asyncHandler(async (req, res) => {
  const payload = { name: req.body.name, description: req.body.description || '', active: req.body.active !== false, sortOrder: Number(req.body.sortOrder || 0) };
  const category = req.params.id ? await Category.findByIdAndUpdate(req.params.id, payload, { new: true }) : await Category.create(payload);
  if (!category) throw new ApiError(404, 'Category not found');
  res.status(req.params.id ? 200 : 201).json({ category });
});

export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ ok: true });
});

export const adminUpdateTicket = asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if (['resolved', 'closed'].includes(update.status)) update.resolvedAt = new Date();
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ ticket });
});

export const adminUpsertBanner = asyncHandler(async (req, res) => {
  const banner = req.params.id ? await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }) : await Banner.create(req.body);
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.status(req.params.id ? 200 : 201).json({ banner });
});

export const adminDeleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  res.json({ ok: true });
});

export const adminUpdateSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.findOneAndUpdate({ key: 'global' }, req.body, { upsert: true, new: true });
  res.json({ settings });
});

export const adminAnnouncement = asyncHandler(async (req, res) => {
  const users = await User.find(req.body.role ? { role: req.body.role } : {}).select('_id').lean();
  if (users.length) {
    await Notification.insertMany(users.map((user) => ({ user: user._id, title: req.body.title || 'GlowVerse update', body: req.body.body || '', event: 'announcement' })));
  }
  res.status(201).json({ sent: users.length });
});

export const adminReport = asyncHandler(async (_req, res) => {
  const snapshot = await buildAdminDashboardSnapshot();
  const rows = [
    ...snapshot.bookings.map((row) => ({ section: 'bookings', ...row })),
    ...snapshot.payments.map((row) => ({ section: 'payments', ...row })),
    ...snapshot.users.map((row) => ({ section: 'users', ...row })),
    ...snapshot.salonApprovals.map((row) => ({ section: 'salons', ...row }))
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="admin-platform-report.csv"');
  res.send(toCsv(rows));
});
