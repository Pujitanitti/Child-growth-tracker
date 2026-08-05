// loader.js — Skeleton and spinner rendering helpers for consistent loading states.

export function spinnerHtml(size = '') {
  return `<div class="spinner ${size === 'lg' ? 'spinner-lg' : ''}" role="status" aria-label="Loading"></div>`;
}

/** Renders N skeleton stat-card placeholders into a container while data loads. */
export function renderSkeletonCards(container, count = 4) {
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="card stat-card">
      <div class="skeleton" style="width:44px;height:44px;border-radius:12px;"></div>
      <div class="skeleton" style="width:60%;height:24px;"></div>
      <div class="skeleton" style="width:40%;height:14px;"></div>
    </div>
  `).join('');
}

/** Renders N skeleton table rows with the given column count. */
export function renderSkeletonRows(tbody, rows = 5, cols = 4) {
  tbody.innerHTML = Array.from({ length: rows }).map(() => `
    <tr class="skeleton-row">
      ${Array.from({ length: cols }).map(() => '<td><div class="skeleton"></div></td>').join('')}
    </tr>
  `).join('');
}

export function renderEmptyState(container, { icon = 'fa-inbox', title = 'Nothing here yet', message = '', actionHtml = '' }) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon"><i class="fa-solid ${icon}"></i></div>
      <h4 class="empty-state__title">${title}</h4>
      <p>${message}</p>
      ${actionHtml}
    </div>
  `;
}
