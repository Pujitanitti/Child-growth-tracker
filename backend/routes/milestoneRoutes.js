const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { listMilestones, addMilestone, markAchieved, deleteMilestone } = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const domainQueryRule = [query('domain').optional().isIn(['Motor Skills', 'Language', 'Social Skills', 'Cognitive Skills'])];
const milestoneRules = [
  body('domain').isIn(['Motor Skills', 'Language', 'Social Skills', 'Cognitive Skills']),
  body('title').trim().notEmpty(),
  body('expectedAgeMonths').isInt({ min: 0, max: 216 }),
];

router.use(protect);

router.get('/children/:childId/milestones', childIdParamRule, domainQueryRule, validate, listMilestones);
router.post('/children/:childId/milestones', childIdParamRule, milestoneRules, validate, addMilestone);
router.patch('/milestones/:id/achieve', idParamRule, validate, markAchieved);
router.delete('/milestones/:id', idParamRule, validate, deleteMilestone);

module.exports = router;
