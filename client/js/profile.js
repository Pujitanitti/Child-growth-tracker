// profile.js — Profile view/update, password change, avatar upload logic
// used by profile.html.

import { api } from './api.js';
import { showToast } from './components/toast.js';
import { validateForm, rules, passwordStrength } from './validators.js';

export async function updateProfile(data) {
  return api.patch('/auth/me', data);
}

export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const errors = validateForm({ currentPassword, newPassword, confirmPassword }, {
    currentPassword: [(v) => rules.required(v, 'Current password')],
    newPassword: [rules.password],
    confirmPassword: [rules.matches(newPassword, 'Passwords')],
  });
  if (Object.keys(errors).length) {
    const firstError = Object.values(errors)[0];
    showToast(firstError, 'error');
    throw new Error(firstError);
  }
  return api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await api.post('/auth/avatar', formData);
  return res.data.user;
}

export function wirePasswordStrengthMeter(inputEl, meterEl) {
  inputEl.addEventListener('input', () => {
    const strength = passwordStrength(inputEl.value);
    const bars = meterEl.querySelectorAll('.password-strength__bar');
    bars.forEach((bar, i) => {
      bar.className = 'password-strength__bar';
      const thresholds = { weak: 1, medium: 2, strong: 3 };
      if (i < thresholds[strength]) bar.classList.add(strength);
    });
  });
}
