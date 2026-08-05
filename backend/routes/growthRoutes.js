const express = require('express');
const router = express.Router();

const {
  listGrowthRecords, addGrowthRecord, updateGrowthRecord, deleteGrowthRecord, getGrowthInsights,
} = require('../controllers/growthController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { growthRecordRules, childIdParamRule, recordIdParamRule } = require('../validators/growthValidators');

router.use(protect);

// Nested under a child
router.get('/children/:childId/growth', childIdParamRule, validate, listGrowthRecords);
router.post('/children/:childId/growth', childIdParamRule, growthRecordRules, validate, addGrowthRecord);
router.get('/children/:childId/growth/insights', childIdParamRule, validate, getGrowthInsights);

// Standalone record operations
router.patch('/growth/:id', recordIdParamRule, growthRecordRules, validate, updateGrowthRecord);
router.delete('/growth/:id', recordIdParamRule, validate, deleteGrowthRecord);

module.exports = router;
