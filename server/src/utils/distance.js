export function haversineKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Number((2 * radius * Math.asin(Math.sqrt(h))).toFixed(1));
}

export function estimateTravelMinutes(distanceKm) {
  if (distanceKm == null) return null;
  return Math.max(6, Math.round((distanceKm / 18) * 60));
}
