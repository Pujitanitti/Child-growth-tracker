// badges.js — Renders achievement badges computed by the backend from
// existing tracking data (see backend/controllers/badgeController.js).

import { api } from './api.js';

export async function fetchBadges(childId) {
  const res = await api.get(`/children/${childId}/badges`);
  return res.data;
}

export function badgeCardHtml(badge) {
  const pct = Math.round((badge.progress / badge.target) * 100);
  return `
    <div class="card badge-card tilt-card ${badge.earned ? 'badge-card--earned' : ''}">
      <div class="badge-card__icon"><i class="fa-solid ${badge.icon}"></i></div>
      <div class="font-semibold text-sm mt-2">${badge.title}</div>
      <div class="text-xs text-muted mb-3">${badge.description}</div>
      <div class="meter"><div class="meter__fill" style="width:${pct}%;"></div></div>
      <div class="text-xs text-muted mt-2">${badge.earned ? '<i class="fa-solid fa-circle-check text-success"></i> Earned' : `${badge.progress}/${badge.target}`}</div>
    </div>
  `;
}

/** Triggers a brief celebratory flash — used when a badge is newly earned or a milestone is marked achieved. */
export function celebrate(targetEl) {
  const burst = document.createElement('div');
  burst.className = 'celebrate-burst';
  burst.innerHTML = '🎉';
  targetEl.style.position = 'relative';
  targetEl.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
}
