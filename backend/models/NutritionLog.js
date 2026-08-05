const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
    },
    calories: { type: Number, min: 0, default: 0 },
    proteinG: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const nutritionLogSchema = new mongoose.Schema(
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
    meals: [mealSchema],
    waterIntakeMl: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

// Aggregate totals are derived, not stored, so they can never drift out of sync
// with the underlying meal entries.
nutritionLogSchema.virtual('totalCalories').get(function totalCalories() {
  return this.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
});
nutritionLogSchema.virtual('totalProteinG').get(function totalProteinG() {
  return this.meals.reduce((sum, m) => sum + (m.proteinG || 0), 0);
});

nutritionLogSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });
nutritionLogSchema.index({ child: 1, date: -1 });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
