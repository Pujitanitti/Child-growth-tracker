// auth.js — Authentication flows and the session guard used by every
// protected page to redirect unauthenticated visitors to /login.html.

import { api, setToken } from './api.js';

let cachedUser = null;

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  setToken(res.data.token);
  cachedUser = res.data.user;
  return cachedUser;
}

export async function signup(name, email, password) {
  const res = await api.post('/auth/signup', { name, email, password });
  setToken(res.data.token);
  cachedUser = res.data.user;
  return cachedUser;
}

export async function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token, password) {
  return api.post('/auth/reset-password', { token, password });
}

export function logout() {
  setToken(null);
  cachedUser = null;
  window.location.href = '/pages/login.html';
}

/** Fetches (and caches for this page load) the current user's profile. */
export async function getCurrentUser({ force = false } = {}) {
  if (cachedUser && !force) return cachedUser;
  const res = await api.get('/auth/me');
  cachedUser = res.data.user;
  return cachedUser;
}

/**
 * Call at the top of every protected page. Redirects to login if there's no
 * token, and again if the token turns out to be invalid/expired.
 * Returns the current user on success (pages can await this before rendering).
 */
export async function requireAuth() {
  const token = localStorage.getItem('cgt_token');
  if (!token) {
    window.location.href = '/pages/login.html';
    return null;
  }
  try {
    return await getCurrentUser();
  } catch {
    window.location.href = '/pages/login.html';
    return null;
  }
}

/** Call at the top of login/signup pages to bounce already-logged-in users to the dashboard. */
export async function redirectIfAuthenticated() {
  const token = localStorage.getItem('cgt_token');
  if (!token) return;
  try {
    await getCurrentUser();
    window.location.href = '/pages/dashboard.html';
  } catch {
    setToken(null);
  }
}
