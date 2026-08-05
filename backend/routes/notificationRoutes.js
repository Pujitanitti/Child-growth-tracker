const express = require('express');
const router = express.Router();
const { param } = require('express-validator');

const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', listNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', [param('id').isMongoId()], validate, markRead);

module.exports = router;
