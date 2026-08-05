const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const { getBadges } = require('../controllers/badgeController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/children/:childId/badges', [param('childId').isMongoId()], validate, getBadges);

module.exports = router;
