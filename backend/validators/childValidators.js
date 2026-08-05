const { body, param, query } = require('express-validator');

const childRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('dateOfBirth').isISO8601().withMessage('Enter a valid date of birth').toDate(),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']),
  body('birthWeightKg').optional({ nullable: true }).isFloat({ min: 0 }),
  body('birthHeightCm').optional({ nullable: true }).isFloat({ min: 0 }),
  body('medicalConditions').optional().isArray(),
  body('allergies').optional().isArray(),
  body('emergencyContact.phone').optional({ nullable: true }).isString(),
  body('doctor.phone').optional({ nullable: true }).isString(),
];

const idParamRule = [param('id').isMongoId().withMessage('Invalid child id')];

const listQueryRules = [
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = { childRules, idParamRule, listQueryRules };
