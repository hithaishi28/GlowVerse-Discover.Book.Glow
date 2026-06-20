import { body } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { Salon } from '../models/Salon.js';
import { QuizResult } from '../models/QuizResult.js';
import { AIRecommendation } from '../models/AIRecommendation.js';
import { GiftCard } from '../models/GiftCard.js';
import { Reward } from '../models/Reward.js';
import { Notification } from '../models/Notification.js';
import { Membership } from '../models/Membership.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBeautyAssistantReply } from '../services/aiService.js';
import { buildAdminDashboardSnapshot, buildAnalyticsSnapshot, buildOwnerDashboardSnapshot } from '../services/analyticsService.js';

export const assistantRules = [
  body('prompt').trim().isLength({ min: 3 }),
  body('history').optional().isArray(),
  body('preferences').optional().isObject()
];

export const assistant = asyncHandler(async (req, res) => {
  const reply = await getBeautyAssistantReply(req.body.prompt, req.user, {
    history: req.body.history || [],
    preferences: req.body.preferences || {}
  });
  if (req.user) {
    await AIRecommendation.create({ user: req.user._id, prompt: req.body.prompt, recommendations: reply.recommendations });
  }
  res.json(reply);
});

export const quiz = asyncHandler(async (req, res) => {
  const answers = req.body;
  const salons = await Salon.find({ locality: new RegExp(answers.location || '', 'i') }).sort({ rating: -1 }).limit(4);
  const result = await QuizResult.create({
    user: req.user?._id,
    answers,
    beautyProfile: `${answers.occasion || 'Everyday'} glow profile for ${answers.hairType || 'balanced'} hair and ${answers.skinType || 'normal'} skin.`,
    recommendations: [
      answers.occasion?.toLowerCase().includes('wedding') ? 'Bridal makeup trial' : 'Signature facial',
      answers.hairType === 'frizzy' ? 'Keratin smoothening' : 'Hair spa',
      'Stylist consultation'
    ],
    salonRecommendations: salons.map((salon) => salon._id),
    aiMatchScore: 91
  });
  res.status(201).json({ result, salons });
});

export const spinReward = asyncHandler(async (req, res) => {
  const rewards = [
    { title: '₹250 Glow coupon', type: 'coupon', code: `GLOW${Math.floor(Math.random() * 9000 + 1000)}` },
    { title: '150 loyalty points', type: 'points', points: 150 },
    { title: 'Free hair spa add-on', type: 'coupon', code: 'SPAADDON' },
    { title: 'Gold membership 1-day boost', type: 'coupon', code: 'GOLDDAY' }
  ];
  const won = rewards[Math.floor(Math.random() * rewards.length)];
  const reward = await Reward.create({ user: req.user._id, ...won, expiresAt: new Date(Date.now() + 14 * 86400000) });
  res.json({ reward });
});

export const createGiftCard = asyncHandler(async (req, res) => {
  const card = await GiftCard.create({
    buyer: req.user._id,
    ...req.body,
    code: `GVGC-${uuidv4().slice(0, 8).toUpperCase()}`,
    qrCode: `glowverse://gift-card/${uuidv4()}`
  });
  res.status(201).json({ giftCard: card });
});

export const dashboard = asyncHandler(async (req, res) => {
  const [rewards, giftCards, notifications, memberships] = await Promise.all([
    Reward.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20),
    GiftCard.find({ buyer: req.user._id }).sort({ createdAt: -1 }).limit(10),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20),
    Membership.find().sort({ monthlyPrice: 1 })
  ]);
  res.json({ user: req.user, rewards, giftCards, notifications, memberships });
});

export const adminAnalytics = asyncHandler(async (req, res) => {
  res.json(await buildAnalyticsSnapshot(req.user));
});

export const adminDashboard = asyncHandler(async (_req, res) => {
  res.json(await buildAdminDashboardSnapshot());
});

export const ownerDashboard = asyncHandler(async (req, res) => {
  res.json(await buildOwnerDashboardSnapshot(req.user._id));
});

export const packages = asyncHandler(async (_req, res) => {
  res.json({
    packages: ['Wedding', 'Engagement', 'Reception', 'Date Night', 'Party', 'Interview', 'Corporate Event', 'College Event'].map(
      (occasion, index) => ({
        occasion,
        title: `${occasion} Glow Package`,
        price: 1999 + index * 600,
        inclusions: ['Consultation', 'Salon service bundle', 'Priority stylist matching'],
        matchScore: 94 - index
      })
    )
  });
});
