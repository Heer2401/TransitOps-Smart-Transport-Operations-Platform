const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  type: { type: String, enum: ['Toll', 'Maintenance', 'Miscellaneous', 'Insurance', 'Permit', 'Fine', 'Parking'], required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  receipt: { type: String }, // file path or URL
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
