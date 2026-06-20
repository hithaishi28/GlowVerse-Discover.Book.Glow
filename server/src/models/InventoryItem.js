import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    category: String,
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    unitCost: { type: Number, default: 0 },
    supplier: String,
    lastRestockedAt: Date
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
