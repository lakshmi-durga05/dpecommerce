// Libraries
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  gstin: { type: String },
  paymentTermsDays: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('vendors', vendorSchema);
