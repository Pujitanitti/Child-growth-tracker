// validators.js — Client-side validation mirrors the backend's rules so
// users get instant feedback instead of waiting on a round trip. The
// backend remains the source of truth and re-validates everything.

export const rules = {
  required: (value, label = 'This field') => (!value || !String(value).trim() ? `${label} is required` : null),

  email: (value) => (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(value) ? 'Enter a valid email address' : null),

  minLength: (min) => (value, label = 'This field') =>
    (value || '').length < min ? `${label} must be at least ${min} characters` : null,

  password: (value) => {
    if (!value || value.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(value)) return 'Password must contain at least one number';
    return null;
  },

  matches: (otherValue, label = 'Fields') => (value) => (value !== otherValue ? `${label} do not match` : null),

  positiveNumber: (value, label = 'Value') => {
    const n = Number(value);
    return Number.isNaN(n) || n <= 0 ? `${label} must be a positive number` : null;
  },

  pastDate: (value, label = 'Date') => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return `${label} is invalid`;
    if (d > new Date()) return `${label} cannot be in the future`;
    return null;
  },
};

/**
 * Runs a { fieldName: [validatorFns] } map against a data object.
 * Returns { fieldName: errorMessage } for any failing fields.
 */
export function validateForm(data, schema) {
  const errors = {};
  for (const [field, validators] of Object.entries(schema)) {
    for (const validate of validators) {
      const error = validate(data[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
}

export function passwordStrength(value = '') {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
