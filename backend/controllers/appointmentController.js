const Appointment = require('../models/Appointment');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/children/:childId/appointments?status=
const listAppointments = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const filter = { child: req.params.childId };
  if (req.query.status) filter.status = req.query.status;

  const appointments = await Appointment.find(filter).sort({ dateTime: 1 });
  res.json({ success: true, data: { appointments } });
});

// POST /api/children/:childId/appointments
const createAppointment = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const appointment = await Appointment.create({ ...req.body, child: child._id });
  await logAction(req, 'APPOINTMENT_CREATED', 'Appointment', appointment._id);
  res.status(201).json({ success: true, message: 'Appointment scheduled', data: { appointment } });
});

// PATCH /api/appointments/:id
const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate('child');
  if (!appointment) throw new AppError('Appointment not found', 404);
  if (appointment.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this appointment', 403);
  }

  ['title', 'doctorName', 'location', 'dateTime', 'reason', 'status', 'notes'].forEach((field) => {
    if (req.body[field] !== undefined) appointment[field] = req.body[field];
  });
  await appointment.save();

  await logAction(req, 'APPOINTMENT_UPDATED', 'Appointment', appointment._id);
  res.json({ success: true, message: 'Appointment updated', data: { appointment } });
});

// DELETE /api/appointments/:id
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate('child');
  if (!appointment) throw new AppError('Appointment not found', 404);
  if (appointment.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this appointment', 403);
  }
  await appointment.deleteOne();
  res.json({ success: true, message: 'Appointment removed' });
});

module.exports = { listAppointments, createAppointment, updateAppointment, deleteAppointment };
