import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['percentage', 'flat', 'first_time', 'seasonal', 'festival', 'membership', 'combo', 'referral', 'limited_time'],
      default: 'percentage'
    },
    discountPercent: Number,
    flatDiscount: Number,
    packageType: String,
    eligibleServices: [String],
    code: { type: String, uppercase: true, trim: true },
    startsAt: Date,
    validUntil: Date,
    active: { type: Boolean, default: true },
    redemptionCount: { type: Number, default: 0 },
    revenueAttributed: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Offer = mongoose.model('Offer', offerSchema);
