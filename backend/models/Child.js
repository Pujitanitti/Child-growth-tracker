const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
      maxlength: 100,
    },
    photo: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    birthWeightKg: { type: Number, min: 0, default: null },
    birthHeightCm: { type: Number, min: 0, default: null },
    medicalConditions: [{ type: String, trim: true }],
    allergies: [{ type: String, trim: true }],
    emergencyContact: {
      name: { type: String, trim: true, default: null },
      relationship: { type: String, trim: true, default: null },
      phone: { type: String, trim: true, default: null },
    },
    doctor: {
      name: { type: String, trim: true, default: null },
      clinic: { type: String, trim: true, default: null },
      phone: { type: String, trim: true, default: null },
    },
    notes: { type: String, trim: true, default: null },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Virtual: current age in months, used across growth percentile / dashboard calculations.
// Guards against being computed on a partially-populated document (e.g. a
// vaccination's `.populate('child', 'name photo')`, which omits dateOfBirth) —
// without this guard, JSON-serializing such a document throws.
childSchema.virtual('ageInMonths').get(function ageInMonths() {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const dob = new Date(this.dateOfBirth);
  return (
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth()) -
    (now.getDate() < dob.getDate() ? 1 : 0)
  );
});

childSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });
childSchema.set('toObject', { virtuals: true });

childSchema.index({ parent: 1, isArchived: 1 });

module.exports = mongoose.model('Child', childSchema);
