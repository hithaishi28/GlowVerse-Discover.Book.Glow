import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    imageUrl: String,
    linkUrl: String,
    placement: { type: String, default: 'home' },
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date
  },
  { timestamps: true }
);

export const Banner = mongoose.model('Banner', bannerSchema);
