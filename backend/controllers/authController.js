const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { signAuthToken, signResetToken, verifyResetToken } = require('../utils/token');
const { sendEmail, passwordResetTemplate } = require('../utils/email');
const { logAction } = require('../middleware/auditLogger');

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const user = await User.create({ name, email, password });
  const token = signAuthToken(user._id);

  await logAction(req, 'SIGNUP', 'User', user._id);

  res.status(201).json({ success: true, message: 'Account created', data: { user, token } });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }
  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Contact support.', 403);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signAuthToken(user._id);
  await logAction(req, 'LOGIN', 'User', user._id);

  res.json({ success: true, message: 'Logged in', data: { user, token } });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists,
  // so the endpoint can't be used to enumerate registered emails.
  if (user) {
    const resetToken = signResetToken(user._id);
    const resetUrl = `${process.env.CLIENT_URL}/pages/reset-password.html?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Child Growth Tracker password',
      html: passwordResetTemplate(user.name, resetUrl),
    });
  }

  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch {
    throw new AppError('Reset link is invalid or has expired', 400);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('Reset link is invalid or has expired', 400);

  user.password = password;
  await user.save();

  await logAction(req, 'PASSWORD_RESET', 'User', user._id);

  res.json({ success: true, message: 'Password has been reset. You can now log in.' });
});

// GET /api/auth/me
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// PATCH /api/auth/me
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'theme'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await logAction(req, 'PROFILE_UPDATED', 'User', user._id, updates);
  res.json({ success: true, message: 'Profile updated', data: { user } });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  await logAction(req, 'PASSWORD_CHANGED', 'User', user._id);
  res.json({ success: true, message: 'Password changed successfully' });
});

// POST /api/auth/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: `/uploads/${req.file.filename}` },
    { new: true }
  );
  res.json({ success: true, message: 'Avatar updated', data: { user } });
});

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
};
