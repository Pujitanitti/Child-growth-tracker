const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { askAssistant, getAssistantStatus } = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Modest limiter since each request costs real API tokens.
const assistantLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many questions in a short time. Please wait a few minutes.' },
});

router.use(protect);

router.get('/assistant/status', getAssistantStatus);
router.post(
  '/children/:childId/assistant/ask',
  assistantLimiter,
  [param('childId').isMongoId(), body('message').trim().notEmpty().isLength({ max: 1000 })],
  validate,
  askAssistant
);

module.exports = router;
