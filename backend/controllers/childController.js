const Child = require('../models/Child');
const Vaccination = require('../models/Vaccination');
const Milestone = require('../models/Milestone');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');
const { VACCINE_SCHEDULE, MILESTONE_LIBRARY } = require('../config/constants');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Ensures a child belongs to the requesting user (or the requester is an admin)
// before any read/write proceeds. Centralized here so every handler stays consistent.
async function findOwnedChild(req) {
  const child = await Child.findById(req.params.id);
  if (!child) throw new AppError('Child not found', 404);
  if (child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this child', 403);
  }
  return child;
}

// Shared by createChild and the CSV importer so both paths generate the
// same auto-populated vaccination timeline and milestone checklist.
async function generateChildDefaults(child) {
  const dob = new Date(child.dateOfBirth);
  const vaccinations = VACCINE_SCHEDULE.map((v) => ({
    child: child._id,
    vaccine: v.vaccine,
    doseLabel: v.doseLabel,
    dueDate: new Date(dob.getTime() + v.dueDay * 24 * 60 * 60 * 1000),
  }));
  const milestones = MILESTONE_LIBRARY.map((m) => ({
    child: child._id,
    domain: m.domain,
    title: m.title,
    expectedAgeMonths: m.ageMonths,
  }));
  await Promise.all([Vaccination.insertMany(vaccinations), Milestone.insertMany(milestones)]);
}

// POST /api/children/import  (multipart form, field name "file", CSV)
// Expected columns: name,gender,dateOfBirth,bloodGroup (bloodGroup optional).
// Skips and reports any row that fails validation rather than aborting the
// whole import, so one bad row doesn't block the rest.
const importChildrenCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No CSV file uploaded', 400);

  const content = fs.readFileSync(req.file.path, 'utf-8');
  let rows;
  try {
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw new AppError(`Could not parse CSV: ${err.message}`, 400);
  }

  const created = [];
  const errors = [];
  const validGenders = ['male', 'female', 'other'];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    try {
      if (!row.name?.trim()) throw new Error('Missing name');
      if (!validGenders.includes(row.gender?.trim().toLowerCase())) throw new Error('Gender must be male, female, or other');
      const dob = new Date(row.dateOfBirth);
      if (Number.isNaN(dob.getTime())) throw new Error('Invalid dateOfBirth (use YYYY-MM-DD)');

      const child = await Child.create({
        name: row.name.trim(),
        gender: row.gender.trim().toLowerCase(),
        dateOfBirth: dob,
        bloodGroup: row.bloodGroup?.trim() || 'Unknown',
        parent: req.user._id,
      });
      await generateChildDefaults(child);
      created.push(child);
    } catch (err) {
      errors.push({ row: rowNum, message: err.message });
    }
  }

  fs.unlink(req.file.path, () => {}); // best-effort cleanup of the temp upload

  await logAction(req, 'CHILDREN_IMPORTED', 'Child', null, { createdCount: created.length, errorCount: errors.length });

  res.status(created.length ? 201 : 400).json({
    success: created.length > 0,
    message: `Imported ${created.length} of ${rows.length} rows${errors.length ? `, ${errors.length} failed` : ''}`,
    data: { created, errors },
  });
});

const listChildren = asyncHandler(async (req, res) => {
  const { gender, search, page = 1, limit = 20 } = req.query;
  const filter = { parent: req.user._id, isArchived: false };
  if (gender) filter.gender = gender;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [children, total] = await Promise.all([
    Child.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Child.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { children, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } },
  });
});

// GET /api/children/:id
const getChild = asyncHandler(async (req, res) => {
  const child = await findOwnedChild(req);
  res.json({ success: true, data: { child } });
});

// POST /api/children
const createChild = asyncHandler(async (req, res) => {
  const child = await Child.create({ ...req.body, parent: req.user._id });
  await generateChildDefaults(child);

  await logAction(req, 'CHILD_CREATED', 'Child', child._id);
  res.status(201).json({ success: true, message: 'Child added', data: { child } });
});

// PATCH /api/children/:id
const updateChild = asyncHandler(async (req, res) => {
  const existing = await findOwnedChild(req);
  const allowed = [
    'name', 'gender', 'dateOfBirth', 'bloodGroup', 'birthWeightKg', 'birthHeightCm',
    'medicalConditions', 'allergies', 'emergencyContact', 'doctor', 'notes',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) existing[field] = req.body[field];
  });
  await existing.save();

  await logAction(req, 'CHILD_UPDATED', 'Child', existing._id);
  res.json({ success: true, message: 'Child updated', data: { child: existing } });
});

// DELETE /api/children/:id  (soft delete)
const deleteChild = asyncHandler(async (req, res) => {
  const child = await findOwnedChild(req);
  child.isArchived = true;
  await child.save();

  await logAction(req, 'CHILD_DELETED', 'Child', child._id);
  res.json({ success: true, message: 'Child removed' });
});

// POST /api/children/:id/photo
const uploadChildPhoto = asyncHandler(async (req, res) => {
  const child = await findOwnedChild(req);
  if (!req.file) throw new AppError('No file uploaded', 400);

  child.photo = `/uploads/${req.file.filename}`;
  await child.save();

  res.json({ success: true, message: 'Photo updated', data: { child } });
});

module.exports = {
  listChildren, getChild, createChild, updateChild, deleteChild, uploadChildPhoto, findOwnedChild, importChildrenCsv,
};
