import { Router } from 'express';
import {
  adminAnnouncement,
  adminDeleteBanner,
  adminDeleteCategory,
  adminDeleteSalon,
  adminDeleteUser,
  adminModerateReview,
  adminModerateSalon,
  adminReport,
  adminUpdateBookingStatus,
  adminUpdateSettings,
  adminUpdateTicket,
  adminUpdateUser,
  adminUpsertBanner,
  adminUpsertCategory,
  adminWorkspace,
  createInventoryItem,
  createOwnerOffer,
  createOwnerService,
  createOwnerStylist,
  deleteInventoryItem,
  deleteOwnerOffer,
  deleteOwnerService,
  deleteOwnerStylist,
  ownerReport,
  ownerWorkspace,
  replyToReview,
  reportReview,
  updateInventoryItem,
  updateOwnerBookingStatus,
  updateOwnerOffer,
  updateOwnerPhotos,
  updateOwnerSalon,
  updateOwnerService,
  updateOwnerStylist
} from '../controllers/managementController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const managementRoutes = Router();

managementRoutes.use(requireAuth);

managementRoutes.get('/owner/workspace', requireRole('owner'), ownerWorkspace);
managementRoutes.patch('/owner/salons/:salonId', requireRole('owner'), updateOwnerSalon);
managementRoutes.patch('/owner/salons/:salonId/photos', requireRole('owner'), updateOwnerPhotos);
managementRoutes.post('/owner/salons/:salonId/services', requireRole('owner'), createOwnerService);
managementRoutes.patch('/owner/salons/:salonId/services/:id', requireRole('owner'), updateOwnerService);
managementRoutes.delete('/owner/salons/:salonId/services/:id', requireRole('owner'), deleteOwnerService);
managementRoutes.post('/owner/salons/:salonId/stylists', requireRole('owner'), createOwnerStylist);
managementRoutes.patch('/owner/salons/:salonId/stylists/:id', requireRole('owner'), updateOwnerStylist);
managementRoutes.delete('/owner/salons/:salonId/stylists/:id', requireRole('owner'), deleteOwnerStylist);
managementRoutes.patch('/owner/bookings/:id/status', requireRole('owner'), updateOwnerBookingStatus);
managementRoutes.post('/owner/salons/:salonId/offers', requireRole('owner'), createOwnerOffer);
managementRoutes.patch('/owner/offers/:id', requireRole('owner'), updateOwnerOffer);
managementRoutes.delete('/owner/offers/:id', requireRole('owner'), deleteOwnerOffer);
managementRoutes.post('/owner/salons/:salonId/inventory', requireRole('owner'), createInventoryItem);
managementRoutes.patch('/owner/inventory/:id', requireRole('owner'), updateInventoryItem);
managementRoutes.delete('/owner/inventory/:id', requireRole('owner'), deleteInventoryItem);
managementRoutes.patch('/owner/reviews/:id/reply', requireRole('owner'), replyToReview);
managementRoutes.patch('/owner/reviews/:id/report', requireRole('owner'), reportReview);
managementRoutes.get('/owner/reports/business', requireRole('owner'), ownerReport);

managementRoutes.get('/admin/workspace', requireRole('admin'), adminWorkspace);
managementRoutes.patch('/admin/users/:id', requireRole('admin'), adminUpdateUser);
managementRoutes.delete('/admin/users/:id', requireRole('admin'), adminDeleteUser);
managementRoutes.patch('/admin/salons/:id', requireRole('admin'), adminModerateSalon);
managementRoutes.delete('/admin/salons/:id', requireRole('admin'), adminDeleteSalon);
managementRoutes.patch('/admin/bookings/:id/status', requireRole('admin'), adminUpdateBookingStatus);
managementRoutes.patch('/admin/reviews/:id', requireRole('admin'), adminModerateReview);
managementRoutes.post('/admin/categories', requireRole('admin'), adminUpsertCategory);
managementRoutes.patch('/admin/categories/:id', requireRole('admin'), adminUpsertCategory);
managementRoutes.delete('/admin/categories/:id', requireRole('admin'), adminDeleteCategory);
managementRoutes.patch('/admin/tickets/:id', requireRole('admin'), adminUpdateTicket);
managementRoutes.post('/admin/banners', requireRole('admin'), adminUpsertBanner);
managementRoutes.patch('/admin/banners/:id', requireRole('admin'), adminUpsertBanner);
managementRoutes.delete('/admin/banners/:id', requireRole('admin'), adminDeleteBanner);
managementRoutes.patch('/admin/settings', requireRole('admin'), adminUpdateSettings);
managementRoutes.post('/admin/announcements', requireRole('admin'), adminAnnouncement);
managementRoutes.get('/admin/reports/platform', requireRole('admin'), adminReport);
