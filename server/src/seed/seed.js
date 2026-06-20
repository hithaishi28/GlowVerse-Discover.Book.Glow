import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Salon } from '../models/Salon.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Membership } from '../models/Membership.js';
import { Reward } from '../models/Reward.js';
import { GiftCard } from '../models/GiftCard.js';
import { Offer } from '../models/Offer.js';
import { Notification } from '../models/Notification.js';
import { QuizResult } from '../models/QuizResult.js';
import { AIRecommendation } from '../models/AIRecommendation.js';

const localities = [
  ['Koramangala', 12.9352, 77.6245],
  ['Whitefield', 12.9698, 77.75],
  ['HSR Layout', 12.9116, 77.6389],
  ['Indiranagar', 12.9784, 77.6408],
  ['Jayanagar', 12.925, 77.5938],
  ['RR Nagar', 12.9149, 77.5206],
  ['Kengeri', 12.9087, 77.4872],
  ['Nagarbhavi', 12.9596, 77.5113],
  ['Vijayanagar', 12.9719, 77.5323],
  ['Rajajinagar', 12.9915, 77.5545],
  ['Electronic City', 12.8452, 77.6602],
  ['Bellandur', 12.9304, 77.6784],
  ['Marathahalli', 12.9569, 77.7011],
  ['Hebbal', 13.0358, 77.597],
  ['Yelahanka', 13.1007, 77.5963]
];

const serviceCatalog = {
  Hair: ['Hair Cut', 'Hair Spa', 'Hair Coloring', 'Hair Styling', 'Smoothening', 'Straightening', 'Keratin'],
  Skin: ['Facial', 'Cleanup', 'Detan', 'Skin Treatments'],
  Nails: ['Manicure', 'Pedicure', 'Nail Art'],
  Makeup: ['Party Makeup', 'Bridal Makeup', 'Engagement Makeup', 'Reception Makeup'],
  Spa: ['Body Spa', 'Massage', 'Relaxation Therapy']
};

const brandWords = ['Luxe', 'Aura', 'Velvet', 'Muse', 'Bloom', 'Opal', 'Pearl', 'Noir', 'Serene', 'Nova', 'Radiance', 'Gilded'];
const salonTypes = ['Salon', 'Studio', 'Spa', 'Beauty Bar', 'Makeover Lounge', 'Glow Atelier'];
const people = ['Aarohi', 'Ishaan', 'Meera', 'Riya', 'Kabir', 'Ananya', 'Diya', 'Vivaan', 'Naina', 'Reyansh', 'Sana', 'Tara'];
const stylistFirstNames = [
  'Aarohi', 'Meera', 'Kabir', 'Tara', 'Sana', 'Rhea', 'Nikhil', 'Isha', 'Ananya', 'Pooja',
  'Dev', 'Maya', 'Kiara', 'Aditi', 'Rahul', 'Noor', 'Avni', 'Kavya', 'Ritika', 'Zoya',
  'Prisha', 'Naira', 'Mira', 'Tanvi', 'Rohan', 'Aditya', 'Simran', 'Lavanya', 'Dia', 'Reva',
  'Kunal', 'Nisha', 'Raina', 'Arjun', 'Leela', 'Mahi', 'Saira', 'Vedika', 'Ayaan', 'Jiya',
  'Harsh', 'Ayesha', 'Neil', 'Pari', 'Yash', 'Esha', 'Oviya', 'Manav', 'Tia', 'Reyansh'
];
const stylistSurnames = [
  'Rao', 'Shetty', 'Nair', 'Kapoor', 'Menon', 'Iyer', 'Bhat', 'Verma', 'Sen', 'Thomas',
  'Dsouza', 'Jain', 'Khan', 'Reddy', 'Pillai', 'Naidu', 'Kulkarni', 'Gowda', 'Shah', 'Malhotra'
];
const reviews = [
  'Loved the ambience and the stylist explained every step.',
  'Clean space, punctual appointment, and a polished finish.',
  'The bridal consultation was detailed and very calming.',
  'Great value for the service quality and hygiene.',
  'My hair feels softer and the staff were thoughtful.',
  'Booked last minute and still had a premium experience.'
];

function pick(list, index = Math.floor(Math.random() * list.length)) {
  return list[index % list.length];
}

function image(seed, width = 1200, height = 800) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

function servicesFor(index) {
  return Object.entries(serviceCatalog).flatMap(([category, names], categoryIndex) =>
    names.map((name, serviceIndex) => ({
      category,
      name,
      price: 499 + categoryIndex * 450 + serviceIndex * 180 + (index % 5) * 60,
      durationMinutes: 30 + serviceIndex * 10 + categoryIndex * 5,
      description: `Premium ${name.toLowerCase()} with consultation, hygiene prep, and finish care.`,
      popularity: 65 + ((index + serviceIndex) % 32)
    }))
  );
}

function stylistsFor(index) {
  return Array.from({ length: 3 }, (_, stylistIndex) => {
    const globalIndex = index * 3 + stylistIndex;
    return {
    name: `${stylistFirstNames[globalIndex % stylistFirstNames.length]} ${stylistSurnames[Math.floor(globalIndex / stylistFirstNames.length) % stylistSurnames.length]}`,
    title: pick(['Senior Stylist', 'Makeup Artist', 'Skin Therapist', 'Nail Expert', 'Spa Specialist'], index + stylistIndex),
    rating: Number((4.2 + ((index + stylistIndex) % 8) / 10).toFixed(1)),
    specialties: [pick(['Keratin', 'Bridal Makeup', 'Hair Color', 'Facials', 'Nail Art'], index + stylistIndex)],
    image: image(['1524504388940-b1c1722653e1', '1494790108377-be9c29b29330', '1500648767791-00dcc994a43e'][stylistIndex], 400, 400),
    experienceYears: 3 + ((index + stylistIndex) % 12)
  };
  });
}

async function run() {
  await connectDb();
  await Promise.all([
    User.deleteMany({}),
    Salon.deleteMany({}),
    Review.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Membership.deleteMany({}),
    Reward.deleteMany({}),
    GiftCard.deleteMany({}),
    Offer.deleteMany({}),
    Notification.deleteMany({}),
    QuizResult.deleteMany({}),
    AIRecommendation.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const [demoUser, owner, admin] = await User.create([
    { name: 'Aarohi Sharma', age: 27, gender: 'female', email: 'demo@glowverse.app', passwordHash, membershipTier: 'gold', rewardsPoints: 2450 },
    { name: 'Salon Owner', age: 34, gender: 'prefer_not_to_say', email: 'owner@glowverse.app', passwordHash, role: 'owner', membershipTier: 'platinum' },
    { name: 'Admin', age: 31, gender: 'prefer_not_to_say', email: 'admin@glowverse.app', passwordHash, role: 'admin', membershipTier: 'platinum' }
  ]);

  await Membership.create([
    { tier: 'silver', discountPercent: 5, monthlyPrice: 299, benefits: ['5% discount', 'Basic rewards'] },
    { tier: 'gold', discountPercent: 10, monthlyPrice: 699, benefits: ['10% discount', 'Priority booking'] },
    { tier: 'platinum', discountPercent: 15, monthlyPrice: 1299, benefits: ['15% discount', 'VIP support', 'Exclusive offers'] }
  ]);

  const salons = [];
  for (let i = 0; i < 100; i += 1) {
    const [locality, lat, lng] = pick(localities, i);
    const name = `${pick(brandWords, i)} ${pick(salonTypes, i + 3)} ${locality}`;
    salons.push({
      name,
      slug: `${slugify(name, { lower: true, strict: true })}-${i}`,
      description: `A premium beauty destination in ${locality} offering curated salon, spa, makeup, skin, and nail experiences.`,
      images: [
        image('1560066984-138dadb4c035'),
        image('1522337360788-8b13dee7a37e'),
        image('1600948836101-f9ffda59d250')
      ],
      locality,
      address: `${12 + i}, ${pick(['1st Main', '80 Feet Road', 'High Street', 'Market Road'], i)}, ${locality}, Bengaluru`,
      coordinates: { lat: lat + (Math.random() - 0.5) / 80, lng: lng + (Math.random() - 0.5) / 80 },
      contact: { phone: `+91 98${String(70000000 + i * 3417).slice(0, 8)}`, email: `hello${i}@glowverse-salon.app` },
      workingHours: { open: '09:00', close: '21:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      rating: Number((4.1 + (i % 9) / 10).toFixed(1)),
      reviewCount: 10,
      popularity: 60 + (i % 40),
      luxury: i % 3 === 0,
      ecoFriendly: i % 4 === 0,
      organicProducts: i % 4 === 0,
      crueltyFree: i % 5 === 0,
      sustainablePractices: i % 6 === 0,
      priceLevel: 1 + (i % 5),
      services: servicesFor(i),
      stylists: stylistsFor(i),
      offers: [{ title: 'First Glow Offer', description: '15% off for first-time guests', discountPercent: 15, validUntil: new Date(Date.now() + 45 * 86400000) }],
      owner: owner._id,
      availableSlots: ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM', '7:00 PM'],
      beforeAfterGallery: ['Hair', 'Makeup', 'Nails', 'Skin', 'Spa'].map((category, galleryIndex) => ({
        category,
        before: image('1516975080664-ed2fc6a32937', 600, 600),
        after: image(['1522337360788-8b13dee7a37e', '1487412947147-5cebf100ffc2', '1600948836101-f9ffda59d250'][galleryIndex % 3], 600, 600),
        caption: `${category} transformation`
      }))
    });
  }

  const createdSalons = await Salon.insertMany(salons);
  const reviewDocs = [];
  for (let i = 0; i < 1000; i += 1) {
    const salon = createdSalons[i % createdSalons.length];
    reviewDocs.push({
      salon: salon._id,
      user: demoUser._id,
      userName: pick(people, i),
      rating: 4 + (i % 2),
      comment: pick(reviews, i),
      photos: i % 5 === 0 ? [image('1522337360788-8b13dee7a37e', 500, 500)] : [],
      verified: true,
      helpfulVotes: i % 31,
      sentiment: i % 11 === 0 ? 'neutral' : 'positive',
      serviceName: pick(salon.services, i).name
    });
  }
  await Review.insertMany(reviewDocs);

  const bookings = [];
  for (let i = 0; i < 500; i += 1) {
    const salon = createdSalons[i % createdSalons.length];
    const service = salon.services[i % salon.services.length];
    const stylist = salon.stylists[i % salon.stylists.length];
    bookings.push({
      user: demoUser._id,
      salon: salon._id,
      service: { id: service._id.toString(), name: service.name, price: service.price, durationMinutes: service.durationMinutes },
      stylist: { id: stylist._id.toString(), name: stylist.name },
      date: `2026-07-${String((i % 25) + 1).padStart(2, '0')}`,
      slot: pick(salon.availableSlots, i),
      status: i % 4 === 0 ? 'completed' : 'confirmed',
      amount: service.price,
      invoiceNumber: `GV-2026-${String(i + 1).padStart(5, '0')}`
    });
  }
  await Booking.insertMany(bookings);

  await Reward.create([
    { user: demoUser._id, type: 'badge', title: 'Glow Getter', points: 0 },
    { user: demoUser._id, type: 'milestone', title: '5 bookings milestone', points: 500 },
    { user: demoUser._id, type: 'coupon', title: 'Birthday Glow Coupon', code: 'BDAYGLOW' }
  ]);

  await GiftCard.create({
    buyer: demoUser._id,
    recipientName: 'Aarohi',
    recipientEmail: 'aarohi@example.com',
    amount: 2500,
    message: 'For your next glow-up.',
    deliveryDate: '2026-07-01',
    qrCode: 'glowverse://gift-card/demo',
    code: 'GVGC-DEMO2026'
  });

  await Notification.create([
    { user: demoUser._id, title: 'Gold membership active', body: 'You now get 10% off bookings.', event: 'membership' },
    { user: demoUser._id, title: 'Reward unlocked', body: 'You earned the Glow Getter badge.', event: 'reward' }
  ]);

  console.log('Seed complete: 100 salons, 1000 reviews, 300 stylists, 500 bookings, demo rewards, memberships, gift cards, analytics-ready data.');
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
