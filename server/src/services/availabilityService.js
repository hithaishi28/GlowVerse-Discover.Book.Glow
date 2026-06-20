const slotHours = [
  ['09:00 AM', 9],
  ['10:00 AM', 10],
  ['11:30 AM', 11.5],
  ['01:00 PM', 13],
  ['02:30 PM', 14.5],
  ['04:00 PM', 16],
  ['05:30 PM', 17.5],
  ['07:00 PM', 19],
  ['08:00 PM', 20]
];

function hashText(value) {
  return String(value).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function getTodayKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function buildSalonAvailability(salon, bookings = [], date = new Date()) {
  const plainSalon = salon.toObject ? salon.toObject() : salon;
  const requestedDate = getTodayKey(date);
  const today = getTodayKey();
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const [openHour] = (plainSalon.workingHours?.open || '09:00').split(':').map(Number);
  const [closeHour] = (plainSalon.workingHours?.close || '21:00').split(':').map(Number);
  const stylistCount = Math.max(1, plainSalon.stylists?.length || 1);
  const dateBookings = bookings.filter((booking) => !booking.date || booking.date === requestedDate);
  const bookingsBySlot = dateBookings.reduce((acc, booking) => {
    acc[booking.slot] = (acc[booking.slot] || 0) + 1;
    return acc;
  }, {});

  const allSlots = slotHours.map(([label, slotHour]) => {
    const booked = bookingsBySlot[label] || 0;
    const remaining = Math.max(0, stylistCount - booked);
    const disabled = slotHour < openHour || slotHour >= closeHour || remaining === 0 || (requestedDate === today && (hour < openHour || hour >= closeHour || slotHour <= hour));
    return { label, hour: slotHour, remaining, disabled };
  });

  const todayBookings = dateBookings.length;
  const capacity = stylistCount * slotHours.length;
  const seed = hashText(plainSalon._id || plainSalon.slug || plainSalon.name);
  const bookedCurve = capacity ? todayBookings / capacity : 0;
  const timeCurve = hour < openHour ? 0 : hour < 12 ? 0.38 : hour < 17 ? 0.72 : hour < 20 ? 0.88 : hour < closeHour ? 0.56 : 0;
  const variation = ((seed % 23) - 8) / 100;
  const isOpen = hour >= openHour && hour < closeHour;
  const isBeforeOpen = hour < openHour;
  const isAfterClose = hour >= closeHour;
  const occupancy = isBeforeOpen
    ? 0
    : isAfterClose
      ? Math.round(Math.min(100, Math.max(0, bookedCurve * 100)))
      : Math.round(Math.min(96, Math.max(12, (timeCurve * 0.55 + bookedCurve * 0.45 + variation) * 100)));
  const liveLevel = occupancy < 35 ? 'Low' : occupancy < 62 ? 'Moderate' : occupancy < 82 ? 'Busy' : 'Peak';
  const level = isOpen ? liveLevel : 'Closed';
  const nextSlot = allSlots.find((slot) => !slot.disabled);
  const statusText = hour < openHour ? 'Closed - Opens at 9:00 AM' : hour >= closeHour ? 'Closed Now' : `${level} occupancy`;

  return {
    isOpen,
    isBeforeOpen,
    isAfterClose,
    statusText,
    allSlots,
    availableSlots: allSlots.filter((slot) => !slot.disabled).map((slot) => slot.label),
    nextAvailableSlot: nextSlot?.label || 'Tomorrow 09:00 AM',
    todayBookings,
    capacity,
    occupancy,
    level
  };
}

export function crowdFromAvailability(availability) {
  return {
    isOpen: availability.isOpen,
    isBeforeOpen: availability.isBeforeOpen,
    isAfterClose: availability.isAfterClose,
    level: availability.level,
    occupancy: availability.occupancy,
    waitMinutes: availability.isOpen ? Math.max(0, Math.round((availability.occupancy - 18) / 4)) : 0,
    note: availability.statusText,
    bestVisitWindow: availability.nextAvailableSlot,
    confidence: availability.isOpen ? 88 : null,
    liveUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    todayBookings: availability.todayBookings
  };
}
