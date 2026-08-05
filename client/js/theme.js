// theme.js — Dark mode: persists to localStorage, syncs to the server profile
// when the user is logged in, and applies before first paint (see the inline
// script in each HTML page's <head>) to avoid a flash of the wrong theme.

import { api } from './api.js';

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cgt_theme', theme);
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  // Best-effort sync; a logged-out user or a network hiccup shouldn't block the toggle.
  api.patch('/auth/me', { theme: next }).catch(() => {});
  return next;
}

export function initTheme() {
  const saved = localStorage.getItem('cgt_theme');
  if (saved) applyTheme(saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
}
