const SleepLog = require('../models/SleepLog');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// GET /api/children/:childId/sleep?limit=30
const listSleepLogs = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const limit = Number(req.query.limit) || 30;
  const logs = await SleepLog.find({ child: req.params.childId }).sort({ date: -1 }).limit(limit);
  res.json({ success: true, data: { logs } });
});

// POST /api/children/:childId/sleep
const addSleepLog = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const log = await SleepLog.create({ ...req.body, child: child._id });
  res.status(201).json({ success: true, message: 'Sleep logged', data: { log } });
});

// PATCH /api/sleep/:id
const updateSleepLog = asyncHandler(async (req, res) => {
  const log = await SleepLog.findById(req.params.id).populate('child');
  if (!log) throw new AppError('Sleep log not found', 404);
  if (log.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this log', 403);
  }
  ['hoursSlept', 'napHours', 'quality', 'notes', 'date'].forEach((field) => {
    if (req.body[field] !== undefined) log[field] = req.body[field];
  });
  await log.save();
  res.json({ success: true, message: 'Sleep log updated', data: { log } });
});

// DELETE /api/sleep/:id
const deleteSleepLog = asyncHandler(async (req, res) => {
  const log = await SleepLog.findById(req.params.id).populate('child');
  if (!log) throw new AppError('Sleep log not found', 404);
  if (log.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this log', 403);
  }
  await log.deleteOne();
  res.json({ success: true, message: 'Sleep log removed' });
});

module.exports = { listSleepLogs, addSleepLog, updateSleepLog, deleteSleepLog };
