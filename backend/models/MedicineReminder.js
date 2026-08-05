const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: { type: String, trim: true, default: null },
    frequency: {
      type: String,
      enum: ['once', 'daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'],
      default: 'daily',
    },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, default: null },
    timeOfDay: { type: String, trim: true, default: null }, // e.g. "08:00, 20:00"
    notes: { type: String, trim: true, default: null },
    isActive: { type: Boolean, default: true },
    lastTakenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

medicineReminderSchema.index({ child: 1, isActive: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
