const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET /api/vehicles - Get all vehicles with search/filter
router.get('/', async (req, res) => {
  try {
    const { status, type, region, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (region) filter.region = region;
    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/vehicles/available - Available vehicles for dispatch
router.get('/available', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'Available' }).sort({ name: 1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/vehicles - Create vehicle
router.post('/', async (req, res) => {
  try {
    const existing = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber?.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Vehicle with this registration number already exists' });
    
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Registration number must be unique' });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    // Check if updating registration number conflicts
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const existing = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber.toUpperCase() });
      if (existing) return res.status(400).json({ message: 'Registration number already in use' });
    }
    
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a vehicle that is currently on a trip' });
    }
    
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
