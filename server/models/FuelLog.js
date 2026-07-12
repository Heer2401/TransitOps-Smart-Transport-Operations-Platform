const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  liters: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  pricePerLiter: { type: Number, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  odometer: { type: Number, min: 0 },
  station: { type: String, trim: true },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'CNG'], default: 'Diesel' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FuelLog', fuelLogSchema);
