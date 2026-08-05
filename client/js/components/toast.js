// toast.js — Toast notification system. Call showToast() from anywhere.

const ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

function getContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {{title?: string, duration?: number}} opts
 */
export function showToast(message, type = 'info', opts = {}) {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type} animate-slide-in-right`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <i class="fa-solid ${ICONS[type] || ICONS.info} toast__icon" aria-hidden="true"></i>
    <div>
      ${opts.title ? `<div class="toast__title">${opts.title}</div>` : ''}
      <div class="toast__message"></div>
    </div>
    <button class="toast__close" aria-label="Dismiss notification"><i class="fa-solid fa-xmark"></i></button>
  `;
  toast.querySelector('.toast__message').textContent = message; // textContent avoids injection

  const remove = () => {
    toast.style.animation = 'fade-in var(--duration-fast) reverse';
    setTimeout(() => toast.remove(), 140);
  };

  toast.querySelector('.toast__close').addEventListener('click', remove);
  container.appendChild(toast);

  const duration = opts.duration ?? 4500;
  if (duration > 0) setTimeout(remove, duration);

  return { remove };
}
