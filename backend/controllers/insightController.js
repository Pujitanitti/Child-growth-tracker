const GrowthRecord = require('../models/GrowthRecord');
const SleepLog = require('../models/SleepLog');
const NutritionLog = require('../models/NutritionLog');
const { findOwnedChild } = require('./childController');
const { asyncHandler } = require('../middleware/errorHandler');
const { calculateGrowthVelocity } = require('../utils/growthCalculations');

/**
 * Rule-based insight generation — deliberately NOT an LLM call, so this
 * works for every user with zero configuration and zero external cost.
 * Each rule is a plain, explainable comparison over the user's own recent
 * data; nothing here is diagnostic, it's just "here's a pattern to notice."
 */

function avg(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

// GET /api/children/:childId/insights
const getInsights = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const [growthRecords, sleepLogs, nutritionLogs] = await Promise.all([
    GrowthRecord.find({ child: child._id }).sort({ date: 1 }),
    SleepLog.find({ child: child._id }).sort({ date: -1 }).limit(14),
    NutritionLog.find({ child: child._id }).sort({ date: -1 }).limit(14),
  ]);

  const insights = [];

  // Growth trend
  if (growthRecords.length >= 2) {
    const velocity = calculateGrowthVelocity(growthRecords);
    if (velocity) {
      if (velocity.heightCmPerMonth > 0 && velocity.weightKgPerMonth > 0) {
        insights.push({
          icon: '✨', tone: 'positive',
          text: `${child.name}'s height and weight both increased since the last measurement — growth is trending steadily upward.`,
        });
      } else if (velocity.weightKgPerMonth < 0) {
        insights.push({
          icon: '📉', tone: 'attention',
          text: `Recorded weight decreased since the last measurement. Worth a quick double-check of the entry, or a mention to your pediatrician if it's accurate.`,
        });
      }
    }
  } else {
    insights.push({ icon: '📏', tone: 'neutral', text: 'Log a couple more growth measurements to start seeing trend insights here.' });
  }

  // Sleep trend: compare most recent week to the week before
  if (sleepLogs.length >= 4) {
    const recent = sleepLogs.slice(0, Math.min(7, Math.floor(sleepLogs.length / 2)));
    const prior = sleepLogs.slice(recent.length, recent.length * 2);
    const recentAvg = avg(recent.map((l) => l.hoursSlept));
    const priorAvg = avg(prior.map((l) => l.hoursSlept));
    if (recentAvg !== null && priorAvg !== null) {
      if (recentAvg < priorAvg - 0.5) {
        insights.push({
          icon: '🌙', tone: 'attention',
          text: `Sleep duration has dipped recently (${recentAvg.toFixed(1)}h vs ${priorAvg.toFixed(1)}h avg before). A consistent bedtime routine can help.`,
        });
      } else if (recentAvg > priorAvg + 0.5) {
        insights.push({ icon: '🌙', tone: 'positive', text: `Sleep duration has improved recently — averaging ${recentAvg.toFixed(1)}h a night.` });
      }
    }
  }

  // Nutrition: protein intake vs a simple baseline
  if (nutritionLogs.length > 0) {
    const avgProtein = avg(nutritionLogs.map((l) => l.meals.reduce((s, m) => s + (m.proteinG || 0), 0)));
    if (avgProtein !== null) {
      if (avgProtein < 15) {
        insights.push({ icon: '🥗', tone: 'attention', text: `Average protein intake looks light recently (${avgProtein.toFixed(0)}g/day). Eggs, dairy, lentils, or lean meat can help round this out.` });
      } else {
        insights.push({ icon: '🥗', tone: 'positive', text: `Protein intake has looked solid recently, averaging ${avgProtein.toFixed(0)}g/day.` });
      }
    }
    const avgWater = avg(nutritionLogs.map((l) => l.waterIntakeMl));
    if (avgWater !== null && avgWater < 600) {
      insights.push({ icon: '💧', tone: 'attention', text: `Water intake has been averaging under ${Math.round(avgWater)}ml/day recently — worth keeping an eye on, especially in warmer weather.` });
    }
  }

  if (insights.length === 0) {
    insights.push({ icon: '🌱', tone: 'neutral', text: 'Start logging growth, sleep, and nutrition to see personalized insights here.' });
  }

  res.json({ success: true, data: { insights } });
});

module.exports = { getInsights };
