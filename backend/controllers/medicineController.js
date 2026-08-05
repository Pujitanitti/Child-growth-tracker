const MedicineReminder = require('../models/MedicineReminder');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/children/:childId/medicines?active=true
const listMedicines = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const filter = { child: req.params.childId };
  if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';

  const medicines = await MedicineReminder.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { medicines } });
});

// POST /api/children/:childId/medicines
const addMedicine = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const medicine = await MedicineReminder.create({ ...req.body, child: child._id });
  await logAction(req, 'MEDICINE_REMINDER_ADDED', 'MedicineReminder', medicine._id);
  res.status(201).json({ success: true, message: 'Medicine reminder added', data: { medicine } });
});

// PATCH /api/medicines/:id/taken
const markTaken = asyncHandler(async (req, res) => {
  const medicine = await MedicineReminder.findById(req.params.id).populate('child');
  if (!medicine) throw new AppError('Medicine reminder not found', 404);
  if (medicine.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this reminder', 403);
  }
  medicine.lastTakenAt = new Date();
  await medicine.save();
  res.json({ success: true, message: 'Marked as taken', data: { medicine } });
});

// PATCH /api/medicines/:id
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await MedicineReminder.findById(req.params.id).populate('child');
  if (!medicine) throw new AppError('Medicine reminder not found', 404);
  if (medicine.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this reminder', 403);
  }
  ['medicineName', 'dosage', 'frequency', 'startDate', 'endDate', 'timeOfDay', 'notes', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) medicine[field] = req.body[field];
  });
  await medicine.save();
  res.json({ success: true, message: 'Medicine reminder updated', data: { medicine } });
});

// DELETE /api/medicines/:id
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await MedicineReminder.findById(req.params.id).populate('child');
  if (!medicine) throw new AppError('Medicine reminder not found', 404);
  if (medicine.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this reminder', 403);
  }
  await medicine.deleteOne();
  res.json({ success: true, message: 'Medicine reminder removed' });
});

module.exports = { listMedicines, addMedicine, markTaken, updateMedicine, deleteMedicine };
