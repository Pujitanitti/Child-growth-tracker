const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { listSleepLogs, addSleepLog, updateSleepLog, deleteSleepLog } = require('../controllers/sleepController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const limitQueryRule = [query('limit').optional().isInt({ min: 1, max: 365 })];
const sleepRules = [
  body('hoursSlept').isFloat({ min: 0, max: 24 }),
  body('napHours').optional().isFloat({ min: 0, max: 24 }),
  body('quality').isIn(['poor', 'fair', 'good', 'excellent']),
  body('date').optional().isISO8601(),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

router.use(protect);

router.get('/children/:childId/sleep', childIdParamRule, limitQueryRule, validate, listSleepLogs);
router.post('/children/:childId/sleep', childIdParamRule, sleepRules, validate, addSleepLog);
router.patch('/sleep/:id', idParamRule, validate, updateSleepLog);
router.delete('/sleep/:id', idParamRule, validate, deleteSleepLog);

module.exports = router;
