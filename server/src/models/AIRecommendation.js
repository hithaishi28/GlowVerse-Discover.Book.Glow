import mongoose from 'mongoose';

const aiRecommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prompt: String,
    recommendations: [
      {
        type: String,
        title: String,
        reason: String,
        score: Number
      }
    ]
  },
  { timestamps: true }
);

export const AIRecommendation = mongoose.model('AIRecommendation', aiRecommendationSchema);
