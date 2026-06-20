import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'gpay', 'phonepe', 'paytm', 'card', 'netbanking', 'wallet'],
      default: 'upi'
    },
    provider: { type: String, default: 'razorpay' },
    providerOrderId: String,
    providerPaymentId: String,
    providerSignature: String,
    transactionId: String,
    paidAt: Date,
    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' }
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
