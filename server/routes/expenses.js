const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const { vehicle, type, trip } = req.query;
    const filter = {};
    
    if (vehicle) filter.vehicle = vehicle;
    if (type) filter.type = type;
    if (trip) filter.trip = trip;
    
    const expenses = await Expense.find(filter)
      .populate('vehicle', 'registrationNumber name model')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
    const populated = await Expense.findById(expense._id)
      .populate('vehicle', 'registrationNumber name model')
      .populate('trip', 'tripNumber source destination')
      .populate('createdBy', 'name');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
