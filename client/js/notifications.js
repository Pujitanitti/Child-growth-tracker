// notifications.js — Fetches notifications and updates the topbar bell badge.
// Individual pages (e.g. dashboard) render the full list; this module owns
// the shared "how many unread" indicator so it stays consistent everywhere.

import { api } from './api.js';
import { timeAgo } from './utils.js';

export async function refreshNotificationBadge() {
  try {
    const res = await api.get('/notifications');
    const unread = res.data.notifications.filter((n) => !n.isRead);
    const badge = document.getElementById('notifBadge');
    if (badge) badge.classList.toggle('hidden', unread.length === 0);
    return res.data.notifications;
  } catch {
    return [];
  }
}

export async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}

export function notificationItemHtml(n) {
  const icons = { vaccination: 'fa-syringe', growth: 'fa-ruler-vertical', appointment: 'fa-calendar-check', medicine: 'fa-pills', system: 'fa-circle-info' };
  return `
    <div class="activity-item ${n.isRead ? '' : 'font-medium'}" data-id="${n._id}">
      <div class="activity-item__icon"><i class="fa-solid ${icons[n.type] || 'fa-bell'}"></i></div>
      <div>
        <div class="activity-item__title">${n.title}</div>
        <div class="activity-item__meta">${n.message} · ${timeAgo(n.createdAt)}</div>
      </div>
    </div>
  `;
}
