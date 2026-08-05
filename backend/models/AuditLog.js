const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true, // e.g. 'LOGIN', 'CHILD_CREATED', 'GROWTH_RECORD_DELETED'
    },
    entityType: { type: String, default: null }, // e.g. 'Child', 'GrowthRecord'
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    ip: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
