const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['first-steps', 'first-words', 'birthday', 'photo', 'note', 'other'],
      default: 'other',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: { type: String, trim: true, default: null },
    date: { type: Date, required: true, default: Date.now },
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

memorySchema.index({ child: 1, date: -1 });

module.exports = mongoose.model('Memory', memorySchema);
