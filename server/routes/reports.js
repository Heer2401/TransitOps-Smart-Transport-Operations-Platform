const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const MaintenanceLog = require('../models/MaintenanceLog');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/reports/dashboard - Dashboard KPIs
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalVehicles,
      availableVehicles,
      onTripVehicles,
      inShopVehicles,
      retiredVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalDrivers,
      completedTrips,
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'Available' }),
      Vehicle.countDocuments({ status: 'On Trip' }),
      Vehicle.countDocuments({ status: 'In Shop' }),
      Vehicle.countDocuments({ status: 'Retired' }),
      Trip.countDocuments({ status: 'Dispatched' }),
      Trip.countDocuments({ status: 'Draft' }),
      Driver.countDocuments({ status: 'On Trip' }),
      Driver.countDocuments(),
      Trip.countDocuments({ status: 'Completed' }),
      Trip.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$revenue' } } }]),
      FuelLog.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]),
      MaintenanceLog.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    
    const fleetUtilization = totalVehicles > 0 
      ? Math.round(((onTripVehicles + inShopVehicles) / totalVehicles) * 100) 
      : 0;
    
    // Expiring licenses (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringLicenses = await Driver.countDocuments({
      licenseExpiryDate: { $lt: thirtyDaysFromNow, $gt: new Date() }
    });
    
    const expiredLicenses = await Driver.countDocuments({
      licenseExpiryDate: { $lt: new Date() }
    });
    
    res.json({
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        onTrip: onTripVehicles,
        inShop: inShopVehicles,
        retired: retiredVehicles
      },
      trips: {
        active: activeTrips,
        pending: pendingTrips,
        completed: completedTrips
      },
      drivers: {
        total: totalDrivers,
        onDuty: driversOnDuty,
        expiringLicenses,
        expiredLicenses
      },
      financials: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalFuelCost: totalFuelCost[0]?.total || 0,
        totalMaintenanceCost: totalMaintenanceCost[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0
      },
      fleetUtilization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/analytics - Detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    // Fuel efficiency per vehicle (km/liter)
    const fuelEfficiency = await Trip.aggregate([
      { $match: { status: 'Completed', fuelConsumed: { $gt: 0 }, actualDistance: { $gt: 0 } } },
      {
        $group: {
          _id: '$vehicle',
          totalDistance: { $sum: '$actualDistance' },
          totalFuel: { $sum: '$fuelConsumed' },
          tripCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          efficiency: { $divide: ['$totalDistance', '$totalFuel'] }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $project: {
          vehicleName: '$vehicle.name',
          registrationNumber: '$vehicle.registrationNumber',
          efficiency: 1,
          totalDistance: 1,
          totalFuel: 1,
          tripCount: 1
        }
      }
    ]);
    
    // Operational cost per vehicle (Fuel + Maintenance)
    const vehicleCosts = await Vehicle.aggregate([
      {
        $lookup: {
          from: 'fuellogs',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'fuelLogs'
        }
      },
      {
        $lookup: {
          from: 'maintenancelogs',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'maintenanceLogs'
        }
      },
      {
        $lookup: {
          from: 'expenses',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'expenses'
        }
      },
      {
        $addFields: {
          totalFuelCost: { $sum: '$fuelLogs.cost' },
          totalMaintenanceCost: { $sum: '$maintenanceLogs.cost' },
          totalExpenses: { $sum: '$expenses.amount' }
        }
      },
      {
        $addFields: {
          totalOperationalCost: { $add: ['$totalFuelCost', '$totalMaintenanceCost', '$totalExpenses'] }
        }
      },
      {
        $project: {
          name: 1,
          registrationNumber: 1,
          acquisitionCost: 1,
          totalFuelCost: 1,
          totalMaintenanceCost: 1,
          totalExpenses: 1,
          totalOperationalCost: 1
        }
      }
    ]);
    
    // ROI per vehicle: (Revenue - (Maintenance + Fuel)) / AcquisitionCost
    const vehicleROI = await Trip.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: '$vehicle',
          totalRevenue: { $sum: '$revenue' },
          totalDistance: { $sum: '$actualDistance' }
        }
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      { $unwind: '$vehicle' },
      {
        $lookup: {
          from: 'fuellogs',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'fuelLogs'
        }
      },
      {
        $lookup: {
          from: 'maintenancelogs',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'maintenanceLogs'
        }
      },
      {
        $addFields: {
          totalFuelCost: { $sum: '$fuelLogs.cost' },
          totalMaintenanceCost: { $sum: '$maintenanceLogs.cost' }
        }
      },
      {
        $addFields: {
          roi: {
            $cond: {
              if: { $gt: ['$vehicle.acquisitionCost', 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalRevenue', { $add: ['$totalFuelCost', '$totalMaintenanceCost'] }] },
                      '$vehicle.acquisitionCost'
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          vehicleName: '$vehicle.name',
          registrationNumber: '$vehicle.registrationNumber',
          totalRevenue: 1,
          totalFuelCost: 1,
          totalMaintenanceCost: 1,
          roi: 1
        }
      }
    ]);
    
    // Monthly trip trends
    const monthlyTrips = await Trip.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          revenue: { $sum: '$revenue' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    // Vehicle type distribution
    const vehicleTypeDistribution = await Vehicle.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Monthly fuel costs
    const monthlyFuel = await FuelLog.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalCost: { $sum: '$cost' },
          totalLiters: { $sum: '$liters' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      fuelEfficiency,
      vehicleCosts,
      vehicleROI,
      monthlyTrips,
      vehicleTypeDistribution,
      monthlyFuel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
