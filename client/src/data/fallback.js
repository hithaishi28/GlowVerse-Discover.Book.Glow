export const fallbackImages = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=80'
];

export const localities = [
  'Whitefield',
  'Marathahalli',
  'KR Puram',
  'Indiranagar',
  'Koramangala',
  'HSR Layout',
  'Electronic City',
  'Bellandur',
  'Sarjapur Road',
  'Brookefield',
  'JP Nagar',
  'Jayanagar',
  'BTM Layout',
  'Banashankari',
  'RR Nagar',
  'Ullal',
  'Nagarbhavi',
  'Kengeri',
  'Basavanagudi',
  'Vijayanagar',
  'Padmanabhanagar',
  'Kumaraswamy Layout',
  'Kanakapura Road',
  'Girinagar',
  'Rajajinagar',
  'Malleswaram',
  'Hebbal',
  'Yelahanka',
  'Hennur',
  'Thanisandra',
  'RT Nagar',
  'Kalyan Nagar',
  'Mahadevapura',
  'Hoodi',
  'Varthur',
  'Panathur',
  'Domlur',
  'Ulsoor',
  'MG Road',
  'Brigade Road'
];

export const memberships = [
  { tier: 'Silver', price: 'Rs. 299/mo', discount: '5%', benefits: ['Basic rewards', 'Member-only coupons'] },
  { tier: 'Gold', price: 'Rs. 699/mo', discount: '10%', benefits: ['Priority booking', 'Rewards multiplier'] },
  { tier: 'Platinum', price: 'Rs. 1299/mo', discount: '15%', benefits: ['VIP support', 'Exclusive offers'] }
];

const serviceCatalog = [
  ['Hair', 'Hair Cut', 699, 35],
  ['Hair', 'Hair Spa', 1299, 60],
  ['Hair', 'Hair Coloring', 2499, 120],
  ['Hair', 'Smoothening', 3999, 150],
  ['Hair', 'Keratin', 4499, 150],
  ['Skin', 'Facial', 1499, 60],
  ['Skin', 'Cleanup', 899, 40],
  ['Skin', 'Detan', 1199, 45],
  ['Nails', 'Manicure', 799, 35],
  ['Nails', 'Pedicure', 999, 45],
  ['Nails', 'Nail Art', 1499, 75],
  ['Makeup', 'Party Makeup', 2999, 90],
  ['Makeup', 'Bridal Makeup', 7999, 180],
  ['Spa', 'Massage', 2199, 75],
  ['Spa', 'Body Spa', 3299, 100]
];

function hashText(value) {
  return String(value).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function servicesFor(index, seed = index) {
  const offset = hashText(seed) % 160;
  return serviceCatalog.filter((_, serviceIndex) => serviceIndex % 3 !== index % 3).slice(0, 10 + (index % 5)).map(([category, name, price, durationMinutes], serviceIndex) => ({
    _id: `service-${index}-${serviceIndex}`,
    category,
    name,
    price: price + index * 55 + offset,
    durationMinutes,
    description: `Premium ${name.toLowerCase()} with consultation, hygiene prep, and finish care.`
  }));
}

const stylistFirstNames = [
  'Aarohi', 'Meera', 'Kabir', 'Tara', 'Sana', 'Rhea', 'Nikhil', 'Isha', 'Ananya', 'Pooja',
  'Dev', 'Maya', 'Kiara', 'Aditi', 'Rahul', 'Noor', 'Avni', 'Kavya', 'Ritika', 'Zoya',
  'Prisha', 'Naira', 'Mira', 'Tanvi', 'Rohan', 'Aditya', 'Simran', 'Lavanya', 'Dia', 'Reva',
  'Kunal', 'Nisha', 'Raina', 'Arjun', 'Leela', 'Mahi', 'Saira', 'Vedika', 'Ayaan', 'Jiya'
];

const stylistSurnames = [
  'Rao', 'Shetty', 'Nair', 'Kapoor', 'Menon', 'Iyer', 'Bhat', 'Verma', 'Sen', 'Thomas',
  'Dsouza', 'Jain', 'Khan', 'Reddy', 'Pillai', 'Naidu', 'Kulkarni', 'Gowda', 'Shah', 'Malhotra'
];

function stylistNameFor(index, stylistIndex) {
  const globalIndex = index * 4 + stylistIndex;
  const first = stylistFirstNames[globalIndex % stylistFirstNames.length];
  const surname = stylistSurnames[Math.floor(globalIndex / stylistFirstNames.length) % stylistSurnames.length];
  return `${first} ${surname}`;
}

function stylistsFor(index) {
  const titles = ['Senior Stylist', 'Makeup Artist', 'Skin Therapist', 'Hair Colorist'];
  return Array.from({ length: 2 + (index % 3) }, (_, stylistIndex) => ({
    _id: `stylist-${index}-${stylistIndex}`,
    name: stylistNameFor(index, stylistIndex),
    title: titles[stylistIndex % titles.length],
    rating: Number((4.6 + stylistIndex * 0.1).toFixed(1)),
    specialties: [['Keratin', 'Hair Color'], ['Bridal Makeup', 'Soft Glam'], ['Facial', 'Detan'], ['Nails', 'Spa']][stylistIndex % 4],
    image: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'
    ][stylistIndex % 3],
    experienceYears: 4 + (index % 8) + stylistIndex
  }));
}

const coords = [
  [12.9698, 77.75],
  [12.9569, 77.7011],
  [13.0075, 77.6959],
  [12.9784, 77.6408],
  [12.9352, 77.6245],
  [12.9116, 77.6389],
  [12.8452, 77.6602],
  [12.9304, 77.6784],
  [12.9000, 77.6870],
  [12.9673, 77.7169],
  [12.9081, 77.5838],
  [12.9250, 77.5938],
  [12.9166, 77.6101],
  [12.9255, 77.5468],
  [12.9279, 77.5207],
  [12.9575, 77.4855],
  [12.9707, 77.5128],
  [12.9177, 77.4838],
  [12.9422, 77.5755],
  [12.9719, 77.5378],
  [12.9157, 77.5569],
  [12.9036, 77.5649],
  [12.8848, 77.5467],
  [12.9441, 77.5449],
  [12.9915, 77.5545],
  [13.0031, 77.5643],
  [13.0358, 77.597],
  [13.1007, 77.5963],
  [13.0350, 77.6430],
  [13.0558, 77.6328],
  [13.0196, 77.5968],
  [13.0221, 77.6408],
  [12.9914, 77.6922],
  [12.9918, 77.7159],
  [12.9389, 77.7412],
  [12.9355, 77.7046],
  [12.9610, 77.6387],
  [12.9779, 77.6247],
  [12.9756, 77.6068],
  [12.9716, 77.6072]
];

const salonNames = [
  'Bodycraft Salon & Spa',
  'YLG Salon',
  'Naturals Salon',
  'Lakme Salon',
  'Bounce Salon',
  'Green Trends',
  'Toni & Guy',
  'Looks Salon',
  'Enrich Salon',
  'Jawed Habib Hair & Beauty',
  'Jean-Claude Biguine Salon & Spa',
  'BBlunt Salon',
  'Limelite Salon and Spa',
  'Play Salon',
  'Lakme Salon RR Nagar',
  'Naturals Salon Ullal',
  'Green Trends Nagarbhavi',
  'YLG Salon Kengeri',
  'Bodycraft Basavanagudi',
  'Jawed Habib Vijayanagar',
  'Naturals Padmanabhanagar',
  'Green Trends Kumaraswamy Layout',
  'Lakme Salon Kanakapura Road',
  'YLG Salon Girinagar',
  'Mirrors & Within Salon',
  'Scent Lifestyle',
  'Cut & Style Salon',
  'Blown Salon',
  'Roshini Beauty Parlour',
  'Affinity Salon',
  'Studio 11 Salon & Spa',
  'Page 3 Luxury Salon',
  'F Salon',
  'Glam Studios',
  'The Glam Room',
  'Nailbox Salon',
  'Nandita Das Salon',
  'Kanya Beauty Salon',
  'Lavish Looks Salon',
  'Bangalore Beauty Salon'
];

export function salonAvailability(salon, now = new Date()) {
  const [openHour] = (salon.workingHours?.open || '09:00').split(':').map(Number);
  const [closeHour] = (salon.workingHours?.close || '21:00').split(':').map(Number);
  const hour = now.getHours() + now.getMinutes() / 60;
  const stylistCount = Math.max(1, salon.stylists?.length || 3);
  const seed = hashText(salon._id || salon.slug || salon.name);
  const slotLabels = ['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM', '08:00 PM'];
  const allSlots = slotLabels.map((label, index) => {
    const slotHour = [9, 10, 11.5, 13, 14.5, 16, 17.5, 19, 20][index];
    const booked = (seed + index * 17 + now.getDate()) % (stylistCount + 2);
    const remaining = Math.max(0, stylistCount - booked);
    return {
      label,
      hour: slotHour,
      remaining,
      disabled: slotHour <= hour || remaining === 0 || hour < openHour || hour >= closeHour
    };
  });
  const currentIndex = Math.max(0, Math.min(allSlots.length - 1, allSlots.findIndex((slot) => slot.hour > hour)));
  const todayBookings = allSlots.reduce((sum, slot) => sum + Math.max(0, stylistCount - slot.remaining), 0);
  const capacity = allSlots.length * stylistCount;
  const timeCurve = hour < openHour ? 0 : hour < 12 ? 0.38 : hour < 17 ? 0.72 : hour < 20 ? 0.88 : hour < closeHour ? 0.56 : 0;
  const bookedCurve = capacity ? todayBookings / capacity : 0;
  const variation = ((seed % 23) - 8) / 100;
  const isOpen = hour >= openHour && hour < closeHour;
  const isBeforeOpen = hour < openHour;
  const isAfterClose = hour >= closeHour;
  const occupancy = isBeforeOpen
    ? 0
    : isAfterClose
      ? Math.round(Math.min(100, Math.max(0, bookedCurve * 100)))
      : Math.round(Math.min(96, Math.max(12, (timeCurve * 0.65 + bookedCurve * 0.35 + variation) * 100)));
  const liveLevel = occupancy < 35 ? 'Low' : occupancy < 62 ? 'Moderate' : occupancy < 82 ? 'Busy' : 'Peak';
  const level = isOpen ? liveLevel : 'Closed';
  const nextSlot = allSlots.find((slot) => !slot.disabled);
  const statusText = hour < openHour
    ? 'Closed - Opens at 9:00 AM'
    : hour >= closeHour
      ? 'Closed Now'
      : `${level} occupancy`;
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
    currentIndex,
    occupancy,
    level
  };
}

function crowdFor(salon) {
  const availability = salonAvailability(salon);
  const occupancy = availability.occupancy;
  const level = availability.level;
  return {
    isOpen: availability.isOpen,
    isBeforeOpen: availability.isBeforeOpen,
    isAfterClose: availability.isAfterClose,
    level,
    occupancy,
    waitMinutes: availability.isOpen ? Math.max(0, Math.round((occupancy - 18) / 4)) : 0,
    note: availability.statusText,
    bestVisitWindow: availability.nextAvailableSlot,
    confidence: availability.isOpen ? 82 + (hashText(salon.slug) % 12) : null,
    liveUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    todayBookings: availability.todayBookings
  };
}

export const fallbackSalons = salonNames.map((name, index) => {
  const locality = localities[index];
  const [lat, lng] = coords[index];
  const salon = {
    _id: `fallback-${index}`,
    name,
    slug: `demo-${locality.toLowerCase().replaceAll(' ', '-')}`,
    description: `${name} is a Bangalore salon listing near ${locality}, enhanced in GlowVerse with booking, services, stylists, crowd intelligence, and payment flow.`,
    locality,
    address: `${18 + index}, ${locality} Main Road, ${locality}, Bengaluru`,
    coordinates: { lat, lng },
    contact: { phone: `+91 98765 43${String(210 + index)}`, email: `hello${index}@glowverse.app`, website: 'https://glowverse.app' },
    workingHours: { open: '09:00', close: '21:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    images: [fallbackImages[index % fallbackImages.length], fallbackImages[(index + 1) % fallbackImages.length], fallbackImages[(index + 2) % fallbackImages.length]],
    rating: Number(Math.min(4.9, 4.35 + (index % 8) * 0.07).toFixed(1)),
    reviewCount: 180 + index * 27,
    popularity: 96 - index * 4,
    luxury: index % 2 === 0,
    ecoFriendly: index % 3 === 0,
    organicProducts: index % 3 === 0,
    crueltyFree: index % 2 === 1,
    sustainablePractices: index % 3 === 0,
    distanceKm: 2 + index,
    travelTimeMinutes: 11 + index * 4,
    openNow: true,
    priceLevel: 2 + (index % 3),
    preciseGoogleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${locality} Bengaluru`)}`,
    services: servicesFor(index, name),
    stylists: stylistsFor(index),
    offers: [{ title: 'First Glow Offer', description: '15% off for first-time guests', discountPercent: 15 }],
    beforeAfterGallery: ['Hair', 'Makeup', 'Nails', 'Skin', 'Spa'].map((category, galleryIndex) => ({
      category,
      before: fallbackImages[(galleryIndex + 2) % fallbackImages.length],
      after: fallbackImages[(galleryIndex + 3) % fallbackImages.length],
      caption: `${category} transformation`
    }))
  };
  const availability = salonAvailability(salon);
  return {
    ...salon,
    openNow: availability.isOpen,
    availability,
    availableSlots: availability.availableSlots,
    crowd: crowdFor(salon)
  };
});

export function fallbackSalonDetails(slug) {
  const baseSalon = fallbackSalons.find((item) => item.slug === slug) || fallbackSalons[0];
  const availability = salonAvailability(baseSalon);
  const salon = { ...baseSalon, availability, availableSlots: availability.availableSlots, openNow: availability.isOpen, crowd: crowdFor(baseSalon) };
  const reviews = ['Loved the ambience and stylist detail.', 'Very clean, punctual, and premium.', 'My hair and skin felt amazing after the session.', 'The team helped me choose the right package.', 'Great service and beautiful interiors.'].map((comment, index) => ({
    _id: `review-${salon._id}-${index}`,
    userName: ['Riya', 'Ananya', 'Tara', 'Sana', 'Meera'][index],
    rating: index === 3 ? 4 : 5,
    comment,
    verified: true,
    helpfulVotes: 12 - index
  }));
  return {
    salon,
    reviews,
    ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: rating === 5 ? 4 : rating === 4 ? 1 : 0 })),
    aiSentimentSummary: '92% of verified reviews are positive, with guests praising ambience, hygiene, stylist skill, and appointment punctuality.'
  };
}

export function filterFallbackSalons(filters = {}) {
  const q = (filters.q || '').toLowerCase();
  const locality = (filters.locality || '').toLowerCase();
  const origin = locality ? fallbackSalons.find((salon) => salon.locality.toLowerCase().includes(locality))?.coordinates : null;
  function distanceFromOrigin(salon) {
    if (!origin) return salon.distanceKm || 99;
    const dLat = salon.coordinates.lat - origin.lat;
    const dLng = salon.coordinates.lng - origin.lng;
    return Number((Math.sqrt(dLat ** 2 + dLng ** 2) * 111).toFixed(1));
  }
  return fallbackSalons
    .filter((salon) => {
      const haystack = [salon.name, salon.locality, ...salon.services.map((service) => service.name), ...salon.stylists.map((stylist) => stylist.name)].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (filters.rating && salon.rating < Number(filters.rating)) return false;
      if (filters.service && !salon.services.some((service) => service.category.toLowerCase() === filters.service.toLowerCase() || service.name.toLowerCase().includes(filters.service.toLowerCase()))) return false;
      if (filters.priceRange) {
        const lowestPrice = Math.min(...salon.services.map((service) => service.price));
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (lowestPrice < min || lowestPrice > max) return false;
      }
      if (filters.luxury === 'true' && !salon.luxury) return false;
      if (filters.ecoFriendly === 'true' && !salon.ecoFriendly) return false;
      if (filters.openNow === 'true' && !salon.openNow) return false;
      if (filters.distance && distanceFromOrigin(salon) > Number(filters.distance)) return false;
      return true;
    })
    .map((salon) => ({ ...salon, distanceKm: distanceFromOrigin(salon), travelTimeMinutes: Math.max(5, Math.round(distanceFromOrigin(salon) * 4)) }))
    .sort((a, b) => {
      if (filters.sort === 'price') return a.priceLevel - b.priceLevel;
      if (filters.sort === 'distance') return a.distanceKm - b.distanceKm;
      if (filters.sort === 'popularity') return b.popularity - a.popularity;
      return b.rating - a.rating;
    });
}
