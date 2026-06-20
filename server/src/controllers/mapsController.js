import { asyncHandler } from '../utils/asyncHandler.js';
import { searchGoogleSalons } from '../services/googleMapsService.js';

export const googleSalons = asyncHandler(async (req, res) => {
  const salons = await searchGoogleSalons({
    location: req.query.location,
    q: req.query.q,
    lat: req.query.lat,
    lng: req.query.lng
  });
  res.json({ salons });
});
