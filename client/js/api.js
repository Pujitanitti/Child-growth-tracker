// api.js — Single point of contact with the backend REST API.
// Every other module calls request()/get()/post()/etc. from here instead of
// using fetch() directly, so auth headers, error shapes, and the base URL
// only ever need to be handled in one place.

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

function getToken() {
  return localStorage.getItem('cgt_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('cgt_token', token);
  else localStorage.removeItem('cgt_token');
}

class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors; // field-level validation errors, if any
  }
}

/**
 * Core request function. Automatically attaches the JWT (if present),
 * parses JSON, and throws a normalized ApiError on any non-2xx response.
 * @param {string} path - e.g. '/auth/login'
 * @param {object} options - fetch options; body may be a plain object (auto-stringified) or FormData
 */
async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  const isFormData = body instanceof FormData;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, body });
  } catch (networkErr) {
    throw new ApiError('Unable to reach the server. Check your connection.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    // Auto-logout on an expired/invalid session so stale state doesn't linger.
    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/signup')) {
      setToken(null);
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/pages/login.html?expired=1';
      }
    }
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status, data?.errors || []);
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  /** For endpoints that return a file (PDF/CSV) rather than JSON. */
  async download(path, filename) {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(data?.message || 'Download failed', response.status);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export { ApiError };
