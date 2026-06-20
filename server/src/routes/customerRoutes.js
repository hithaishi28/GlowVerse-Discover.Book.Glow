import { Router } from 'express';
import {
  addToCart,
  clearCart,
  createSupportTicket,
  customerSummary,
  deleteNotification,
  getCart,
  getNotifications,
  getWishlist,
  markNotificationRead,
  moveWishlistServiceToCart,
  orders,
  removeCartItem,
  removeWishlistSalon,
  removeWishlistService,
  serviceSnapshotRules,
  supportRules,
  toggleWishlistSalon,
  toggleWishlistService,
  updateCartItem
} from '../controllers/customerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const customerRoutes = Router();

customerRoutes.use(requireAuth, requireRole('user'));
customerRoutes.get('/summary', customerSummary);
customerRoutes.get('/wishlist', getWishlist);
customerRoutes.post('/wishlist/salons/:salonId/toggle', toggleWishlistSalon);
customerRoutes.delete('/wishlist/salons/:salonId', removeWishlistSalon);
customerRoutes.post('/wishlist/services/toggle', serviceSnapshotRules, validate, toggleWishlistService);
customerRoutes.delete('/wishlist/services/:serviceId', removeWishlistService);
customerRoutes.post('/wishlist/services/:serviceId/move-to-cart', moveWishlistServiceToCart);
customerRoutes.get('/cart', getCart);
customerRoutes.post('/cart', serviceSnapshotRules, validate, addToCart);
customerRoutes.patch('/cart/:itemId', updateCartItem);
customerRoutes.delete('/cart/:itemId', removeCartItem);
customerRoutes.delete('/cart', clearCart);
customerRoutes.get('/orders', orders);
customerRoutes.post('/support-tickets', supportRules, validate, createSupportTicket);
customerRoutes.get('/notifications', getNotifications);
customerRoutes.patch('/notifications/:id/read', markNotificationRead);
customerRoutes.delete('/notifications/:id', deleteNotification);
