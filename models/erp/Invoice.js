// Libraries
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'sales_orders' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  orderRef: { type: String },
  items: [invoiceItemSchema],
  subTotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  gstNumber: { type: String },
  billingAddress: { type: String },
  status: { type: String, enum: ['issued', 'paid', 'cancelled'], default: 'issued' }
}, { timestamps: true });

module.exports = mongoose.model('invoices', invoiceSchema);
