const Vaccination = require('../models/Vaccination');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/children/:childId/vaccinations?status=upcoming|completed|missed
const listVaccinations = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const filter = { child: req.params.childId };
  if (req.query.status) filter.status = req.query.status;

  const vaccinations = await Vaccination.find(filter).sort({ dueDate: 1 });
  res.json({ success: true, data: { vaccinations } });
});

// POST /api/children/:childId/vaccinations  (add a custom/extra vaccine)
const addVaccination = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const vaccination = await Vaccination.create({ ...req.body, child: child._id });
  await logAction(req, 'VACCINATION_ADDED', 'Vaccination', vaccination._id);
  res.status(201).json({ success: true, message: 'Vaccine added to schedule', data: { vaccination } });
});

// PATCH /api/vaccinations/:id/complete
const markCompleted = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate('child');
  if (!vaccination) throw new AppError('Vaccination record not found', 404);
  if (vaccination.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this record', 403);
  }

  vaccination.status = 'completed';
  vaccination.completedDate = req.body.completedDate || new Date();
  vaccination.administeredBy = req.body.administeredBy || vaccination.administeredBy;
  await vaccination.save();

  await logAction(req, 'VACCINATION_COMPLETED', 'Vaccination', vaccination._id);
  res.json({ success: true, message: 'Marked as completed', data: { vaccination } });
});

// PATCH /api/vaccinations/:id
const updateVaccination = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate('child');
  if (!vaccination) throw new AppError('Vaccination record not found', 404);
  if (vaccination.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this record', 403);
  }

  ['vaccine', 'doseLabel', 'dueDate', 'notes'].forEach((field) => {
    if (req.body[field] !== undefined) vaccination[field] = req.body[field];
  });
  await vaccination.save();
  res.json({ success: true, message: 'Vaccination updated', data: { vaccination } });
});

// DELETE /api/vaccinations/:id
const deleteVaccination = asyncHandler(async (req, res) => {
  const vaccination = await Vaccination.findById(req.params.id).populate('child');
  if (!vaccination) throw new AppError('Vaccination record not found', 404);
  if (vaccination.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this record', 403);
  }
  await vaccination.deleteOne();
  res.json({ success: true, message: 'Vaccination removed' });
});

module.exports = { listVaccinations, addVaccination, markCompleted, updateVaccination, deleteVaccination };
