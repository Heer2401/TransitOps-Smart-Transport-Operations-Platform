const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  licenseCategory: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'LMV', 'HMV', 'HGMV'], required: true },
  licenseExpiryDate: { type: Date, required: true },
  contactNumber: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  safetyScore: { type: Number, default: 100, min: 0, max: 100 },
  status: { type: String, enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], default: 'Available' },
  joiningDate: { type: Date, default: Date.now },
  experience: { type: Number, default: 0 }, // years
  notes: { type: String }
}, { timestamps: true });

// Virtual to check if license is expired
driverSchema.virtual('isLicenseExpired').get(function() {
  return new Date(this.licenseExpiryDate) < new Date();
});

driverSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Driver', driverSchema);
