/**
 * Populates the database with a demo admin, a demo parent, two children,
 * and a few weeks of growth/vaccination/nutrition/sleep history so the
 * frontend has real data to render on first run.
 *
 * Usage: npm run seed   (reads MONGO_URI from .env)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const Milestone = require('../models/Milestone');
const NutritionLog = require('../models/NutritionLog');
const SleepLog = require('../models/SleepLog');
const Appointment = require('../models/Appointment');
const MedicineReminder = require('../models/MedicineReminder');
const { VACCINE_SCHEDULE, MILESTONE_LIBRARY } = require('../config/constants');
const { heightPercentile, weightPercentile, bmiStatusFromPercentile } = require('../utils/growthCalculations');

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seed() {
  await connectDB();
  console.log('Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@growthtracker.app', 'parent@growthtracker.app'] } }),
  ]);

  console.log('Creating demo users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@growthtracker.app',
    password: 'Admin@1234',
    role: 'admin',
  });

  const parent = await User.create({
    name: 'Asha Verma',
    email: 'parent@growthtracker.app',
    password: 'Parent@1234',
    role: 'parent',
  });

  console.log('Creating demo children...');
  const childrenData = [
    { name: 'Aarav Verma', gender: 'male', dateOfBirth: daysAgo(365 * 3), bloodGroup: 'B+' },
    { name: 'Diya Verma', gender: 'female', dateOfBirth: daysAgo(200), bloodGroup: 'O+' },
  ];

  for (const data of childrenData) {
    const child = await Child.create({
      ...data,
      parent: parent._id,
      emergencyContact: { name: 'Rohan Verma', relationship: 'Father', phone: '+91-9000000000' },
      doctor: { name: 'Dr. Kavita Rao', clinic: 'Sunrise Pediatrics', phone: '+91-9111111111' },
    });

    // Vaccination + milestone timeline, same generation logic as the API.
    const dob = new Date(child.dateOfBirth);
    await Vaccination.insertMany(
      VACCINE_SCHEDULE.map((v) => ({
        child: child._id,
        vaccine: v.vaccine,
        doseLabel: v.doseLabel,
        dueDate: new Date(dob.getTime() + v.dueDay * 24 * 60 * 60 * 1000),
        status: dob.getTime() + v.dueDay * 24 * 60 * 60 * 1000 < Date.now() ? 'completed' : 'upcoming',
        completedDate: dob.getTime() + v.dueDay * 24 * 60 * 60 * 1000 < Date.now() ? new Date(dob.getTime() + v.dueDay * 24 * 60 * 60 * 1000) : null,
      }))
    );
    await Milestone.insertMany(
      MILESTONE_LIBRARY.map((m) => ({
        child: child._id,
        domain: m.domain,
        title: m.title,
        expectedAgeMonths: m.ageMonths,
        achieved: child.ageInMonths >= m.ageMonths,
        achievedDate: child.ageInMonths >= m.ageMonths ? daysAgo(30) : null,
      }))
    );

    // 6 monthly growth records with realistic upward trend.
    let height = data.gender === 'male' ? 50 : 49;
    let weight = 3.3;
    for (let i = 6; i >= 0; i -= 1) {
      const date = daysAgo(i * 30);
      height += 3.5 + Math.random();
      weight += 0.5 + Math.random() * 0.3;
      const ageMonths = Math.max(0, child.ageInMonths - i);
      const hp = heightPercentile(height, ageMonths);
      const wp = weightPercentile(weight, ageMonths);
      await GrowthRecord.create({
        child: child._id,
        recordedBy: parent._id,
        date,
        heightCm: Number(height.toFixed(1)),
        weightKg: Number(weight.toFixed(2)),
        headCircumferenceCm: Number((35 + i * 0.3).toFixed(1)),
        percentile: hp,
        weightStatus: bmiStatusFromPercentile(wp),
      });
    }

    // A week of nutrition + sleep history.
    for (let i = 6; i >= 0; i -= 1) {
      await NutritionLog.create({
        child: child._id,
        date: daysAgo(i),
        meals: [
          { name: 'Idli & sambar', type: 'breakfast', calories: 220, proteinG: 6 },
          { name: 'Dal, rice, vegetables', type: 'lunch', calories: 380, proteinG: 12 },
          { name: 'Fruit bowl', type: 'snack', calories: 90, proteinG: 1 },
        ],
        waterIntakeMl: 700 + Math.round(Math.random() * 400),
      });
      await SleepLog.create({
        child: child._id,
        date: daysAgo(i),
        hoursSlept: 9 + Math.random() * 1.5,
        napHours: Math.random() * 1.5,
        quality: ['good', 'excellent', 'fair'][Math.floor(Math.random() * 3)],
      });
    }

    await Appointment.create({
      child: child._id,
      title: 'Well-child checkup',
      doctorName: 'Dr. Kavita Rao',
      location: 'Sunrise Pediatrics',
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      reason: 'Routine growth and development check',
    });

    await MedicineReminder.create({
      child: child._id,
      medicineName: 'Vitamin D drops',
      dosage: '400 IU',
      frequency: 'daily',
      timeOfDay: '08:00',
    });
  }

  console.log('\nSeed complete.');
  console.log('  Admin login:  admin@growthtracker.app / Admin@1234');
  console.log('  Parent login: parent@growthtracker.app / Parent@1234');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
