const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Truck', 'Van', 'Bus', 'Car', 'Motorcycle', 'Heavy Equipment'], required: true },
  maxLoadCapacity: { type: Number, required: true, min: 0 }, // in kg
  odometer: { type: Number, default: 0, min: 0 }, // in km
  acquisitionCost: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
  region: { type: String, trim: true, default: 'Unassigned' },
  year: { type: Number },
  fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'], default: 'Diesel' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
