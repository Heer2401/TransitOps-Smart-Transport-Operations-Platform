const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/trips - All trips with filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { source: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { tripNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const trips = await Trip.find(filter)
      .populate('vehicle', 'registrationNumber name model type')
      .populate('driver', 'name licenseNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver')
      .populate('createdBy', 'name email');
    
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/trips - Create trip (Draft)
router.post('/', async (req, res) => {
  try {
    const { vehicle: vehicleId, driver: driverId, cargoWeight } = req.body;
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    // Business Rule: Cargo weight check
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ 
        message: `Cargo weight (${cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)` 
      });
    }
    
    const trip = await Trip.create({ ...req.body, createdBy: req.user._id });
    const populated = await Trip.findById(trip._id)
      .populate('vehicle', 'registrationNumber name model type')
      .populate('driver', 'name licenseNumber');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/trips/:id/dispatch - Dispatch trip
router.patch('/:id/dispatch', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    if (trip.status !== 'Draft') {
      return res.status(400).json({ message: `Trip is already ${trip.status}. Only Draft trips can be dispatched.` });
    }
    
    // Business Rules:
    const vehicle = await Vehicle.findById(trip.vehicle._id);
    const driver = await Driver.findById(trip.driver._id);
    
    // Vehicle must be Available
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ message: `Vehicle is currently ${vehicle.status} and cannot be dispatched` });
    }
    
    // Driver must be Available
    if (driver.status !== 'Available') {
      return res.status(400).json({ message: `Driver is currently ${driver.status} and cannot be dispatched` });
    }
    
    // Driver license must not be expired
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ message: 'Driver license has expired. Cannot dispatch.' });
    }
    
    // Driver must not be Suspended
    if (driver.status === 'Suspended') {
      return res.status(400).json({ message: 'Suspended drivers cannot be assigned to trips' });
    }
    
    // Cargo weight check again on dispatch
    if (trip.cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({ 
        message: `Cargo weight (${trip.cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg)` 
      });
    }
    
    // Update trip, vehicle, and driver status
    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    trip.startOdometer = vehicle.odometer;
    await trip.save();
    
    vehicle.status = 'On Trip';
    await vehicle.save();
    
    driver.status = 'On Trip';
    await driver.save();
    
    const populated = await Trip.findById(trip._id)
      .populate('vehicle', 'registrationNumber name model type status')
      .populate('driver', 'name licenseNumber status');
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/trips/:id/complete - Complete trip
router.patch('/:id/complete', async (req, res) => {
  try {
    const { endOdometer, fuelConsumed, actualDistance, revenue } = req.body;
    
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: 'Only Dispatched trips can be completed' });
    }
    
    if (!endOdometer || !fuelConsumed) {
      return res.status(400).json({ message: 'End odometer and fuel consumed are required to complete trip' });
    }
    
    // Update trip
    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.endOdometer = endOdometer;
    trip.fuelConsumed = fuelConsumed;
    trip.actualDistance = actualDistance || (endOdometer - (trip.startOdometer || 0));
    if (revenue !== undefined) trip.revenue = revenue;
    await trip.save();
    
    // Update vehicle odometer and status
    const vehicle = await Vehicle.findById(trip.vehicle._id);
    vehicle.status = 'Available';
    vehicle.odometer = endOdometer;
    await vehicle.save();
    
    // Update driver status
    const driver = await Driver.findById(trip.driver._id);
    driver.status = 'Available';
    await driver.save();
    
    // Auto-create fuel log
    if (fuelConsumed > 0) {
      const fuelCostPerLiter = req.body.fuelCostPerLiter || 0;
      await FuelLog.create({
        vehicle: vehicle._id,
        trip: trip._id,
        liters: fuelConsumed,
        cost: fuelConsumed * fuelCostPerLiter,
        date: new Date(),
        odometer: endOdometer,
        createdBy: req.user._id
      });
    }
    
    const populated = await Trip.findById(trip._id)
      .populate('vehicle', 'registrationNumber name model type status odometer')
      .populate('driver', 'name licenseNumber status');
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/trips/:id/cancel - Cancel trip
router.patch('/:id/cancel', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    if (!['Draft', 'Dispatched'].includes(trip.status)) {
      return res.status(400).json({ message: 'Only Draft or Dispatched trips can be cancelled' });
    }
    
    const prevStatus = trip.status;
    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    await trip.save();
    
    // If was dispatched, restore vehicle and driver to Available
    if (prevStatus === 'Dispatched') {
      await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driver._id, { status: 'Available' });
    }
    
    const populated = await Trip.findById(trip._id)
      .populate('vehicle', 'registrationNumber name status')
      .populate('driver', 'name status');
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
