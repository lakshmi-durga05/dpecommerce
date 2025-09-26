// Libraries
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors' },
  sku: { type: String },
  productId: { type: Number },
  name: { type: String },
  type: { type: String, enum: ['low_stock', 'forecast_shortage'], default: 'low_stock' },
  message: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('notifications', notificationSchema);
