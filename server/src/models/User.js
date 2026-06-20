import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, min: 13, max: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: String,
    avatar: String,
    phone: String,
    gender: { type: String, enum: ['female', 'male', 'other', 'prefer_not_to_say'] },
    status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
    role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
    googleId: String,
    membershipTier: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none' },
    rewardsPoints: { type: Number, default: 0 },
    savedSalons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salon' }],
    savedServices: [
      {
        salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
        salonName: String,
        salonSlug: String,
        serviceId: String,
        name: String,
        category: String,
        price: Number,
        durationMinutes: Number,
        image: String
      }
    ],
    cart: [
      {
        salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon' },
        salonName: String,
        salonSlug: String,
        serviceId: String,
        name: String,
        category: String,
        price: Number,
        durationMinutes: Number,
        quantity: { type: Number, default: 1, min: 1 }
      }
    ],
    favoriteServices: [String],
    preferences: {
      hairType: String,
      skinType: String,
      budget: Number,
      location: String
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
