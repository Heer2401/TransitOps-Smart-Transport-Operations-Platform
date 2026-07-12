const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: {
    type: String,
    enum: ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Repair', 'Transmission', 'Electrical', 'Body Work', 'Annual Service', 'Inspection', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  cost: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  mechanicName: { type: String, trim: true },
  workshopName: { type: String, trim: true },
  odometer: { type: Number, min: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
