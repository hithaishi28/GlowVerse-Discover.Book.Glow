import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['points', 'coupon', 'badge', 'milestone', 'spin'] },
    title: String,
    points: { type: Number, default: 0 },
    code: String,
    redeemed: { type: Boolean, default: false },
    expiresAt: Date
  },
  { timestamps: true }
);

export const Reward = mongoose.model('Reward', rewardSchema);
