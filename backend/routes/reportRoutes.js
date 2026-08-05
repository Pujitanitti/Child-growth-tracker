const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const { growthReport, vaccinationReport, summaryReport, growthCsv, emergencyCardReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];

router.use(protect);

router.get('/children/:childId/reports/growth', childIdParamRule, validate, growthReport);
router.get('/children/:childId/reports/vaccination', childIdParamRule, validate, vaccinationReport);
router.get('/children/:childId/reports/summary', childIdParamRule, validate, summaryReport);
router.get('/children/:childId/reports/growth.csv', childIdParamRule, validate, growthCsv);
router.get('/children/:childId/reports/emergency-card', childIdParamRule, validate, emergencyCardReport);

module.exports = router;
