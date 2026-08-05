const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { notifications } });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new AppError('Notification not found', 404);
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: { notification } });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markRead, markAllRead };
