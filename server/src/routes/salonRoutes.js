import { Router } from 'express';
import { getSalon, listSalons, nearbySalons, trending } from '../controllers/salonController.js';

export const salonRoutes = Router();

salonRoutes.get('/', listSalons);
salonRoutes.get('/nearby', nearbySalons);
salonRoutes.get('/trending', trending);
salonRoutes.get('/:slug', getSalon);
