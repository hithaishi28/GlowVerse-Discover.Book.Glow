import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 2500
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('glowverse_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchSalons(params = {}) {
  const { data } = await api.get('/salons', { params });
  return data;
}

export async function fetchSalon(slug) {
  const { data } = await api.get(`/salons/${slug}`);
  return data;
}

export async function fetchTrending() {
  const { data } = await api.get('/salons/trending');
  return data;
}

export async function fetchGoogleMapSalons(params = {}) {
  const { data } = await api.get('/maps/salons', { params });
  return data;
}

export async function createBooking(payload) {
  const { data } = await api.post('/bookings', payload);
  return data;
}

export async function verifyBookingPayment(payload) {
  const { data } = await api.post('/bookings/verify-payment', payload);
  return data;
}

export async function askAssistant(prompt, context = {}) {
  const { data } = await api.post('/experience/assistant', { prompt, ...context });
  return data;
}

export async function submitQuiz(payload) {
  const { data } = await api.post('/experience/quiz', payload);
  return data;
}

export async function fetchAdminDashboard() {
  const { data } = await api.get('/experience/admin-dashboard');
  return data;
}

export async function fetchOwnerDashboard() {
  const { data } = await api.get('/experience/owner-dashboard');
  return data;
}

export async function fetchCustomerSummary() {
  const { data } = await api.get('/customer/summary');
  return data;
}

export async function fetchWishlist() {
  const { data } = await api.get('/customer/wishlist');
  return data;
}

export async function toggleWishlistSalon(salonId) {
  const { data } = await api.post(`/customer/wishlist/salons/${salonId}/toggle`);
  return data;
}

export async function removeWishlistSalon(salonId) {
  const { data } = await api.delete(`/customer/wishlist/salons/${salonId}`);
  return data;
}

export async function toggleWishlistService(payload) {
  const { data } = await api.post('/customer/wishlist/services/toggle', payload);
  return data;
}

export async function removeWishlistService(serviceId) {
  const { data } = await api.delete(`/customer/wishlist/services/${serviceId}`);
  return data;
}

export async function moveWishlistServiceToCart(serviceId) {
  const { data } = await api.post(`/customer/wishlist/services/${serviceId}/move-to-cart`);
  return data;
}

export async function fetchCart() {
  const { data } = await api.get('/customer/cart');
  return data;
}

export async function addToCart(payload) {
  const { data } = await api.post('/customer/cart', payload);
  return data;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.patch(`/customer/cart/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/customer/cart/${itemId}`);
  return data;
}

export async function clearCart() {
  const { data } = await api.delete('/customer/cart');
  return data;
}

export async function fetchOrders() {
  const { data } = await api.get('/customer/orders');
  return data;
}

export async function createSupportTicket(payload) {
  const { data } = await api.post('/customer/support-tickets', payload);
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get('/customer/notifications');
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/customer/notifications/${id}/read`);
  return data;
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/customer/notifications/${id}`);
  return data;
}

export async function fetchOwnerWorkspace() {
  const { data } = await api.get('/management/owner/workspace');
  return data;
}

export async function updateOwnerSalon(salonId, payload) {
  const { data } = await api.patch(`/management/owner/salons/${salonId}`, payload);
  return data;
}

export async function updateOwnerSalonPhotos(salonId, payload) {
  const { data } = await api.patch(`/management/owner/salons/${salonId}/photos`, payload);
  return data;
}

export async function createOwnerService(salonId, payload) {
  const { data } = await api.post(`/management/owner/salons/${salonId}/services`, payload);
  return data;
}

export async function updateOwnerService(salonId, serviceId, payload) {
  const { data } = await api.patch(`/management/owner/salons/${salonId}/services/${serviceId}`, payload);
  return data;
}

export async function deleteOwnerService(salonId, serviceId) {
  const { data } = await api.delete(`/management/owner/salons/${salonId}/services/${serviceId}`);
  return data;
}

export async function createOwnerStylist(salonId, payload) {
  const { data } = await api.post(`/management/owner/salons/${salonId}/stylists`, payload);
  return data;
}

export async function updateOwnerStylist(salonId, stylistId, payload) {
  const { data } = await api.patch(`/management/owner/salons/${salonId}/stylists/${stylistId}`, payload);
  return data;
}

export async function deleteOwnerStylist(salonId, stylistId) {
  const { data } = await api.delete(`/management/owner/salons/${salonId}/stylists/${stylistId}`);
  return data;
}

export async function updateOwnerBookingStatus(id, status) {
  const { data } = await api.patch(`/management/owner/bookings/${id}/status`, { status });
  return data;
}

export async function createOwnerOffer(salonId, payload) {
  const { data } = await api.post(`/management/owner/salons/${salonId}/offers`, payload);
  return data;
}

export async function updateOwnerOffer(id, payload) {
  const { data } = await api.patch(`/management/owner/offers/${id}`, payload);
  return data;
}

export async function deleteOwnerOffer(id) {
  const { data } = await api.delete(`/management/owner/offers/${id}`);
  return data;
}

export async function createInventoryItem(salonId, payload) {
  const { data } = await api.post(`/management/owner/salons/${salonId}/inventory`, payload);
  return data;
}

export async function updateInventoryItem(id, payload) {
  const { data } = await api.patch(`/management/owner/inventory/${id}`, payload);
  return data;
}

export async function deleteInventoryItem(id) {
  const { data } = await api.delete(`/management/owner/inventory/${id}`);
  return data;
}

export async function replyToReview(id, text) {
  const { data } = await api.patch(`/management/owner/reviews/${id}/reply`, { text });
  return data;
}

export async function reportReview(id, reason) {
  const { data } = await api.patch(`/management/owner/reviews/${id}/report`, { reason });
  return data;
}

export function ownerReportUrl(format = 'csv') {
  return `${api.defaults.baseURL}/management/owner/reports/business?format=${format}`;
}

export async function fetchAdminWorkspace() {
  const { data } = await api.get('/management/admin/workspace');
  return data;
}

export async function adminUpdateUser(id, payload) {
  const { data } = await api.patch(`/management/admin/users/${id}`, payload);
  return data;
}

export async function adminDeleteUser(id) {
  const { data } = await api.delete(`/management/admin/users/${id}`);
  return data;
}

export async function adminModerateSalon(id, payload) {
  const { data } = await api.patch(`/management/admin/salons/${id}`, payload);
  return data;
}

export async function adminDeleteSalon(id) {
  const { data } = await api.delete(`/management/admin/salons/${id}`);
  return data;
}

export async function adminUpdateBookingStatus(id, status) {
  const { data } = await api.patch(`/management/admin/bookings/${id}/status`, { status });
  return data;
}

export async function adminModerateReview(id, payload) {
  const { data } = await api.patch(`/management/admin/reviews/${id}`, payload);
  return data;
}

export async function adminUpsertCategory(payload, id = '') {
  const { data } = id ? await api.patch(`/management/admin/categories/${id}`, payload) : await api.post('/management/admin/categories', payload);
  return data;
}

export async function adminDeleteCategory(id) {
  const { data } = await api.delete(`/management/admin/categories/${id}`);
  return data;
}

export async function adminUpdateTicket(id, payload) {
  const { data } = await api.patch(`/management/admin/tickets/${id}`, payload);
  return data;
}

export async function adminUpsertBanner(payload, id = '') {
  const { data } = id ? await api.patch(`/management/admin/banners/${id}`, payload) : await api.post('/management/admin/banners', payload);
  return data;
}

export async function adminDeleteBanner(id) {
  const { data } = await api.delete(`/management/admin/banners/${id}`);
  return data;
}

export async function adminUpdateSettings(payload) {
  const { data } = await api.patch('/management/admin/settings', payload);
  return data;
}

export async function adminSendAnnouncement(payload) {
  const { data } = await api.post('/management/admin/announcements', payload);
  return data;
}

export function adminReportUrl() {
  return `${api.defaults.baseURL}/management/admin/reports/platform`;
}
