const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      enum: ['Motor Skills', 'Language', 'Social Skills', 'Cognitive Skills'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    expectedAgeMonths: {
      type: Number,
      required: true,
    },
    achieved: {
      type: Boolean,
      default: false,
    },
    achievedDate: {
      type: Date,
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

milestoneSchema.index({ child: 1, domain: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
