const AuditLog = require('../models/AuditLog');

/**
 * Fire-and-forget audit log write. Never throws or blocks the response —
 * an audit log failure should never break the actual user-facing action.
 */
async function logAction(req, action, entityType = null, entityId = null, metadata = {}) {
  try {
    await AuditLog.create({
      user: req.user ? req.user._id : null,
      action,
      entityType,
      entityId,
      ip: req.ip,
      metadata,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { logAction };
