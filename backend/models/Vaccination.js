const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    vaccine: {
      type: String,
      required: true,
      trim: true,
    },
    doseLabel: {
      type: String,
      trim: true,
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'missed'],
      default: 'upcoming',
    },
    completedDate: {
      type: Date,
      default: null,
    },
    administeredBy: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

vaccinationSchema.index({ child: 1, dueDate: 1 });

module.exports = mongoose.model('Vaccination', vaccinationSchema);
