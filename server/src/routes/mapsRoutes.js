import { Router } from 'express';
import { googleSalons } from '../controllers/mapsController.js';

export const mapsRoutes = Router();

mapsRoutes.get('/salons', googleSalons);
