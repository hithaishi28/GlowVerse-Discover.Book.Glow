import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    response: String,
    resolvedAt: Date
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
