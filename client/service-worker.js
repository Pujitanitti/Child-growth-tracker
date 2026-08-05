// service-worker.js — Caches the static app shell so the UI still loads
// (with a friendly offline notice for data) when the network is unavailable.
// Registered from js/app.js on supporting browsers.

const CACHE_NAME = 'growth-tracker-shell-v3';
const SHELL_ASSETS = [
  '/index.html',
  '/pages/login.html',
  '/pages/dashboard.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/utilities.css',
  '/assets/icons/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls (always want fresh data when online);
// network-first for HTML page navigations too — this is the fix for the
// "page won't load after a dev server restart" issue: an HTML page is the
// one thing that must never be served stale, so we only fall back to cache
// if the network genuinely fails (e.g. actually offline).
// Cache-first only for static assets (css/icons), where staleness is harmless.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(event.request).catch(() => new Response(
      // This fallback fires whenever the request to the API fails for ANY
      // reason — including the backend simply not running — not only when
      // the device is genuinely offline. Worded generically on purpose so
      // it doesn't send someone down a Wi-Fi troubleshooting path when the
      // real issue is "the backend server isn't running."
      JSON.stringify({ success: false, message: 'Could not reach the server. Make sure the backend is running and try again.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 503 }
    )));
    return;
  }

  if (event.request.mode === 'navigate' || event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
