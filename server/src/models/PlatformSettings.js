import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    commissionPercent: { type: Number, default: 12 },
    gstPercent: { type: Number, default: 18 },
    convenienceFee: { type: Number, default: 24 },
    cancellationWindowHours: { type: Number, default: 4 },
    payoutCycleDays: { type: Number, default: 7 }
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
