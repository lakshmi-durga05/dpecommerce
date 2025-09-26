// Libraries
const mongoose = require('mongoose');

const soItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 } // GST %
}, { _id: false });

const salesOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  items: [soItemSchema],
  subTotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' },
  payment: {
    provider: { type: String, default: 'razorpay' },
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('sales_orders', salesOrderSchema);
