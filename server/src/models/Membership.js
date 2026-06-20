import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    tier: { type: String, enum: ['silver', 'gold', 'platinum'], unique: true },
    discountPercent: Number,
    benefits: [String],
    monthlyPrice: Number
  },
  { timestamps: true }
);

export const Membership = mongoose.model('Membership', membershipSchema);
