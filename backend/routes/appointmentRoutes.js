const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const {
  listAppointments, createAppointment, updateAppointment, deleteAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const childIdParamRule = [param('childId').isMongoId()];
const idParamRule = [param('id').isMongoId()];
const statusQueryRule = [query('status').optional().isIn(['scheduled', 'completed', 'cancelled'])];
const appointmentRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('dateTime').isISO8601().withMessage('Enter a valid date/time').toDate(),
  body('doctorName').optional({ nullable: true }).isString().trim(),
  body('location').optional({ nullable: true }).isString().trim(),
  body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

router.use(protect);

router.get('/children/:childId/appointments', childIdParamRule, statusQueryRule, validate, listAppointments);
router.post('/children/:childId/appointments', childIdParamRule, appointmentRules, validate, createAppointment);
router.patch('/appointments/:id', idParamRule, validate, updateAppointment);
router.delete('/appointments/:id', idParamRule, validate, deleteAppointment);

module.exports = router;
