const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { getDailyLog, addMeal, updateWaterIntake } = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const dateQueryRule = [query('date').optional().isISO8601()];
const mealRules = [
  body('name').trim().notEmpty(),
  body('type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('calories').optional().isFloat({ min: 0 }),
  body('proteinG').optional().isFloat({ min: 0 }),
  body('date').optional().isISO8601(),
];
const waterRules = [body('waterIntakeMl').isFloat({ min: 0 })];

router.use(protect);

router.get('/children/:childId/nutrition', childIdParamRule, dateQueryRule, validate, getDailyLog);
router.post('/children/:childId/nutrition/meals', childIdParamRule, mealRules, validate, addMeal);
router.patch('/nutrition/:id/water', idParamRule, waterRules, validate, updateWaterIntake);

module.exports = router;
