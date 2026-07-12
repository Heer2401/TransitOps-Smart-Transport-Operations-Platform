const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/drivers - All drivers with filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/drivers/available - Available, non-expired, non-suspended drivers
router.get('/available', async (req, res) => {
  try {
    const drivers = await Driver.find({
      status: 'Available',
      licenseExpiryDate: { $gt: new Date() }
    }).sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/drivers
router.post('/', async (req, res) => {
  try {
    const existing = await Driver.findOne({ licenseNumber: req.body.licenseNumber?.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Driver with this license number already exists' });
    
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'License number must be unique' });
    }
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/drivers/:id
router.put('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    
    if (driver.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot delete a driver who is currently on a trip' });
    }
    
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
