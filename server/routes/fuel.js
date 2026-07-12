const express = require('express');
const router = express.Router();
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/fuel
router.get('/', async (req, res) => {
  try {
    const { vehicle, trip } = req.query;
    const filter = {};
    
    if (vehicle) filter.vehicle = vehicle;
    if (trip) filter.trip = trip;
    
    const logs = await FuelLog.find(filter)
      .populate('vehicle', 'registrationNumber name model')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/fuel
router.post('/', async (req, res) => {
  try {
    // Auto-compute price per liter if not provided
    const data = { ...req.body, createdBy: req.user._id };
    if (data.liters && data.cost && !data.pricePerLiter) {
      data.pricePerLiter = data.cost / data.liters;
    }
    
    const log = await FuelLog.create(data);
    const populated = await FuelLog.findById(log._id)
      .populate('vehicle', 'registrationNumber name model')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/fuel/:id
router.delete('/:id', async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Fuel log not found' });
    res.json({ message: 'Fuel log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
