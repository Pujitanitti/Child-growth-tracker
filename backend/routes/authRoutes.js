const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  signup, login, forgotPassword, resetPassword,
  getProfile, updateProfile, changePassword, uploadAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadPhoto } = require('../middleware/upload');
const {
  signupRules, loginRules, forgotPasswordRules,
  resetPasswordRules, changePasswordRules, updateProfileRules,
} = require('../validators/authValidators');

// Tighter limiter on auth endpoints to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post('/signup', authLimiter, signupRules, validate, signup);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordRules, validate, resetPassword);

router.get('/me', protect, getProfile);
router.patch('/me', protect, updateProfileRules, validate, updateProfile);
router.post('/change-password', protect, changePasswordRules, validate, changePassword);
router.post('/avatar', protect, uploadPhoto, uploadAvatar);

module.exports = router;
