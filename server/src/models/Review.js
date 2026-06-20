import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    photos: [String],
    verified: { type: Boolean, default: true },
    helpfulVotes: { type: Number, default: 0 },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'positive' },
    serviceName: String,
    ownerReply: {
      text: String,
      repliedAt: Date
    },
    reported: { type: Boolean, default: false },
    reportReason: String,
    status: { type: String, enum: ['published', 'reported', 'hidden'], default: 'published' }
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
