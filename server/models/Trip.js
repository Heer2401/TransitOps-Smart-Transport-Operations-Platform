const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: { type: String, unique: true },
  source: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true, min: 0 }, // kg
  plannedDistance: { type: Number, required: true, min: 0 }, // km
  actualDistance: { type: Number, min: 0 },
  fuelConsumed: { type: Number, min: 0 }, // liters
  startOdometer: { type: Number, min: 0 },
  endOdometer: { type: Number, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
  scheduledDate: { type: Date, default: Date.now },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-generate trip number
tripSchema.pre('save', async function(next) {
  if (!this.tripNumber) {
    const count = await mongoose.model('Trip').countDocuments();
    this.tripNumber = `TRP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
