const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Appointment title is required'],
      trim: true,
    },
    doctorName: { type: String, trim: true, default: null },
    location: { type: String, trim: true, default: null },
    dateTime: {
      type: Date,
      required: [true, 'Appointment date/time is required'],
    },
    reason: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

appointmentSchema.index({ child: 1, dateTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
