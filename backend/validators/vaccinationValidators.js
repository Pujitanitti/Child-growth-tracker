const { body, param, query } = require('express-validator');

const vaccinationRules = [
  body('vaccine').trim().notEmpty().withMessage('Vaccine name is required'),
  body('doseLabel').optional({ nullable: true }).isString().trim(),
  body('dueDate').isISO8601().withMessage('Enter a valid due date').toDate(),
  body('notes').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

const completeRules = [
  body('completedDate').optional().isISO8601().toDate(),
  body('administeredBy').optional({ nullable: true }).isString().trim(),
];

const childIdParamRule = [param('childId').isMongoId().withMessage('Invalid child id')];
const idParamRule = [param('id').isMongoId().withMessage('Invalid vaccination id')];
const statusQueryRule = [query('status').optional().isIn(['upcoming', 'completed', 'missed'])];

module.exports = { vaccinationRules, completeRules, childIdParamRule, idParamRule, statusQueryRule };
