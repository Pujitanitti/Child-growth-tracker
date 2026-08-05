const GrowthRecord = require('../models/GrowthRecord');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');
const {
  heightPercentile, weightPercentile, bmiStatusFromPercentile,
  calculateGrowthVelocity, predictFutureHeight, calculateHealthScore,
} = require('../utils/growthCalculations');

function ageInMonthsAt(dob, date) {
  const d = new Date(date);
  const birth = new Date(dob);
  return (d.getFullYear() - birth.getFullYear()) * 12 + (d.getMonth() - birth.getMonth());
}

// GET /api/children/:childId/growth
const listGrowthRecords = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId; // reuse ownership check helper
  await findOwnedChild(req);

  const records = await GrowthRecord.find({ child: req.params.childId }).sort({ date: 1 });
  res.json({ success: true, data: { records } });
});

// POST /api/children/:childId/growth
const addGrowthRecord = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const ageMonths = ageInMonthsAt(child.dateOfBirth, req.body.date || Date.now());
  const hp = heightPercentile(req.body.heightCm, ageMonths);
  const wp = weightPercentile(req.body.weightKg, ageMonths);

  const record = await GrowthRecord.create({
    ...req.body,
    child: child._id,
    recordedBy: req.user._id,
    percentile: hp,
    weightStatus: bmiStatusFromPercentile(wp),
  });

  await logAction(req, 'GROWTH_RECORD_ADDED', 'GrowthRecord', record._id);
  res.status(201).json({ success: true, message: 'Growth record added', data: { record, heightPercentile: hp, weightPercentile: wp } });
});

// PATCH /api/growth/:id
const updateGrowthRecord = asyncHandler(async (req, res) => {
  const record = await GrowthRecord.findById(req.params.id).populate('child');
  if (!record) throw new AppError('Growth record not found', 404);
  if (record.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this record', 403);
  }

  ['date', 'heightCm', 'weightKg', 'headCircumferenceCm', 'notes'].forEach((field) => {
    if (req.body[field] !== undefined) record[field] = req.body[field];
  });
  await record.save();

  await logAction(req, 'GROWTH_RECORD_UPDATED', 'GrowthRecord', record._id);
  res.json({ success: true, message: 'Growth record updated', data: { record } });
});

// DELETE /api/growth/:id
const deleteGrowthRecord = asyncHandler(async (req, res) => {
  const record = await GrowthRecord.findById(req.params.id).populate('child');
  if (!record) throw new AppError('Growth record not found', 404);
  if (record.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this record', 403);
  }
  await record.deleteOne();

  await logAction(req, 'GROWTH_RECORD_DELETED', 'GrowthRecord', record._id);
  res.json({ success: true, message: 'Growth record removed' });
});

// GET /api/children/:childId/growth/insights
// Bundles velocity, prediction, and health score for the dashboard's growth widgets.
const getGrowthInsights = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const records = await GrowthRecord.find({ child: child._id }).sort({ date: 1 });
  if (records.length === 0) {
    return res.json({ success: true, data: { velocity: null, prediction: null, healthScore: null, alerts: [] } });
  }

  const latest = records[records.length - 1];
  const ageMonths = ageInMonthsAt(child.dateOfBirth, latest.date);
  const hp = heightPercentile(latest.heightCm, ageMonths);
  const wp = weightPercentile(latest.weightKg, ageMonths);

  const velocity = calculateGrowthVelocity(records);
  const prediction = predictFutureHeight(records, 6);
  const healthScore = calculateHealthScore({ heightPercentile: hp, weightPercentile: wp, recordCount: records.length });

  // Simple rule-based alerts: flag extreme percentiles or a sudden velocity drop.
  const alerts = [];
  if (hp < 3 || hp > 97) alerts.push('Height percentile is outside the typical range — consider discussing with your pediatrician.');
  if (wp < 3 || wp > 97) alerts.push('Weight percentile is outside the typical range — consider discussing with your pediatrician.');
  if (velocity && velocity.heightCmPerMonth < 0) alerts.push('Recorded height decreased since the last measurement — please double-check the entry.');

  res.json({ success: true, data: { heightPercentile: hp, weightPercentile: wp, velocity, prediction, healthScore, alerts } });
});

module.exports = {
  listGrowthRecords, addGrowthRecord, updateGrowthRecord, deleteGrowthRecord, getGrowthInsights,
};
