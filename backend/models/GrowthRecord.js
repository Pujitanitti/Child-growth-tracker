const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    heightCm: {
      type: Number,
      required: [true, 'Height is required'],
      min: [1, 'Height must be a positive number'],
    },
    weightKg: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be a positive number'],
    },
    headCircumferenceCm: {
      type: Number,
      min: 0,
      default: null,
    },
    bmi: {
      type: Number,
      default: null,
    },
    percentile: {
      type: Number,
      default: null,
    },
    weightStatus: {
      type: String,
      enum: ['Underweight', 'Healthy weight', 'Overweight', 'Obese', null],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-calculate BMI (kg/m^2) any time height or weight changes, so the client
// never has to compute or trust a client-supplied BMI value.
growthRecordSchema.pre('save', function calculateBMI(next) {
  if (this.isModified('heightCm') || this.isModified('weightKg')) {
    const heightM = this.heightCm / 100;
    this.bmi = Number((this.weightKg / (heightM * heightM)).toFixed(2));
  }
  next();
});

growthRecordSchema.index({ child: 1, date: -1 });

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);
