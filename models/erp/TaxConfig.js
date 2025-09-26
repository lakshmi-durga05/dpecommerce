// Libraries
const mongoose = require('mongoose');

const taxConfigSchema = new mongoose.Schema({
  defaultGstRate: { type: Number, default: 18 }, // percent
  hsnRates: [{ hsn: String, rate: Number }]
}, { timestamps: true });

module.exports = mongoose.model('tax_configs', taxConfigSchema);
