import mongoose from 'mongoose';

const giftCardSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientName: String,
    recipientEmail: String,
    amount: Number,
    message: String,
    deliveryDate: String,
    qrCode: String,
    code: { type: String, unique: true },
    status: { type: String, enum: ['scheduled', 'sent', 'redeemed'], default: 'scheduled' }
  },
  { timestamps: true }
);

export const GiftCard = mongoose.model('GiftCard', giftCardSchema);
