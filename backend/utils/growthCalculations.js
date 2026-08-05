const { BMI_STATUS_BANDS } = require('../config/constants');

/**
 * NOTE ON CLINICAL ACCURACY
 * The percentile/reference-band math below is a simplified statistical
 * approximation for demonstration purposes (a normal-distribution estimate
 * around illustrative mean/SD-by-age anchors). It is NOT a substitute for
 * official WHO/CDC growth chart LMS tables and must not be used for real
 * medical decisions. Swap `heightMeanSD`/`weightMeanSD` for the real LMS
 * dataset before using this in a clinical setting.
 */

// Illustrative mean/SD anchors (cm / kg) by age in months, gender-averaged.
// Sparse control points; we linearly interpolate between them.
const HEIGHT_REFERENCE = [
  { m: 0, mean: 50, sd: 2.2 }, { m: 6, mean: 67, sd: 2.5 }, { m: 12, mean: 75, sd: 2.8 },
  { m: 24, mean: 87, sd: 3.2 }, { m: 36, mean: 96, sd: 3.6 }, { m: 60, mean: 110, sd: 4.2 },
  { m: 96, mean: 128, sd: 5.0 }, { m: 144, mean: 152, sd: 6.5 },
];
const WEIGHT_REFERENCE = [
  { m: 0, mean: 3.4, sd: 0.5 }, { m: 6, mean: 7.9, sd: 0.9 }, { m: 12, mean: 9.6, sd: 1.1 },
  { m: 24, mean: 12.2, sd: 1.4 }, { m: 36, mean: 14.3, sd: 1.7 }, { m: 60, mean: 18.0, sd: 2.3 },
  { m: 96, mean: 27.0, sd: 3.8 }, { m: 144, mean: 42.0, sd: 6.0 },
];

function interpolate(reference, ageMonths) {
  const pts = reference;
  if (ageMonths <= pts[0].m) return pts[0];
  if (ageMonths >= pts[pts.length - 1].m) return pts[pts.length - 1];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    if (ageMonths >= a.m && ageMonths <= b.m) {
      const t = (ageMonths - a.m) / (b.m - a.m);
      return { mean: a.mean + t * (b.mean - a.mean), sd: a.sd + t * (b.sd - a.sd) };
    }
  }
  return pts[pts.length - 1];
}

// Standard normal CDF approximation (Abramowitz & Stegun 7.1.26).
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) prob = 1 - prob;
  return 1 - prob;
}

function percentileFor(value, reference, ageMonths) {
  const { mean, sd } = interpolate(reference, ageMonths);
  const z = (value - mean) / sd;
  return Math.round(normalCDF(z) * 1000) / 10; // one decimal place
}

function heightPercentile(heightCm, ageMonths) {
  return percentileFor(heightCm, HEIGHT_REFERENCE, ageMonths);
}

function weightPercentile(weightKg, ageMonths) {
  return percentileFor(weightKg, WEIGHT_REFERENCE, ageMonths);
}

function calculateBMI(heightCm, weightKg) {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
}

/**
 * Maps a BMI percentile (approximated from weight percentile as a stand-in
 * for a true BMI-for-age table) to a human-readable weight status band.
 */
function bmiStatusFromPercentile(percentile) {
  const band = BMI_STATUS_BANDS.find((b) => percentile <= b.max);
  return band ? band.status : 'Unknown';
}

/**
 * Growth velocity: rate of change between the two most recent records,
 * expressed per month, for both height and weight.
 */
function calculateGrowthVelocity(records) {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[sorted.length - 2];
  const last = sorted[sorted.length - 1];
  const months = Math.max((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24 * 30.44), 0.1);
  return {
    heightCmPerMonth: Number(((last.heightCm - first.heightCm) / months).toFixed(2)),
    weightKgPerMonth: Number(((last.weightKg - first.weightKg) / months).toFixed(2)),
  };
}

/**
 * Simple linear regression over recent height records to project height at
 * a future age. Intentionally lightweight — flagged as an estimate, not a
 * clinical prediction, in the API response that uses it.
 */
function predictFutureHeight(records, monthsAhead = 6) {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const points = sorted.map((r) => ({ x: new Date(r.date).getTime(), y: r.heightCm }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const futureTime = points[points.length - 1].x + monthsAhead * 30.44 * 24 * 60 * 60 * 1000;
  const predictedHeight = slope * futureTime + intercept;

  return {
    predictedHeightCm: Math.round(predictedHeight * 10) / 10,
    monthsAhead,
    basis: 'linear-trend-estimate',
  };
}

/**
 * Composite 0-100 health score blending how close height/weight percentiles
 * are to the healthy mid-range, plus a small bonus for consistent tracking.
 */
function calculateHealthScore({ heightPercentile: hp, weightPercentile: wp, recordCount }) {
  const centerScore = (p) => 100 - Math.abs(50 - p) * 1.4; // peaks at the 50th percentile
  const heightScore = Math.max(0, Math.min(100, centerScore(hp)));
  const weightScore = Math.max(0, Math.min(100, centerScore(wp)));
  const trackingBonus = Math.min(10, recordCount * 2);
  const score = Math.round(heightScore * 0.45 + weightScore * 0.45 + trackingBonus * 0.1 + 0);
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  heightPercentile,
  weightPercentile,
  calculateBMI,
  bmiStatusFromPercentile,
  calculateGrowthVelocity,
  predictFutureHeight,
  calculateHealthScore,
};
