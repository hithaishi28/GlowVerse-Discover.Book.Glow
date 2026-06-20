import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    category: String,
    name: String,
    price: Number,
    durationMinutes: Number,
    description: String,
    popularity: { type: Number, default: 70 }
  },
  { _id: true }
);

const stylistSchema = new mongoose.Schema(
  {
    name: String,
    title: String,
    rating: Number,
    specialties: [String],
    image: String,
    experienceYears: Number
  },
  { _id: true }
);

const salonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: 'text' },
    slug: { type: String, unique: true, index: true },
    description: String,
    images: [String],
    coverImage: String,
    locality: { type: String, index: true },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    workingHours: {
      open: String,
      close: String,
      days: [String]
    },
    rating: { type: Number, default: 4.5, index: true },
    reviewCount: { type: Number, default: 0 },
    popularity: { type: Number, default: 75, index: true },
    luxury: { type: Boolean, default: false },
    ecoFriendly: { type: Boolean, default: false },
    organicProducts: { type: Boolean, default: false },
    crueltyFree: { type: Boolean, default: false },
    sustainablePractices: { type: Boolean, default: false },
    priceLevel: { type: Number, min: 1, max: 5, default: 3 },
    services: [serviceSchema],
    stylists: [stylistSchema],
    offers: [
      {
        title: String,
        description: String,
        discountPercent: Number,
        validUntil: Date
      }
    ],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved: { type: Boolean, default: true },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'verified' },
    suspended: { type: Boolean, default: false },
    suspensionReason: String,
    availableSlots: [String],
    beforeAfterGallery: [
      {
        category: String,
        before: String,
        after: String,
        caption: String
      }
    ]
  },
  { timestamps: true }
);

salonSchema.index({ name: 'text', locality: 'text', 'services.name': 'text', 'stylists.name': 'text' });

export const Salon = mongoose.model('Salon', salonSchema);
