// Libraries
const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
  items: [poItemSchema],
  status: { type: String, enum: ['draft', 'placed', 'received', 'cancelled'], default: 'draft' },
  expectedDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('purchase_orders', purchaseOrderSchema);
