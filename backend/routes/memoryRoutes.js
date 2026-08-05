const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { listMemories, addMemory, deleteMemory } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadPhoto } = require('../middleware/upload');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const memoryRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').optional().isIn(['first-steps', 'first-words', 'birthday', 'photo', 'note', 'other']),
  body('date').optional().isISO8601(),
];

router.use(protect);

router.get('/children/:childId/memories', childIdParamRule, validate, listMemories);
// uploadPhoto runs before validate so multipart text fields are parsed first
router.post('/children/:childId/memories', childIdParamRule, uploadPhoto, memoryRules, validate, addMemory);
router.delete('/memories/:id', idParamRule, validate, deleteMemory);

module.exports = router;
