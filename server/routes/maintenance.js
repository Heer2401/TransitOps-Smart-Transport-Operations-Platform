const express = require('express');
const router = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/maintenance
router.get('/', async (req, res) => {
  try {
    const { status, vehicle, search } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    
    const logs = await MaintenanceLog.find(filter)
      .populate('vehicle', 'registrationNumber name model type')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/maintenance/:id
router.get('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id)
      .populate('vehicle')
      .populate('createdBy', 'name');
    
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/maintenance - Create maintenance record (auto sets vehicle In Shop)
router.post('/', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot add maintenance for a vehicle currently on a trip' });
    }
    
    const log = await MaintenanceLog.create({ ...req.body, createdBy: req.user._id });
    
    // Business Rule: Set vehicle to In Shop when maintenance opened
    if (log.status === 'Open') {
      vehicle.status = 'In Shop';
      await vehicle.save();
    }
    
    const populated = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber name model status')
      .populate('createdBy', 'name');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/maintenance/:id - Update maintenance record
router.put('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    
    const updated = await MaintenanceLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('vehicle', 'registrationNumber name model status');
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/maintenance/:id/close - Close maintenance (restore vehicle)
router.patch('/:id/close', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    
    if (log.status === 'Closed') {
      return res.status(400).json({ message: 'Maintenance log is already closed' });
    }
    
    log.status = 'Closed';
    log.endDate = req.body.endDate || new Date();
    if (req.body.cost !== undefined) log.cost = req.body.cost;
    await log.save();
    
    // Business Rule: Restore vehicle to Available (unless Retired)
    const vehicle = await Vehicle.findById(log.vehicle._id);
    if (vehicle && vehicle.status === 'In Shop') {
      // Check if there are other open maintenance records for this vehicle
      const openMaintenance = await MaintenanceLog.countDocuments({
        vehicle: vehicle._id,
        status: 'Open',
        _id: { $ne: log._id }
      });
      
      if (openMaintenance === 0 && vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }
    
    const populated = await MaintenanceLog.findById(log._id)
      .populate('vehicle', 'registrationNumber name model status')
      .populate('createdBy', 'name');
    
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', async (req, res) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id).populate('vehicle');
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    
    await MaintenanceLog.findByIdAndDelete(req.params.id);
    
    // If was open, check if vehicle should be restored
    if (log.status === 'Open' && log.vehicle) {
      const openMaintenance = await MaintenanceLog.countDocuments({
        vehicle: log.vehicle._id,
        status: 'Open'
      });
      
      if (openMaintenance === 0) {
        const vehicle = await Vehicle.findById(log.vehicle._id);
        if (vehicle && vehicle.status === 'In Shop') {
          vehicle.status = 'Available';
          await vehicle.save();
        }
      }
    }
    
    res.json({ message: 'Maintenance log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
