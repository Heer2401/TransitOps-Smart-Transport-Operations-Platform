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
      // Available
      { registrationNumber: 'MH04AB1234', name: 'Van-05', model: 'Tata Ace Gold', type: 'Van', maxLoadCapacity: 850, odometer: 15400, acquisitionCost: 480000, status: 'Available', region: 'Mumbai North', year: 2022, fuelType: 'Diesel' },
      { registrationNumber: 'DL01CD5678', name: 'Truck-02', model: 'Ashok Leyland Dost', type: 'Truck', maxLoadCapacity: 1500, odometer: 42100, acquisitionCost: 820000, status: 'Available', region: 'Delhi NCR', year: 2021, fuelType: 'Diesel' },
      { registrationNumber: 'HR55XY9012', name: 'Truck-15', model: 'BharatBenz 1917R', type: 'Truck', maxLoadCapacity: 10500, odometer: 88400, acquisitionCost: 2800000, status: 'Available', region: 'Gurugram Industrial', year: 2020, fuelType: 'Diesel' },
      { registrationNumber: 'GJ01LM3456', name: 'Van-08', model: 'Maruti Suzuki Super Carry', type: 'Van', maxLoadCapacity: 740, odometer: 9600, acquisitionCost: 410000, status: 'Available', region: 'Ahmedabad West', year: 2023, fuelType: 'CNG' },
      { registrationNumber: 'MH12PQ7890', name: 'Car-04', model: 'Maruti Suzuki Eeco Cargo', type: 'Van', maxLoadCapacity: 600, odometer: 32000, acquisitionCost: 550000, status: 'Available', region: 'Pune Corporate', year: 2022, fuelType: 'CNG' },
      
      // On Trip
      { registrationNumber: 'KA03EF9012', name: 'Truck-09', model: 'Mahindra Bolero Maxi Truck', type: 'Truck', maxLoadCapacity: 1200, odometer: 28550, acquisitionCost: 710000, status: 'On Trip', region: 'Bangalore East', year: 2023, fuelType: 'Diesel' },
      { registrationNumber: 'MH43ZX8812', name: 'Truck-22', model: 'Tata T.16 Ultra', type: 'Truck', maxLoadCapacity: 9500, odometer: 56120, acquisitionCost: 2100000, status: 'On Trip', region: 'Thane Central', year: 2021, fuelType: 'Diesel' },
      { registrationNumber: 'KA51MN5566', name: 'Car-02', model: 'Tata Altroz Cargo', type: 'Car', maxLoadCapacity: 350, odometer: 21400, acquisitionCost: 690000, status: 'On Trip', region: 'Bangalore South', year: 2022, fuelType: 'Petrol' },
      
      // In Shop (Maintenance)
      { registrationNumber: 'MH02GH3456', name: 'Van-11', model: 'Maruti Suzuki Eeco Van', type: 'Van', maxLoadCapacity: 600, odometer: 18400, acquisitionCost: 520000, status: 'In Shop', region: 'Mumbai West', year: 2022, fuelType: 'Petrol' },
      { registrationNumber: 'KA01BC4422', name: 'Truck-07', model: 'BharatBenz 2823R', type: 'Truck', maxLoadCapacity: 18500, odometer: 112000, acquisitionCost: 3600000, status: 'In Shop', region: 'Bangalore North', year: 2019, fuelType: 'Diesel' },
      
      // Retired
      { registrationNumber: 'KA05JK7890', name: 'Car-01', model: 'Maruti Suzuki Dzire Tour', type: 'Car', maxLoadCapacity: 350, odometer: 168000, acquisitionCost: 650000, status: 'Retired', region: 'Bangalore South', year: 2017, fuelType: 'Diesel' }
    ]);

    console.log('Creating drivers...');
    const future1 = new Date(); future1.setFullYear(future1.getFullYear() + 2);
    const future2 = new Date(); future2.setFullYear(future2.getFullYear() + 4);
    const expiringSoon1 = new Date(); expiringSoon1.setDate(expiringSoon1.getDate() + 15);
    const expiringSoon2 = new Date(); expiringSoon2.setDate(expiringSoon2.getDate() + 25);
    const expired1 = new Date(); expired1.setDate(expired1.getDate() - 10);
    const expired2 = new Date(); expired2.setDate(expired2.getDate() - 40);

    const drivers = await Driver.create([
      // Available
      { name: 'Alex Kumar', licenseNumber: 'DL0420210001234', licenseCategory: 'LMV', licenseExpiryDate: future1, contactNumber: '+91 9876543210', email: 'alex@transitops.com', safetyScore: 92, status: 'Available', experience: 4 },
      { name: 'Ravi Singh', licenseNumber: 'MH0220190005678', licenseCategory: 'HMV', licenseExpiryDate: future2, contactNumber: '+91 9123456789', email: 'ravi@transitops.com', safetyScore: 88, status: 'Available', experience: 7 },
      { name: 'Sanjay Patel', licenseNumber: 'GJ0120150003456', licenseCategory: 'LMV', licenseExpiryDate: expiringSoon1, contactNumber: '+91 9456123789', email: 'sanjay@transitops.com', safetyScore: 95, status: 'Available', experience: 9 },
      { name: 'Gurpreet Singh', licenseNumber: 'PB0220180004561', licenseCategory: 'HGMV', licenseExpiryDate: future1, contactNumber: '+91 9988112233', email: 'gurpreet@transitops.com', safetyScore: 91, status: 'Available', experience: 11 },
      { name: 'Anil Deshmukh', licenseNumber: 'MH1220160009988', licenseCategory: 'HMV', licenseExpiryDate: future2, contactNumber: '+91 8899001122', email: 'anil@transitops.com', safetyScore: 84, status: 'Available', experience: 8 },
      { name: 'Karthik Raja', licenseNumber: 'TN0120220004411', licenseCategory: 'LMV', licenseExpiryDate: expiringSoon2, contactNumber: '+91 7766554433', email: 'karthik@transitops.com', safetyScore: 97, status: 'Available', experience: 3 },
      
      // On Trip
      { name: 'Vikram Sharma', licenseNumber: 'KA0320220009012', licenseCategory: 'HMV', licenseExpiryDate: future1, contactNumber: '+91 9988776655', email: 'vikram@transitops.com', safetyScore: 86, status: 'On Trip', experience: 5 },
      { name: 'Manish Pandey', registrationNumber: 'UP1620200008899', licenseNumber: 'UP1620200008899', licenseCategory: 'HGMV', licenseExpiryDate: future2, contactNumber: '+91 9540001234', email: 'manish@transitops.com', safetyScore: 89, status: 'On Trip', experience: 6 },
      { name: 'Raghavan Pillai', licenseNumber: 'KL0120170003344', licenseCategory: 'LMV', licenseExpiryDate: future1, contactNumber: '+91 9447009988', email: 'raghavan@transitops.com', safetyScore: 93, status: 'On Trip', experience: 10 },

      // Off Duty
      { name: 'Dilip Kumar', licenseNumber: 'BR0120140002233', licenseCategory: 'HMV', licenseExpiryDate: future2, contactNumber: '+91 9112233445', email: 'dilip@transitops.com', safetyScore: 81, status: 'Off Duty', experience: 14 },
      
      // Suspended / Expired
      { name: 'Amit Verma', licenseNumber: 'UP1620100007890', licenseCategory: 'HGMV', licenseExpiryDate: expired1, contactNumber: '+91 8877665544', email: 'amit@transitops.com', safetyScore: 78, status: 'Suspended', experience: 12 },
      { name: 'Rajesh Khanna', licenseNumber: 'DL0320090001122', licenseCategory: 'LMV', licenseExpiryDate: expired2, contactNumber: '+91 7654321098', email: 'rajesh@transitops.com', safetyScore: 65, status: 'Suspended', experience: 15 }
    ]);

    console.log('Creating trips...');
    // Completed Trips
    const trip1 = await Trip.create({
      source: 'Mumbai', destination: 'Pune',
      vehicle: vehicles[0]._id, driver: drivers[0]._id, // Van-05 & Alex
      cargoWeight: 450, plannedDistance: 150, actualDistance: 152, fuelConsumed: 12.5,
      startOdometer: 12348, endOdometer: 12500, revenue: 8500, status: 'Completed',
      scheduledDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip2 = await Trip.create({
      source: 'Delhi', destination: 'Jaipur',
      vehicle: vehicles[1]._id, driver: drivers[1]._id, // Truck-02 & Ravi
      cargoWeight: 1200, plannedDistance: 270, actualDistance: 272, fuelConsumed: 28,
      startOdometer: 41728, endOdometer: 42000, revenue: 16800, status: 'Completed',
      scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip3 = await Trip.create({
      source: 'Gurugram', destination: 'Ludhiana',
      vehicle: vehicles[2]._id, driver: drivers[3]._id, // Truck-15 & Gurpreet
      cargoWeight: 8500, plannedDistance: 310, actualDistance: 315, fuelConsumed: 92,
      startOdometer: 88085, endOdometer: 88400, revenue: 45000, status: 'Completed',
      scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip4 = await Trip.create({
      source: 'Ahmedabad', destination: 'Surat',
      vehicle: vehicles[3]._id, driver: drivers[2]._id, // Van-08 & Vikram
      cargoWeight: 650, plannedDistance: 260, actualDistance: 258, fuelConsumed: 18.5,
      startOdometer: 9342, endOdometer: 9600, revenue: 11000, status: 'Completed',
      scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      createdBy: managerId
    });

    const trip5 = await Trip.create({
      source: 'Pune', destination: 'Mumbai',
      vehicle: vehicles[4]._id, driver: drivers[4]._id, // Car-04 & Anil
      cargoWeight: 320, plannedDistance: 150, actualDistance: 148, fuelConsumed: 10,
      startOdometer: 31852, endOdometer: 32000, revenue: 7800, status: 'Completed',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
      createdBy: managerId
    });

    // Active (Dispatched) Trips
    const tripActive1 = await Trip.create({
      source: 'Bangalore', destination: 'Chennai',
      vehicle: vehicles[5]._id, driver: drivers[6]._id, // Truck-09 & Vikram Sharma
      cargoWeight: 1100, plannedDistance: 350, startOdometer: 28200, revenue: 19500,
      status: 'Dispatched', scheduledDate: new Date(), dispatchedAt: new Date(),
      createdBy: managerId
    });

    const tripActive2 = await Trip.create({
      source: 'Mumbai', destination: 'Ahmedabad',
      vehicle: vehicles[6]._id, driver: drivers[7]._id, // Truck-22 & Manish Pandey
      cargoWeight: 8000, plannedDistance: 520, startOdometer: 55600, revenue: 38000,
      status: 'Dispatched', scheduledDate: new Date(), dispatchedAt: new Date(),
      createdBy: managerId
    });

    const tripActive3 = await Trip.create({
      source: 'Bangalore', destination: 'Mysore',
      vehicle: vehicles[7]._id, driver: drivers[8]._id, // Car-02 & Raghavan
      cargoWeight: 280, plannedDistance: 140, startOdometer: 21260, revenue: 5200,
      status: 'Dispatched', scheduledDate: new Date(), dispatchedAt: new Date(),
      createdBy: managerId
    });

    // Draft & Cancelled Trips
    await Trip.create({
      source: 'Hyderabad', destination: 'Vijayawada',
      vehicle: vehicles[0]._id, driver: drivers[0]._id, // Van-05 & Alex
      cargoWeight: 500, plannedDistance: 275, revenue: 12500,
      status: 'Draft', scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdBy: managerId
    });

    await Trip.create({
      source: 'Delhi', destination: 'Noida',
      vehicle: vehicles[1]._id, driver: drivers[1]._id, // Truck-02 & Ravi
      cargoWeight: 1400, plannedDistance: 45, revenue: 3500,
      status: 'Cancelled', scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      cancelledAt: new Date(), notes: 'Consignee postponed the order.',
      createdBy: managerId
    });

    console.log('Creating fuel logs...');
    await FuelLog.create([
      { vehicle: vehicles[0]._id, trip: trip1._id, liters: 12.5, cost: 1187.5, pricePerLiter: 95, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), odometer: 12500, station: 'HP Pump Chembur', fuelType: 'Diesel', createdBy: managerId },
      { vehicle: vehicles[1]._id, trip: trip2._id, liters: 28, cost: 2660, pricePerLiter: 95, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), odometer: 42000, station: 'IOCL Delhi', fuelType: 'Diesel', createdBy: managerId },
      { vehicle: vehicles[2]._id, trip: trip3._id, liters: 92, cost: 8924, pricePerLiter: 97, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), odometer: 88400, station: 'Bharat Petroleum NH44', fuelType: 'Diesel', createdBy: managerId },
      { vehicle: vehicles[3]._id, trip: trip4._id, liters: 18.5, cost: 1572.5, pricePerLiter: 85, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), odometer: 9600, station: 'Adani CNG Ahmedabad', fuelType: 'CNG', createdBy: managerId },
      { vehicle: vehicles[4]._id, trip: trip5._id, liters: 10, cost: 820, pricePerLiter: 82, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), odometer: 32000, station: 'MGL CNG Station Pune', fuelType: 'CNG', createdBy: managerId }
    ]);

    console.log('Creating maintenance logs...');
    // Closed Records
    await MaintenanceLog.create({
      vehicle: vehicles[0]._id, type: 'Oil Change', description: 'Routine scheduled mobil oil and fuel filter replacement.',
      cost: 3200, startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      status: 'Closed', mechanicName: 'Prem Shinde', workshopName: 'Sai Auto Care', odometer: 11800, createdBy: managerId
    });

    await MaintenanceLog.create({
      vehicle: vehicles[1]._id, type: 'Tire Replacement', description: 'Replaced rear left side dual tires due to wear and tear.',
      cost: 14500, startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'Closed', mechanicName: 'Jaspreet Singh', workshopName: 'Standard Tyres NCR', odometer: 40500, createdBy: managerId
    });

    await MaintenanceLog.create({
      vehicle: vehicles[2]._id, type: 'Annual Service', description: 'Engine tuning, radiator flush, full body alignment and lubrication.',
      cost: 22000, startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      status: 'Closed', mechanicName: 'Satish Rao', workshopName: 'Bharatbenz Authorized Service', odometer: 82000, createdBy: managerId
    });

    // Open Records (Active Shop status)
    await MaintenanceLog.create({
      vehicle: vehicles[8]._id, // Van-11
      type: 'Brake Service', description: 'Front brake pad squealing. Pads replacement and calipers inspection.',
      cost: 4500, startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'Open', mechanicName: 'Vijay Varma', workshopName: 'Quick Fix Garages', odometer: 18400, createdBy: managerId
    });

    await MaintenanceLog.create({
      vehicle: vehicles[9]._id, // Truck-07
      type: 'Engine Repair', description: 'Engine overheating problem on highways. Head gasket check and coolant replacement.',
      cost: 38000, startDate: new Date(),
      status: 'Open', mechanicName: 'Karan Malhotra', workshopName: 'National Heavy Repairs', odometer: 112000, createdBy: managerId
    });

    console.log('Creating expenses...');
    await Expense.create([
      { vehicle: vehicles[0]._id, trip: trip1._id, type: 'Toll', amount: 340, description: 'Mumbai-Pune Expressway Toll fee', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[1]._id, trip: trip2._id, type: 'Toll', amount: 680, description: 'NH48 Gurgaon-Jaipur Toll plazas', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[2]._id, trip: trip3._id, type: 'Toll', amount: 1250, description: 'NH44 Delhi-Ludhiana highway toll charges', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[2]._id, trip: trip3._id, type: 'Fine', amount: 2000, description: 'Overloading fine at state border checkpost', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[3]._id, trip: trip4._id, type: 'Toll', amount: 450, description: 'Ahmedabad-Surat Expressway Toll booths', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), createdBy: managerId },
      { vehicle: vehicles[4]._id, trip: trip5._id, type: 'Toll', amount: 340, description: 'Pune-Mumbai Expressway Toll plaza return', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdBy: managerId }
    ]);

    console.log('Seeding completed successfully with natural and rich data! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
