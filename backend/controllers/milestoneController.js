const Milestone = require('../models/Milestone');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/children/:childId/milestones
const listMilestones = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const filter = { child: req.params.childId };
  if (req.query.domain) filter.domain = req.query.domain;

  const milestones = await Milestone.find(filter).sort({ expectedAgeMonths: 1 });
  res.json({ success: true, data: { milestones } });
});

// POST /api/children/:childId/milestones  (add a custom milestone)
const addMilestone = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const milestone = await Milestone.create({ ...req.body, child: child._id });
  res.status(201).json({ success: true, message: 'Milestone added', data: { milestone } });
});

// PATCH /api/milestones/:id/achieve
const markAchieved = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id).populate('child');
  if (!milestone) throw new AppError('Milestone not found', 404);
  if (milestone.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this milestone', 403);
  }

  milestone.achieved = true;
  milestone.achievedDate = req.body.achievedDate || new Date();
  if (req.body.notes !== undefined) milestone.notes = req.body.notes;
  await milestone.save();

  await logAction(req, 'MILESTONE_ACHIEVED', 'Milestone', milestone._id);
  res.json({ success: true, message: 'Milestone marked as achieved', data: { milestone } });
});

// DELETE /api/milestones/:id
const deleteMilestone = asyncHandler(async (req, res) => {
  const milestone = await Milestone.findById(req.params.id).populate('child');
  if (!milestone) throw new AppError('Milestone not found', 404);
  if (milestone.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this milestone', 403);
  }
  await milestone.deleteOne();
  res.json({ success: true, message: 'Milestone removed' });
});

module.exports = { listMilestones, addMilestone, markAchieved, deleteMilestone };
