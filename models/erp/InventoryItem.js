// Libraries
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  productId: { type: Number, required: true },
  name: { type: String, required: true },
  currentStock: { type: Number, default: 0 },
  reorderPoint: { type: Number, default: 10 },
  reorderQty: { type: Number, default: 50 },
  leadTimeDays: { type: Number, default: 7 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors' }
}, { timestamps: true });

module.exports = mongoose.model('inventory_items', inventoryItemSchema);
