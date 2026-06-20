import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: {
      hairType: String,
      skinType: String,
      budget: Number,
      occasion: String,
      location: String
    },
    beautyProfile: String,
    recommendations: [String],
    salonRecommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }],
    aiMatchScore: Number
  },
  { timestamps: true }
);

export const QuizResult = mongoose.model('QuizResult', quizResultSchema);
