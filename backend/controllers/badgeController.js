const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const Milestone = require('../models/Milestone');
const SleepLog = require('../models/SleepLog');
const NutritionLog = require('../models/NutritionLog');
const { findOwnedChild } = require('./childController');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Badges are computed on the fly from existing collections rather than
 * stored — this avoids a whole extra layer of "did we remember to award
 * this" bookkeeping and can never drift out of sync with the real data.
 */

// Longest run of consecutive calendar days present in a list of dates.
function longestStreak(dates) {
  if (!dates.length) return 0;
  const days = [...new Set(dates.map((d) => new Date(d).toDateString()))]
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i += 1) {
    const dayDiff = Math.round((days[i] - days[i - 1]) / (1000 * 60 * 60 * 24));
    current = dayDiff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

// GET /api/children/:childId/badges
const getBadges = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const [growthRecords, vaccinations, milestones, sleepLogs, nutritionLogs] = await Promise.all([
    GrowthRecord.find({ child: child._id }).select('date'),
    Vaccination.find({ child: child._id }).select('status'),
    Milestone.find({ child: child._id }).select('achieved'),
    SleepLog.find({ child: child._id }).select('date'),
    NutritionLog.find({ child: child._id }).select('date'),
  ]);

  const achievedMilestones = milestones.filter((m) => m.achieved).length;
  const completedVaccines = vaccinations.filter((v) => v.status === 'completed').length;
  const vaccineCompletionPct = vaccinations.length ? Math.round((completedVaccines / vaccinations.length) * 100) : 0;
  const sleepStreak = longestStreak(sleepLogs.map((l) => l.date));
  const nutritionStreak = longestStreak(nutritionLogs.map((l) => l.date));

  const badges = [
    {
      id: 'growth-tracker',
      title: 'Growth Tracker',
      description: 'Logged 5 or more growth measurements',
      icon: 'fa-ruler-vertical',
      earned: growthRecords.length >= 5,
      progress: Math.min(growthRecords.length, 5),
      target: 5,
    },
    {
      id: 'vaccination-champion',
      title: 'Vaccination Champion',
      description: 'Completed 100% of the scheduled vaccinations',
      icon: 'fa-shield-heart',
      earned: vaccinations.length > 0 && vaccineCompletionPct === 100,
      progress: vaccineCompletionPct,
      target: 100,
    },
    {
      id: 'milestone-master',
      title: 'Milestone Master',
      description: 'Achieved 10 or more developmental milestones',
      icon: 'fa-star',
      earned: achievedMilestones >= 10,
      progress: Math.min(achievedMilestones, 10),
      target: 10,
    },
    {
      id: 'sleep-streak',
      title: 'Sleep Streak',
      description: 'Logged sleep for 7 consecutive days',
      icon: 'fa-moon',
      earned: sleepStreak >= 7,
      progress: Math.min(sleepStreak, 7),
      target: 7,
    },
    {
      id: 'nutrition-streak',
      title: 'Nutrition Streak',
      description: 'Logged meals for 7 consecutive days',
      icon: 'fa-bowl-food',
      earned: nutritionStreak >= 7,
      progress: Math.min(nutritionStreak, 7),
      target: 7,
    },
  ];

  res.json({ success: true, data: { badges, earnedCount: badges.filter((b) => b.earned).length } });
});

module.exports = { getBadges };
