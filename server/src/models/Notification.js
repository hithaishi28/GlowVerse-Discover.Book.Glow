import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], default: 'in_app' },
    title: String,
    body: String,
    event: String,
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
