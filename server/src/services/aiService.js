import { Salon } from '../models/Salon.js';

const serviceCosts = {
  keratin: 2500,
  smoothening: 3200,
  haircut: 700,
  'hair spa': 1300,
  facial: 1500,
  cleanup: 900,
  detan: 1100,
  makeup: 3000,
  bridal: 8000,
  nails: 900,
  manicure: 800,
  pedicure: 1000,
  spa: 2200,
  package: 2500
};

const serviceKeywords = Object.keys(serviceCosts).sort((a, b) => b.length - a.length);
const concernKeywords = ['frizz', 'dullness', 'tan', 'acne', 'pigmentation', 'hairfall', 'hair fall', 'dryness', 'sensitive scalp', 'dark spots'];

function extractBudget(text, fallback) {
  const normalized = text.replace(/,/g, '');
  const compact = normalized.match(/(?:rs\.?|inr|under|below|budget|within)\s*([0-9]+(?:\.[0-9]+)?)\s*k?\b/);
  const loose = normalized.match(/\b([0-9]+(?:\.[0-9]+)?)\s*k\b/) || normalized.match(/\b([0-9]{3,6})\b/);
  const match = compact || loose;
  if (!match) return Number(fallback || 3000);
  const raw = Number(match[1]);
  return Math.round(match[0].toLowerCase().includes('k') ? raw * 1000 : raw);
}

function inferIntent(prompt, preferences = {}) {
  const text = `${prompt} ${Object.values(preferences).join(' ')}`.toLowerCase();
  const budget = extractBudget(text, preferences.budget);
  const locality = ['whitefield', 'koramangala', 'indiranagar', 'jayanagar', 'hsr layout', 'marathahalli', 'bellandur', 'hebbal', 'yelahanka', 'electronic city'].find((item) => text.includes(item));
  const matchedService = serviceKeywords.find((item) => text.includes(item));
  const matchedOccasion = ['wedding', 'bridal', 'party', 'interview', 'date night', 'corporate', 'college'].find((item) => text.includes(item));
  const matchedHairType = ['frizzy', 'curly', 'wavy', 'straight', 'fine', 'dry'].find((item) => text.includes(item));
  const matchedSkinType = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne'].find((item) => text.includes(item));
  const matchedFaceShape = ['oval', 'round', 'heart', 'square', 'diamond'].find((item) => text.includes(item));
  const service = matchedService || preferences.preferredService || 'personalized beauty package';
  const occasion = matchedOccasion || preferences.occasion || 'everyday glow';
  const hairType = matchedHairType || preferences.hairType || 'balanced';
  const skinType = matchedSkinType || preferences.skinType || 'normal';
  const faceShape = matchedFaceShape || preferences.faceShape || 'oval';
  const concerns = concernKeywords.filter((item) => text.includes(item));
  const signalCount = [matchedService, locality, matchedOccasion, matchedHairType, matchedSkinType, matchedFaceShape, ...concerns].filter(Boolean).length;
  const hasUsefulSignal = signalCount > 0 || /\b(hair|skin|face|makeup|salon|budget|rs|inr|under|below|wedding|party)\b/.test(text);
  return { budget, locality, service, occasion, hairType, skinType, faceShape, concerns, hasUsefulSignal };
}

function servicePlan(intent) {
  const hairPlan = intent.hairType === 'frizzy'
    ? 'Keratin smoothing with moisture-lock hair spa'
    : intent.hairType === 'curly'
      ? 'Curl-defining cut with hydration mask'
      : 'Shape-enhancing haircut with gloss finish';
  const skinPlan = intent.skinType === 'oily' || intent.skinType === 'acne'
    ? 'Oil-control cleanup with calming facial'
    : intent.skinType === 'sensitive'
      ? 'Barrier-repair sensitive-skin facial'
      : 'Hydra glow facial with gentle detan';
  const makeupPlan = intent.occasion.includes('wedding') || intent.occasion.includes('bridal')
    ? 'Long-wear bridal makeup trial and hair styling'
    : intent.occasion.includes('interview')
      ? 'Natural grooming, haircut, and subtle skin prep'
      : 'Soft glam makeup and blow-dry styling';
  const packagePlan = intent.service === 'package'
    ? `${intent.occasion} salon package with consultation, ${hairPlan.toLowerCase()}, and ${skinPlan.toLowerCase()}`
    : null;
  return [hairPlan, skinPlan, makeupPlan, packagePlan].filter(Boolean);
}

export async function getBeautyAssistantReply(prompt, user = null, context = {}) {
  const intent = inferIntent(prompt, context.preferences);
  if (!intent.hasUsefulSignal) {
    return {
      message: 'I can help, but I need one or two beauty details first.',
      analysis: 'Please share a skin type, hair type, face shape, concern, preferred service, occasion, locality, or budget.',
      recommendedServices: [],
      estimatedCost: 0,
      benefits: ['More details make the recommendation personal instead of generic.'],
      maintenanceRoutine: [],
      recommendations: [],
      userContext: user ? { name: user.name, membershipTier: user.membershipTier } : null,
      historyCount: context.history?.length || 0
    };
  }
  const salonFilter = intent.locality ? { locality: new RegExp(intent.locality, 'i') } : {};
  let salons = await Salon.find(salonFilter).sort({ rating: -1, popularity: -1 }).limit(3).lean();
  if (!salons.length) salons = await Salon.find().sort({ rating: -1, popularity: -1 }).limit(3).lean();

  const plans = servicePlan(intent);
  const estimatedCost = Math.min(
    Math.max(serviceCosts[intent.service] || 1800, Math.round(intent.budget * 0.82)),
    intent.budget
  );
  const analysis = [
    `Hair profile: ${intent.hairType} hair with ${intent.faceShape} face shape.`,
    `Skin profile: ${intent.skinType} skin${intent.concerns.length ? ` with ${intent.concerns.join(', ')} concern(s)` : ''}.`,
    `Occasion: ${intent.occasion}. Budget target: Rs. ${intent.budget.toLocaleString('en-IN')}.`
  ].join(' ');

  return {
    message: `Here is a tailored GlowVerse plan for ${intent.occasion} within Rs. ${intent.budget.toLocaleString('en-IN')}.`,
    analysis,
    recommendedServices: plans,
    estimatedCost,
    benefits: [
      'Balances hair, skin, and occasion needs in one appointment plan.',
      'Prioritizes treatments that fit your budget before premium add-ons.',
      'Suggests salons by rating, locality match, and service coverage.'
    ],
    maintenanceRoutine: [
      intent.hairType === 'frizzy' ? 'Use sulfate-free shampoo and weekly mask for 4 weeks.' : 'Use heat protectant before styling.',
      intent.skinType === 'sensitive' ? 'Avoid actives for 24 hours after facial.' : 'Use sunscreen daily after skin treatments.',
      'Book a follow-up consultation in 4-6 weeks.'
    ],
    recommendations: salons.map((salon, index) => ({
      type: index === 0 ? 'Best match' : index === 1 ? 'Budget match' : 'Premium match',
      title: salon.name,
      reason: `${salon.rating} rated salon in ${salon.locality}. Recommended for ${plans[index % plans.length].toLowerCase()}.`,
      score: Math.max(84, 97 - index * 5),
      price: estimatedCost + index * 450
    })),
    userContext: user ? { name: user.name, membershipTier: user.membershipTier } : null,
    historyCount: context.history?.length || 0
  };
}

export function summarizeSentiment(reviews) {
  if (!reviews.length) return 'No reviews yet. Early guests can shape this salon profile.';
  const positive = reviews.filter((review) => review.sentiment === 'positive').length;
  const ratio = Math.round((positive / reviews.length) * 100);
  return `${ratio}% of verified reviews are positive, with guests frequently praising ambience, hygiene, stylist skill, and appointment punctuality.`;
}
