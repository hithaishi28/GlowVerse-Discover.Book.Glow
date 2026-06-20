import { Router } from 'express';
import { googleOAuth, login, loginRules, me, register, registerRules } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', registerRules, validate, register);
authRoutes.post('/login', loginRules, validate, login);
authRoutes.post('/google', googleOAuth);
authRoutes.get('/me', requireAuth, me);
