/**
 * App-wide constants kept in one place so controllers and seed scripts
 * stay in sync instead of duplicating magic values.
 */

// Standard pediatric vaccination schedule (simplified, ages in days from birth).
// Used to auto-generate a child's vaccination timeline when a child is created.
const VACCINE_SCHEDULE = [
  { vaccine: 'BCG', dueDay: 0, doseLabel: 'Birth dose' },
  { vaccine: 'Hepatitis B - Dose 1', dueDay: 0, doseLabel: 'Birth dose' },
  { vaccine: 'OPV - Dose 1', dueDay: 42, doseLabel: '6 weeks' },
  { vaccine: 'DTaP - Dose 1', dueDay: 42, doseLabel: '6 weeks' },
  { vaccine: 'OPV - Dose 2', dueDay: 70, doseLabel: '10 weeks' },
  { vaccine: 'DTaP - Dose 2', dueDay: 70, doseLabel: '10 weeks' },
  { vaccine: 'OPV - Dose 3', dueDay: 98, doseLabel: '14 weeks' },
  { vaccine: 'DTaP - Dose 3', dueDay: 98, doseLabel: '14 weeks' },
  { vaccine: 'MMR - Dose 1', dueDay: 270, doseLabel: '9 months' },
  { vaccine: 'Hepatitis A - Dose 1', dueDay: 365, doseLabel: '12 months' },
  { vaccine: 'MMR - Dose 2', dueDay: 456, doseLabel: '15 months' },
  { vaccine: 'DTaP - Booster 1', dueDay: 548, doseLabel: '18 months' },
  { vaccine: 'DTaP - Booster 2', dueDay: 1460, doseLabel: '4-6 years' },
];

// Milestone checklist grouped by developmental domain and typical age window (months).
const MILESTONE_LIBRARY = [
  { domain: 'Motor Skills', title: 'Holds head up', ageMonths: 3 },
  { domain: 'Motor Skills', title: 'Rolls over', ageMonths: 5 },
  { domain: 'Motor Skills', title: 'Sits without support', ageMonths: 7 },
  { domain: 'Motor Skills', title: 'Crawls', ageMonths: 9 },
  { domain: 'Motor Skills', title: 'Walks independently', ageMonths: 13 },
  { domain: 'Language', title: 'Babbles', ageMonths: 6 },
  { domain: 'Language', title: 'Says first word', ageMonths: 12 },
  { domain: 'Language', title: 'Says 2-word phrases', ageMonths: 24 },
  { domain: 'Social Skills', title: 'Social smile', ageMonths: 2 },
  { domain: 'Social Skills', title: 'Stranger anxiety', ageMonths: 8 },
  { domain: 'Social Skills', title: 'Plays alongside other children', ageMonths: 24 },
  { domain: 'Cognitive Skills', title: 'Object permanence', ageMonths: 8 },
  { domain: 'Cognitive Skills', title: 'Points to pictures when named', ageMonths: 18 },
  { domain: 'Cognitive Skills', title: 'Sorts shapes and colors', ageMonths: 30 },
];

// WHO-style simplified BMI-for-age thresholds by percentile band, used for status labeling.
const BMI_STATUS_BANDS = [
  { max: 5, status: 'Underweight' },
  { max: 85, status: 'Healthy weight' },
  { max: 95, status: 'Overweight' },
  { max: Infinity, status: 'Obese' },
];

module.exports = { VACCINE_SCHEDULE, MILESTONE_LIBRARY, BMI_STATUS_BANDS };
