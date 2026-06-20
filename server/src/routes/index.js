import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { salonRoutes } from './salonRoutes.js';
import { bookingRoutes } from './bookingRoutes.js';
import { experienceRoutes } from './experienceRoutes.js';
import { mapsRoutes } from './mapsRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { managementRoutes } from './managementRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => res.json({ ok: true, name: 'GlowVerse API' }));
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/salons', salonRoutes);
apiRoutes.use('/bookings', bookingRoutes);
apiRoutes.use('/experience', experienceRoutes);
apiRoutes.use('/maps', mapsRoutes);
apiRoutes.use('/customer', customerRoutes);
apiRoutes.use('/management', managementRoutes);
