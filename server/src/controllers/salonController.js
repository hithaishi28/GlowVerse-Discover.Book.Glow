import { Salon } from '../models/Salon.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { haversineKm, estimateTravelMinutes } from '../utils/distance.js';
import { summarizeSentiment } from '../services/aiService.js';
import { buildSalonAvailability, crowdFromAvailability, getTodayKey } from '../services/availabilityService.js';

function buildQuery(query) {
  const filter = { approved: true };
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { locality: new RegExp(query.q, 'i') },
      { 'services.name': new RegExp(query.q, 'i') },
      { 'stylists.name': new RegExp(query.q, 'i') }
    ];
  }
  if (query.locality) filter.locality = new RegExp(query.locality, 'i');
  if (query.rating) filter.rating = { $gte: Number(query.rating) };
  if (query.luxury === 'true') filter.luxury = true;
  if (query.ecoFriendly === 'true') filter.ecoFriendly = true;
  if (query.priceMax) filter.priceLevel = { $lte: Math.ceil(Number(query.priceMax) / 1000) || 5 };
  return filter;
}

function isOpenNow(salon) {
  const hour = new Date().getHours();
  const open = Number((salon.workingHours?.open || '09:00').split(':')[0]);
  const close = Number((salon.workingHours?.close || '21:00').split(':')[0]);
  return hour >= open && hour < close;
}

function withDistance(salon, userLocation) {
  const distanceKm = userLocation ? haversineKm(userLocation, salon.coordinates) : null;
  return {
    ...salon,
    distanceKm,
    travelTimeMinutes: estimateTravelMinutes(distanceKm),
    openNow: isOpenNow(salon)
  };
}

export const listSalons = asyncHandler(async (req, res) => {
  const { sort = 'rating', lat, lng, openNow } = req.query;
  const userLocation = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
  let salons = await Salon.find(buildQuery(req.query)).lean();
  const todayKey = getTodayKey();
  const bookings = await Booking.find({ date: todayKey, status: { $in: ['pending_payment', 'confirmed', 'rescheduled', 'completed'] } })
    .select('salon slot status')
    .lean();
  salons = salons.map((salon) => {
    const enriched = withDistance(salon, userLocation);
    const salonBookings = bookings.filter((booking) => String(booking.salon) === String(salon._id));
    const availability = buildSalonAvailability(enriched, salonBookings);
    return {
      ...enriched,
      openNow: availability.isOpen,
      availability,
      crowd: crowdFromAvailability(availability),
      availableSlots: availability.availableSlots
    };
  });
  if (openNow === 'true') salons = salons.filter((salon) => salon.openNow);
  if (req.query.distance && userLocation) salons = salons.filter((salon) => salon.distanceKm <= Number(req.query.distance));

  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    popularity: (a, b) => b.popularity - a.popularity,
    price: (a, b) => a.priceLevel - b.priceLevel,
    distance: (a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999),
    aiMatch: (a, b) => b.rating * 10 + b.popularity - (a.rating * 10 + a.popularity)
  };
  salons.sort(sorters[sort] || sorters.rating);
  res.json({ count: salons.length, salons });
});

export const getSalon = asyncHandler(async (req, res) => {
  const salon = await Salon.findOne({ slug: req.params.slug }).lean();
  if (!salon) throw new ApiError(404, 'Salon not found');
  const [reviews, bookings] = await Promise.all([
    Review.find({ salon: salon._id }).sort({ createdAt: -1 }).limit(30).lean(),
    Booking.find({ salon: salon._id, status: { $in: ['pending_payment', 'confirmed', 'rescheduled', 'completed'] } }).select('slot status date').lean()
  ]);
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length
  }));
  const availability = buildSalonAvailability(salon, bookings);
  res.json({
    salon: {
      ...salon,
      openNow: availability.isOpen,
      availability,
      crowd: crowdFromAvailability(availability),
      availableSlots: availability.availableSlots
    },
    reviews,
    ratingDistribution: distribution,
    aiSentimentSummary: summarizeSentiment(reviews)
  });
});

export const nearbySalons = asyncHandler(async (req, res) => {
  if (!req.query.lat || !req.query.lng) throw new ApiError(422, 'lat and lng are required');
  req.query.sort = 'distance';
  return listSalons(req, res);
});

export const trending = asyncHandler(async (_req, res) => {
  const topRated = await Salon.find().sort({ rating: -1 }).limit(6).lean();
  const mostBooked = await Salon.find().sort({ popularity: -1 }).limit(6).lean();
  res.json({
    mostBooked,
    topRated,
    hairstyles: ['Glass Hair Bob', 'Butterfly Layers', 'Soft Curls', 'Face Framing Highlights'],
    treatments: ['Keratin Smoothening', 'Hydra Facial', 'Aroma Body Spa', 'Chrome Nail Art'],
    makeupLooks: ['Dewy Bridal', 'Soft Glam', 'Reception Glow', 'Minimal Corporate']
  });
});
