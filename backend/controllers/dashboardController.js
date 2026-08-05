const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const MedicineReminder = require('../models/MedicineReminder');
const { asyncHandler } = require('../middleware/errorHandler');
const { heightPercentile, weightPercentile, bmiStatusFromPercentile, calculateHealthScore } = require('../utils/growthCalculations');

// GET /api/dashboard/summary
// Single aggregated payload for the dashboard's stat cards, so the frontend
// doesn't need to make 6 separate round trips on load.
const getSummary = asyncHandler(async (req, res) => {
  const children = await Child.find({ parent: req.user._id, isArchived: false });
  const childIds = children.map((c) => c._id);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [upcomingVaccinations, recentRecords, unreadNotifications, upcomingAppointments, activeMedicines] = await Promise.all([
    Vaccination.find({ child: { $in: childIds }, status: 'upcoming', dueDate: { $lte: in30Days } })
      .populate('child', 'name photo')
      .sort({ dueDate: 1 })
      .limit(10),
    GrowthRecord.find({ child: { $in: childIds } }).sort({ createdAt: -1 }).limit(10).populate('child', 'name'),
    Notification.find({ user: req.user._id, isRead: false }).sort({ createdAt: -1 }).limit(10),
    Appointment.find({ child: { $in: childIds }, status: 'scheduled', dateTime: { $gte: now, $lte: in30Days } })
      .populate('child', 'name photo')
      .sort({ dateTime: 1 })
      .limit(10),
    MedicineReminder.find({ child: { $in: childIds }, isActive: true })
      .populate('child', 'name photo')
      .limit(10),
  ]);

  // Per-child growth score + BMI status computed from each child's latest record.
  const childSummaries = await Promise.all(
    children.map(async (child) => {
      const latest = await GrowthRecord.findOne({ child: child._id }).sort({ date: -1 });
      if (!latest) return { child, growthScore: null, bmiStatus: null, latestRecord: null };

      const ageMonths = child.ageInMonths;
      const hp = heightPercentile(latest.heightCm, ageMonths);
      const wp = weightPercentile(latest.weightKg, ageMonths);
      const count = await GrowthRecord.countDocuments({ child: child._id });

      return {
        child,
        growthScore: calculateHealthScore({ heightPercentile: hp, weightPercentile: wp, recordCount: count }),
        bmiStatus: bmiStatusFromPercentile(wp),
        latestRecord: latest,
      };
    })
  );

  const avgGrowth = childSummaries.length
    ? Math.round(
        childSummaries.reduce((sum, c) => sum + (c.growthScore || 0), 0) / childSummaries.length
      )
    : 0;

  res.json({
    success: true,
    data: {
      totalChildren: children.length,
      averageGrowthScore: avgGrowth,
      upcomingVaccinations,
      todaysReminders: unreadNotifications.filter((n) => n.dueAt && isSameDay(n.dueAt, now)),
      recentActivity: recentRecords,
      childSummaries,
      upcomingAppointments,
      activeMedicines,
    },
  });
});

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

module.exports = { getSummary };
