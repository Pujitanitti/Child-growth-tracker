const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const {
  listMedicines, addMedicine, markTaken, updateMedicine, deleteMedicine,
} = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const activeQueryRule = [query('active').optional().isBoolean()];
const medicineRules = [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('dosage').optional({ nullable: true }).isString().trim(),
  body('frequency').optional().isIn(['once', 'daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed']),
  body('startDate').optional().isISO8601(),
  body('endDate').optional({ nullable: true }).isISO8601(),
  body('timeOfDay').optional({ nullable: true }).isString().trim(),
];

router.use(protect);

router.get('/children/:childId/medicines', childIdParamRule, activeQueryRule, validate, listMedicines);
router.post('/children/:childId/medicines', childIdParamRule, medicineRules, validate, addMedicine);
router.patch('/medicines/:id/taken', idParamRule, validate, markTaken);
router.patch('/medicines/:id', idParamRule, validate, updateMedicine);
router.delete('/medicines/:id', idParamRule, validate, deleteMedicine);

module.exports = router;
