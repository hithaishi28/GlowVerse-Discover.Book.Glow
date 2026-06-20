import { Router } from 'express';
import { bookingRules, cancelBooking, createBooking, myBookings, rescheduleBooking, verifyBookingPayment } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);
bookingRoutes.get('/', myBookings);
bookingRoutes.post('/', bookingRules, validate, createBooking);
bookingRoutes.post('/verify-payment', verifyBookingPayment);
bookingRoutes.patch('/:id/cancel', cancelBooking);
bookingRoutes.patch('/:id/reschedule', rescheduleBooking);
