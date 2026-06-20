import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
    service: {
      id: String,
      name: String,
      price: Number,
      durationMinutes: Number
    },
    stylist: {
      id: String,
      name: String
    },
    date: String,
    slot: String,
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'rescheduled', 'completed'],
      default: 'pending_payment'
    },
    amount: Number,
    discount: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 0 },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    invoiceNumber: String,
    calendarUrl: String
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
