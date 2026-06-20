import { env } from '../config/env.js';

function photoUrl(reference) {
  if (!reference) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${reference}&key=${env.googleMapsApiKey}`;
}

function normalizePlace(place, index, location) {
  const address = place.vicinity || place.formatted_address || place.name;
  return {
    id: place.place_id,
    name: place.name,
    rating: place.rating || 4.4,
    reviewCount: place.user_ratings_total || 0,
    address,
    locality: location,
    coordinates: {
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng
    },
    openNow: place.opening_hours?.open_now ?? null,
    businessStatus: place.business_status,
    priceLevel: place.price_level || 3,
    popularity: Math.max(70, 98 - index),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${address}`)}&query_place_id=${place.place_id}`,
    photos: (place.photos || []).slice(0, 4).map((photo) => photoUrl(photo.photo_reference)).filter(Boolean),
    photoReference: place.photos?.[0]?.photo_reference
  };
}

async function collectGooglePages(firstUrl) {
  const collected = [];
  const seen = new Set();
  let pageToken = '';

  for (let page = 0; page < 3; page += 1) {
    if (pageToken) await new Promise((resolve) => setTimeout(resolve, 2200));
    const token = pageToken ? `&pagetoken=${pageToken}` : '';
    const response = await fetch(`${firstUrl}${token}`);
    if (!response.ok) break;
    const data = await response.json();
    for (const place of data.results || []) {
      if (!place.place_id || seen.has(place.place_id)) continue;
      seen.add(place.place_id);
      collected.push(place);
    }
    pageToken = data.next_page_token || '';
    if (!pageToken || collected.length >= 60) break;
  }

  return collected;
}

export async function searchGoogleSalons({ location = 'Bengaluru', q = '', lat, lng }) {
  if (!env.googleMapsApiKey) return [];
  const hasCoordinates = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const keyword = q ? `${q} salon spa beauty hair makeup` : 'salon spa beauty hair makeup';
  const firstUrl = hasCoordinates
    ? `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${Number(lat)},${Number(lng)}&radius=8000&type=beauty_salon&keyword=${encodeURIComponent(keyword)}&key=${env.googleMapsApiKey}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${keyword} in ${location || 'Bengaluru'}`)}&key=${env.googleMapsApiKey}`;

  const places = await collectGooglePages(firstUrl);
  return places.slice(0, 60).map((place, index) => normalizePlace(place, index, location));
}
