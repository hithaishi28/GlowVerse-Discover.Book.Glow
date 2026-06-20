import { Notification } from '../models/Notification.js';

export async function createNotification({ user, title, body, event, channel = 'in_app' }) {
  return Notification.create({ user, title, body, event, channel });
}
