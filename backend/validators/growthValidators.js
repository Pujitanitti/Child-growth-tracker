const { body, param } = require('express-validator');

const growthRecordRules = [
  body('date').optional().isISO8601().toDate(),
  body('heightCm').isFloat({ min: 1 }).withMessage('Height must be a positive number'),
  body('weightKg').isFloat({ min: 0.1 }).withMessage('Weight must be a positive number'),
  body('headCircumferenceCm').optional({ nullable: true }).isFloat({ min: 0 }),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

const childIdParamRule = [param('childId').isMongoId().withMessage('Invalid child id')];
const recordIdParamRule = [param('id').isMongoId().withMessage('Invalid record id')];

module.exports = { growthRecordRules, childIdParamRule, recordIdParamRule };
