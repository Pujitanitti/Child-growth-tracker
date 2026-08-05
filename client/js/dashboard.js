// dashboard.js — Fetches the aggregated dashboard summary and renders every
// widget on dashboard.html: stat cards, growth score rings, activity feed,
// upcoming vaccinations / reminders, and the growth chart for the selected child.

import { api } from './api.js';
import { formatDate, timeAgo, resolveUploadUrl, initials } from './utils.js';
import { renderScoreDonut, renderHeightChart, renderWeightChart } from './charts.js';
import { animateCounter } from './app.js';
import { renderSkeletonCards } from './components/loader.js';
import { renderIllustratedEmptyState } from './illustrations.js';

export async function fetchDashboardSummary() {
  const res = await api.get('/dashboard/summary');
  return res.data;
}

export function renderStatCards(container, summary) {
  const cards = [
    { icon: 'fa-children', color: '', label: 'Total Children', value: summary.totalChildren },
    { icon: 'fa-arrow-trend-up', color: 'accent', label: 'Average Growth Score', value: summary.averageGrowthScore },
    { icon: 'fa-syringe', color: 'info', label: 'Upcoming Vaccinations', value: summary.upcomingVaccinations.length },
    { icon: 'fa-bell', color: 'warning', label: "Today's Reminders", value: summary.todaysReminders.length },
  ];

  container.innerHTML = cards.map((c, i) => `
    <div class="card stat-card tilt-card animate-fade-in-up animate-stagger" style="--stagger-index:${i}">
      <div class="stat-card__icon ${c.color} icon-bounce"><i class="fa-solid ${c.icon}"></i></div>
      <div class="stat-card__value counter" id="counter-${i}">0</div>
      <div class="stat-card__label">${c.label}</div>
    </div>
  `).join('');

  cards.forEach((c, i) => animateCounter(document.getElementById(`counter-${i}`), c.value));
}

export function renderChildSummaries(container, childSummaries) {
  if (!childSummaries.length) {
    renderIllustratedEmptyState(container, {
      illustration: 'noChildren',
      title: 'No children added yet',
      message: 'Add your first child to start tracking their growth journey.',
      actionHtml: '<a href="/pages/children.html" class="btn btn-primary mt-4">Add a Child</a>',
    });
    return;
  }

  container.innerHTML = childSummaries.map(({ child, growthScore, bmiStatus, latestRecord }, i) => `
    <div class="card tilt-card animate-fade-in-up animate-stagger" style="--stagger-index:${i}">
      <div class="flex items-center gap-4">
        ${child.photo
          ? `<img src="${resolveUploadUrl(child.photo)}" class="avatar avatar-md" alt="${child.name}">`
          : `<span class="avatar avatar-md">${initials(child.name)}</span>`}
        <div class="flex-1">
          <div class="font-semibold">${child.name}</div>
          <div class="text-xs text-muted">${bmiStatus || 'No records yet'}</div>
        </div>
        ${growthScore !== null ? `
          <div class="growth-score-ring">
            <canvas id="ring-${child._id}" width="96" height="96"></canvas>
            <div class="growth-score-ring__value">${growthScore}</div>
          </div>
        ` : ''}
      </div>
      ${growthScore !== null ? `
        <div class="mt-3">
          <span class="health-status-badge ${growthScore >= 60 ? 'health-status-badge--healthy' : 'health-status-badge--attention'}">
            <i class="fa-solid ${growthScore >= 60 ? 'fa-leaf' : 'fa-triangle-exclamation'}"></i>
            ${growthScore >= 60 ? 'Healthy Growth' : 'Needs Attention'}
          </span>
        </div>
      ` : ''}
      ${latestRecord ? `<div class="text-xs text-muted mt-3">Last measured ${timeAgo(latestRecord.date)}: ${latestRecord.heightCm}cm, ${latestRecord.weightKg}kg</div>` : ''}
      <a href="/pages/children.html#${child._id}" class="btn btn-secondary btn-sm w-full mt-4">View Details</a>
    </div>
  `).join('');

  childSummaries.forEach(({ child, growthScore }) => {
    if (growthScore !== null) renderScoreDonut(`ring-${child._id}`, growthScore);
  });
}

export function renderActivityFeed(container, records) {
  if (!records.length) {
    container.innerHTML = `<p class="text-sm text-muted">No recent activity yet.</p>`;
    return;
  }
  container.innerHTML = records.map((r) => `
    <div class="activity-item">
      <div class="activity-item__icon"><i class="fa-solid fa-ruler-vertical"></i></div>
      <div>
        <div class="activity-item__title">${r.child?.name || 'A child'}'s growth was recorded</div>
        <div class="activity-item__meta">${r.heightCm}cm, ${r.weightKg}kg · ${timeAgo(r.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

export function renderUpcomingVaccinations(container, vaccinations) {
  if (!vaccinations.length) {
    container.innerHTML = `<p class="text-sm text-muted">No vaccinations due in the next 30 days.</p>`;
    return;
  }
  container.innerHTML = vaccinations.map((v) => `
    <div class="reminder-item">
      ${v.child?.photo
        ? `<img src="${resolveUploadUrl(v.child.photo)}" class="reminder-item__child-photo" alt="">`
        : `<span class="avatar avatar-sm">${initials(v.child?.name || '')}</span>`}
      <div class="flex-1">
        <div class="text-sm font-medium">${v.vaccine}</div>
        <div class="text-xs text-muted">${v.child?.name || ''} · Due ${formatDate(v.dueDate)}</div>
      </div>
      <span class="badge badge-info">Upcoming</span>
    </div>
  `).join('');
}

export { renderSkeletonCards };
