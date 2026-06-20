import { Router } from 'express';
import { adminAnalytics, adminDashboard, assistant, assistantRules, createGiftCard, dashboard, ownerDashboard, packages, quiz, spinReward } from '../controllers/experienceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const experienceRoutes = Router();

experienceRoutes.post('/assistant', assistantRules, validate, assistant);
experienceRoutes.post('/quiz', quiz);
experienceRoutes.get('/packages', packages);
experienceRoutes.use(requireAuth);
experienceRoutes.get('/dashboard', dashboard);
experienceRoutes.post('/spin', spinReward);
experienceRoutes.post('/gift-cards', createGiftCard);
experienceRoutes.get('/analytics', requireRole('admin', 'owner'), adminAnalytics);
experienceRoutes.get('/admin-dashboard', requireRole('admin'), adminDashboard);
experienceRoutes.get('/owner-dashboard', requireRole('owner'), ownerDashboard);
