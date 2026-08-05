const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    hoursSlept: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    napHours: {
      type: Number,
      min: 0,
      max: 24,
      default: 0,
    },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

sleepLogSchema.index({ child: 1, date: -1 });

module.exports = mongoose.model('SleepLog', sleepLogSchema);
