const Memory = require('../models/Memory');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

// GET /api/children/:childId/memories
const listMemories = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  await findOwnedChild(req);

  const memories = await Memory.find({ child: req.params.childId }).sort({ date: -1 });
  res.json({ success: true, data: { memories } });
});

// POST /api/children/:childId/memories  (multipart, optional "photo" field)
const addMemory = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const memory = await Memory.create({
    child: child._id,
    type: req.body.type || 'other',
    title: req.body.title,
    description: req.body.description || null,
    date: req.body.date || Date.now(),
    photo: req.file ? `/uploads/${req.file.filename}` : null,
  });

  await logAction(req, 'MEMORY_ADDED', 'Memory', memory._id);
  res.status(201).json({ success: true, message: 'Memory added', data: { memory } });
});

// DELETE /api/memories/:id
const deleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memory.findById(req.params.id).populate('child');
  if (!memory) throw new AppError('Memory not found', 404);
  if (memory.child.parent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You do not have access to this memory', 403);
  }
  await memory.deleteOne();
  res.json({ success: true, message: 'Memory removed' });
});

module.exports = { listMemories, addMemory, deleteMemory };
