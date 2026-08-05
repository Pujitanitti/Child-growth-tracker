// illustrations.js — Small flat SVG illustrations for empty states.
// Kept intentionally simple (a handful of shapes) rather than pulling in an
// icon-illustration library, so there's no extra dependency or network call.

export const ILLUSTRATIONS = {
  noChildren: `
    <svg viewBox="0 0 160 120" width="140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="80" cy="105" rx="55" ry="8" fill="var(--color-primary-softer)"/>
      <circle cx="80" cy="55" r="34" fill="var(--color-primary-soft)"/>
      <circle cx="80" cy="42" r="16" fill="var(--color-primary)"/>
      <path d="M56 78 Q80 100 104 78" stroke="var(--color-primary)" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="72" cy="40" r="2.5" fill="#fff"/>
      <circle cx="88" cy="40" r="2.5" fill="#fff"/>
      <path d="M40 30 Q30 20 20 28" stroke="var(--color-accent)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M120 30 Q130 20 140 28" stroke="var(--color-accent)" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>
  `,
  noAppointments: `
    <svg viewBox="0 0 160 120" width="140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="80" cy="105" rx="55" ry="8" fill="var(--color-primary-softer)"/>
      <rect x="45" y="30" width="70" height="60" rx="10" fill="var(--color-primary-soft)"/>
      <rect x="45" y="30" width="70" height="18" rx="10" fill="var(--color-primary)"/>
      <circle cx="80" cy="65" r="14" fill="#fff"/>
      <path d="M74 65 L79 70 L88 59" stroke="var(--color-primary)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="60" y="24" width="6" height="12" rx="3" fill="var(--color-primary-dark)"/>
      <rect x="94" y="24" width="6" height="12" rx="3" fill="var(--color-primary-dark)"/>
    </svg>
  `,
  noData: `
    <svg viewBox="0 0 160 120" width="140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="80" cy="105" rx="55" ry="8" fill="var(--color-primary-softer)"/>
      <rect x="35" y="60" width="18" height="35" rx="4" fill="var(--color-primary-soft)"/>
      <rect x="60" y="45" width="18" height="50" rx="4" fill="var(--color-primary)"/>
      <rect x="85" y="65" width="18" height="30" rx="4" fill="var(--color-accent-soft)"/>
      <rect x="110" y="35" width="18" height="60" rx="4" fill="var(--color-accent)"/>
      <path d="M30 40 Q70 15 130 30" stroke="var(--color-primary)" stroke-width="2.5" fill="none" stroke-dasharray="4 4"/>
    </svg>
  `,
  noMemories: `
    <svg viewBox="0 0 160 120" width="140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="80" cy="105" rx="55" ry="8" fill="var(--color-primary-softer)"/>
      <path d="M80 88 C50 65 40 45 55 33 C65 25 80 32 80 45 C80 32 95 25 105 33 C120 45 110 65 80 88 Z" fill="var(--color-accent)"/>
      <circle cx="40" cy="35" r="6" fill="var(--color-primary-soft)"/>
      <circle cx="122" cy="35" r="4" fill="var(--color-primary-soft)"/>
      <circle cx="128" cy="55" r="3" fill="var(--color-accent-soft)"/>
    </svg>
  `,
  noMedicines: `
    <svg viewBox="0 0 160 120" width="140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="80" cy="105" rx="55" ry="8" fill="var(--color-primary-softer)"/>
      <rect x="60" y="30" width="40" height="65" rx="14" fill="var(--color-primary-soft)"/>
      <rect x="60" y="48" width="40" height="10" fill="var(--color-primary)"/>
      <rect x="68" y="22" width="24" height="12" rx="4" fill="var(--color-primary-dark)"/>
      <circle cx="72" cy="72" r="4" fill="var(--color-accent)"/>
      <circle cx="86" cy="78" r="4" fill="var(--color-accent-soft)"/>
      <circle cx="80" cy="66" r="4" fill="var(--color-accent)"/>
    </svg>
  `,
};

/** Renders an illustrated empty state into a container. */
export function renderIllustratedEmptyState(container, { illustration = 'noData', title, message, actionHtml = '' }) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="mb-4">${ILLUSTRATIONS[illustration] || ILLUSTRATIONS.noData}</div>
      <h4 class="empty-state__title">${title}</h4>
      <p>${message}</p>
      ${actionHtml}
    </div>
  `;
}
