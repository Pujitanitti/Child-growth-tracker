const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const { getInsights } = require('../controllers/insightController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/children/:childId/insights', [param('childId').isMongoId()], validate, getInsights);

module.exports = router;
