const User = require('../models/User');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const AuditLog = require('../models/AuditLog');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/admin/users?search=&role=&page=&limit=&sortBy=&sortOrder=
const listUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

// PATCH /api/admin/users/:id  (activate/deactivate, change role)
const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);

  const allowed = ['isActive', 'role'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) target[field] = req.body[field];
  });
  await target.save();

  await logAction(req, 'ADMIN_USER_UPDATED', 'User', target._id, req.body);
  res.json({ success: true, message: 'User updated', data: { user: target } });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);
  if (target._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot delete your own admin account', 400);
  }

  await target.deleteOne();
  await logAction(req, 'ADMIN_USER_DELETED', 'User', target._id);
  res.json({ success: true, message: 'User deleted' });
});

// GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalChildren, totalGrowthRecords, upcomingVaccinations, usersByRole] = await Promise.all([
    User.countDocuments(),
    Child.countDocuments({ isArchived: false }),
    GrowthRecord.countDocuments(),
    Vaccination.countDocuments({ status: 'upcoming' }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  // Signups per day for the last 14 days, for a simple growth-of-the-platform chart.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const signupTrend = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: { totalUsers, totalChildren, totalGrowthRecords, upcomingVaccinations, usersByRole, signupTrend },
  });
});

// GET /api/admin/audit-logs?page=&limit=
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('user', 'name email'),
    AuditLog.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

module.exports = { listUsers, updateUser, deleteUser, getAnalytics, getAuditLogs };
