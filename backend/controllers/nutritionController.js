const NutritionLog = require('../models/NutritionLog');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Simple rule-based suggestions — not a substitute for professional dietary advice.
function buildSuggestions({ totalCalories, totalProteinG, waterIntakeMl }, ageMonths) {
  const suggestions = [];
  const recommendedWaterMl = ageMonths < 12 ? 0 : ageMonths < 36 ? 900 : 1200;

  if (waterIntakeMl < recommendedWaterMl) {
    suggestions.push(`Water intake is below the typical ${recommendedWaterMl}ml/day guideline for this age.`);
  }
  if (totalProteinG < 15 && ageMonths >= 12) {
    suggestions.push('Protein intake looks low today — consider adding eggs, dairy, lentils, or lean meat.');
  }
  if (totalCalories === 0) {
    suggestions.push('No meals logged yet today.');
  }
  if (suggestions.length === 0) suggestions.push("Today's intake looks balanced. Keep it up!");
  return suggestions;
}

// GET /api/children/:childId/nutrition?date=YYYY-MM-DD
const getDailyLog = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const day = req.query.date ? new Date(req.query.date) : new Date();
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));

  let log = await NutritionLog.findOne({ child: child._id, date: { $gte: start, $lte: end } });
  if (!log) log = new NutritionLog({ child: child._id, date: start, meals: [], waterIntakeMl: 0 });

  const ageMonths = child.ageInMonths;
  const suggestions = buildSuggestions(
    { totalCalories: log.totalCalories, totalProteinG: log.totalProteinG, waterIntakeMl: log.waterIntakeMl },
    ageMonths
  );

  res.json({ success: true, data: { log, suggestions } });
});

// POST /api/children/:childId/nutrition/meals
const addMeal = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const day = req.body.date ? new Date(req.body.date) : new Date();
  const start = new Date(new Date(day).setHours(0, 0, 0, 0));
  const end = new Date(new Date(day).setHours(23, 59, 59, 999));

  let log = await NutritionLog.findOne({ child: child._id, date: { $gte: start, $lte: end } });
  if (!log) log = await NutritionLog.create({ child: child._id, date: start, meals: [] });

  log.meals.push({
    name: req.body.name,
    type: req.body.type,
    calories: req.body.calories || 0,
    proteinG: req.body.proteinG || 0,
  });
  await log.save();

  res.status(201).json({ success: true, message: 'Meal logged', data: { log } });
});

// PATCH /api/nutrition/:id/water
const updateWaterIntake = asyncHandler(async (req, res) => {
  const log = await NutritionLog.findById(req.params.id).populate('child');
  if (!log) throw new AppError('Nutrition log not found', 404);
  if (log.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this log', 403);
  }
  log.waterIntakeMl = req.body.waterIntakeMl;
  await log.save();
  res.json({ success: true, message: 'Water intake updated', data: { log } });
});

module.exports = { getDailyLog, addMeal, updateWaterIntake };
