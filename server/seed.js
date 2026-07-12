const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const MaintenanceLog = require('./models/MaintenanceLog');
const FuelLog = require('./models/FuelLog');
const Expense = require('./models/Expense');

dotenv.config();

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/transitops');
    console.log('Connected. Clearing existing data...');

    // Clear everything
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      FuelLog.deleteMany({}),
      Expense.deleteMany({})
    ]);

    console.log('Creating users...');
    const hashed = await bcrypt.hash('password123', 10);
    const users = await User.create([
      { name: 'Alice Smith', email: 'manager@transitops.com', password: 'password123', role: 'fleet_manager' },
      { name: 'Bob Jones', email: 'dispatcher@transitops.com', password: 'password123', role: 'dispatcher' },
      { name: 'Charlie Safety', email: 'safety@transitops.com', password: 'password123', role: 'safety_officer' },
      { name: 'Diana Penny', email: 'finance@transitops.com', password: 'password123', role: 'financial_analyst' }
    ]);
    const managerId = users[0]._id;

    console.log('Creating vehicles...');
    const vehicles = await Vehicle.create([
      { registrationNumber: 'MH04AB1234', name: 'Van-05', model: 'Tata Ace Gold', type: 'Van', maxLoadCapacity: 500, odometer: 12500, acquisitionCost: 450000, status: 'Available', region: 'Mumbai North', year: 2022, fuelType: 'Diesel' },
      { registrationNumber: 'DL01CD5678', name: 'Truck-02', model: 'Ashok Leyland Dost', type: 'Truck', maxLoadCapacity: 1500, odometer: 42000, acquisitionCost: 820000, status: 'Available', region: 'Delhi NCR', year: 2021, fuelType: 'Diesel' },
      { registrationNumber: 'KA03EF9012', name: 'Truck-09', model: 'Mahindra Bolero Maxi', type: 'Truck', maxLoadCapacity: 1200, odometer: 28000, acquisitionCost: 710000, status: 'On Trip', region: 'Bangalore East', year: 2023, fuelType: 'CNG' },
      { registrationNumber: 'MH02GH3456', name: 'Van-11', model: 'Maruti Suzuki Eeco', type: 'Van', maxLoadCapacity: 400, odometer: 18400, acquisitionCost: 520000, status: 'In Shop', region: 'Mumbai West', year: 2022, fuelType: 'Petrol' },
      { registrationNumber: 'KA05JK7890', name: 'Car-01', model: 'Maruti Suzuki Dzire', type: 'Car', maxLoadCapacity: 350, odometer: 68000, acquisitionCost: 650000, status: 'Retired', region: 'Bangalore South', year: 2018, fuelType: 'Petrol' }
    ]);

    console.log('Creating drivers...');
    // Expiry dates
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 3);
    const expiringSoon = new Date();
    expiringSoon.setDate(expiringSoon.getDate() + 12);
    const expired = new Date();
    expired.setDate(expired.getDate() - 15);

    const drivers = await Driver.create([
      { name: 'Alex Kumar', licenseNumber: 'DL0420210001234', licenseCategory: 'LMV', licenseExpiryDate: futureDate, contactNumber: '+91 9876543210', email: 'alex@transitops.com', safetyScore: 92, status: 'Available', experience: 4 },
      { name: 'Ravi Singh', licenseNumber: 'MH0220190005678', licenseCategory: 'HMV', licenseExpiryDate: futureDate, contactNumber: '+91 9123456789', email: 'ravi@transitops.com', safetyScore: 88, status: 'Available', experience: 7 },
      { name: 'Vikram Sharma', licenseNumber: 'KA0320220009012', licenseCategory: 'HMV', licenseExpiryDate: futureDate, contactNumber: '+91 9988776655', email: 'vikram@transitops.com', safetyScore: 85, status: 'On Trip', experience: 5 },
      { name: 'Sanjay Patel', licenseNumber: 'GJ0120150003456', licenseCategory: 'LMV', licenseExpiryDate: expiringSoon, contactNumber: '+91 9456123789', email: 'sanjay@transitops.com', safetyScore: 95, status: 'Available', experience: 9 },
      { name: 'Amit Verma', licenseNumber: 'UP1620100007890', licenseCategory: 'HGMV', licenseExpiryDate: expired, contactNumber: '+91 8877665544', email: 'amit@transitops.com', safetyScore: 78, status: 'Suspended', experience: 12 }
    ]);

    console.log('Creating trips...');
    const trip1 = await Trip.create({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle: vehicles[0]._id, // Van-05
      driver: drivers[0]._id, // Alex Kumar
      cargoWeight: 450,
      plannedDistance: 150,
      actualDistance: 152,
      fuelConsumed: 12.5,
      startOdometer: 12348,
      endOdometer: 12500,
      revenue: 8500,
      status: 'Completed',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip2 = await Trip.create({
      source: 'Delhi',
      destination: 'Jaipur',
      vehicle: vehicles[1]._id, // Truck-02
      driver: drivers[1]._id, // Ravi Singh
      cargoWeight: 1200,
      plannedDistance: 270,
      actualDistance: 272,
      fuelConsumed: 28,
      startOdometer: 41728,
      endOdometer: 42000,
      revenue: 16500,
      status: 'Completed',
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip3 = await Trip.create({
      source: 'Bangalore',
      destination: 'Chennai',
      vehicle: vehicles[2]._id, // Truck-09 (On Trip)
      driver: drivers[2]._id, // Vikram Sharma
      cargoWeight: 1000,
      plannedDistance: 350,
      startOdometer: 27650,
      revenue: 22000,
      status: 'Dispatched',
      scheduledDate: new Date(),
      dispatchedAt: new Date(),
      createdBy: managerId
    });

    const trip4 = await Trip.create({
      source: 'Mumbai',
      destination: 'Nashik',
      vehicle: vehicles[0]._id, // Van-05
      driver: drivers[0]._id, // Alex Kumar
      cargoWeight: 380,
      plannedDistance: 170,
      status: 'Draft',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: managerId
    });

    console.log('Creating fuel logs...');
    await FuelLog.create([
      { vehicle: vehicles[0]._id, trip: trip1._id, liters: 12.5, cost: 1187.5, pricePerLiter: 95, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), odometer: 12500, station: 'HP Petrol Pump', fuelType: 'Diesel', createdBy: managerId },
      { vehicle: vehicles[1]._id, trip: trip2._id, liters: 28, cost: 2660, pricePerLiter: 95, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), odometer: 42000, station: 'BPCL Pump', fuelType: 'Diesel', createdBy: managerId }
    ]);

    console.log('Creating maintenance logs...');
    // One closed maintenance
    await MaintenanceLog.create({
      vehicle: vehicles[0]._id,
      type: 'Oil Change',
      description: 'Routine scheduled oil change and filter replacement.',
      cost: 3500,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      status: 'Closed',
      mechanicName: 'Ramesh Prasad',
      workshopName: 'Shree Sai Motors',
      odometer: 12100,
      createdBy: managerId
    });

    // One open maintenance (this is why Van-11 is In Shop)
    await MaintenanceLog.create({
      vehicle: vehicles[3]._id, // Van-11
      type: 'Brake Service',
      description: 'Brake pads replacement and brake fluid bleeding.',
      cost: 5800,
      startDate: new Date(),
      status: 'Open',
      mechanicName: 'Suresh Kumar',
      workshopName: 'Reliable Garage',
      odometer: 18400,
      createdBy: managerId
    });

    console.log('Creating expenses...');
    await Expense.create([
      { vehicle: vehicles[0]._id, trip: trip1._id, type: 'Toll', amount: 340, description: 'Mumbai-Pune Expressway toll tax payment', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[1]._id, trip: trip2._id, type: 'Toll', amount: 680, description: 'NH48 toll tax payment', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdBy: managerId }
    ]);

    console.log('Seeding completed successfully! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
