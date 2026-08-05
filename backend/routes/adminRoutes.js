const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { listUsers, updateUser, deleteUser, getAnalytics, getAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect, authorize('admin'));

const listUsersRules = [
  query('role').optional().isIn(['parent', 'admin']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['name', 'email', 'createdAt', 'lastLoginAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];
const updateUserRules = [
  param('id').isMongoId(),
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['parent', 'admin']),
];

router.get('/users', listUsersRules, validate, listUsers);
router.patch('/users/:id', updateUserRules, validate, updateUser);
router.delete('/users/:id', [param('id').isMongoId()], validate, deleteUser);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
