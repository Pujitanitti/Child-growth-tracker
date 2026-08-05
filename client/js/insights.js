// insights.js — Renders rule-based health insight cards (not a chatbot —
// see backend/controllers/insightController.js for the plain-language rules).

import { api } from './api.js';

export async function fetchInsights(childId) {
  const res = await api.get(`/children/${childId}/insights`);
  return res.data.insights;
}

const TONE_STYLE = {
  positive: 'insight-card--positive',
  attention: 'insight-card--attention',
  neutral: 'insight-card--neutral',
};

export function insightCardHtml(insight) {
  return `
    <div class="insight-card ${TONE_STYLE[insight.tone] || ''}">
      <span class="insight-card__icon">${insight.icon}</span>
      <span class="insight-card__text">${insight.text}</span>
    </div>
  `;
}

export function renderInsights(container, insights) {
  container.innerHTML = insights.map(insightCardHtml).join('');
}
