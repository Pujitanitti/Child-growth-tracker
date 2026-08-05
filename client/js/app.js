// app.js — Bootstraps the authenticated app shell (sidebar + topbar + theme +
// session timeout). Each protected page calls initApp('pageKey') once on load.

import { requireAuth } from './auth.js';
import { initTheme } from './theme.js';
import { renderSidebar } from './components/sidebar.js';
import { renderNavbar } from './components/navbar.js';
import { renderBottomNav } from './components/bottomNav.js';
import { initCommandPalette } from './components/commandPalette.js';
import { refreshNotificationBadge } from './notifications.js';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // auto-logout after 30 minutes idle
let idleTimer = null;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    import('./auth.js').then(({ logout }) => logout());
  }, SESSION_TIMEOUT_MS);
}

function initIdleWatcher() {
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((evt) =>
    document.addEventListener(evt, resetIdleTimer, { passive: true })
  );
  resetIdleTimer();
}

function initOfflineDetection() {
  const indicator = document.createElement('div');
  indicator.className = 'toast warning hidden';
  indicator.style.cssText = 'position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:var(--z-toast);';
  indicator.innerHTML = `<i class="fa-solid fa-wifi" aria-hidden="true"></i><div class="toast__message">You're offline. Changes may not be saved.</div>`;
  document.body.appendChild(indicator);

  window.addEventListener('offline', () => indicator.classList.remove('hidden'));
  window.addEventListener('online', () => indicator.classList.add('hidden'));
}

/** IntersectionObserver-driven fade-in for elements marked .scroll-reveal. */
function initScrollReveal() {
  const targets = document.querySelectorAll('.scroll-reveal');
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach((t) => observer.observe(t));
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Non-fatal: the app works fully online without it.
    });
  }
}

/** Adds a Material-style ripple span to a button on click; CSS in animations.css handles the animation. */
function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 550);
  });
}

/**
 * @param {string} pageKey - matches a sidebar nav item key, for active-state highlighting
 * @returns {Promise<object>} the current authenticated user
 */
export async function initApp(pageKey) {
  initTheme();
  const user = await requireAuth();
  if (!user) return null; // requireAuth already redirected

  renderSidebar(pageKey, user);
  renderNavbar(user);
  renderBottomNav(pageKey);
  refreshNotificationBadge();
  initIdleWatcher();
  initOfflineDetection();
  initScrollReveal();
  initServiceWorker();
  initRippleEffect();
  initCommandPalette();

  document.querySelectorAll('.breadcrumbs, main').forEach((el) => el.classList.add('page-transition'));

  return user;
}

/** Simple counter animation used on dashboard stat cards. */
export function animateCounter(el, target, duration = 800) {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
