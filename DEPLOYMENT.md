# Deployment Guide

## Overview

This is a two-part deployment: a Node/Express API + MongoDB, and a static frontend. They can be deployed to separate services (recommended) or served from the same origin (see "Single-origin option" below).

## 1. Database (MongoDB)

Use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier is enough to start) or a self-managed instance.

1. Create a cluster and a database user.
2. Whitelist your backend host's IP (or `0.0.0.0/0` while testing, then narrow it).
3. Copy the connection string into `MONGO_URI` in your backend environment.

## 2. Backend API

Works on any Node host: Render, Railway, Fly.io, a VPS, AWS/GCP/Azure, etc. Example using a generic Node host:

1. Set environment variables (see `backend/.env.example`):
   - `NODE_ENV=production`
   - `PORT` (often provided by the host automatically)
   - `MONGO_URI`
   - `JWT_SECRET`, `JWT_RESET_SECRET` — generate strong random values, e.g. `openssl rand -hex 32`
   - `CLIENT_URL` — the exact origin your frontend is served from (used for CORS and password-reset links)
   - `SMTP_*` / `EMAIL_FROM` — a real SMTP provider (SendGrid, Mailgun, SES, etc.) for password-reset emails. Without this, the API logs emails to the console instead of sending them — fine for local dev, not for production.
2. Build command: `npm install`
3. Start command: `npm start` (runs `node server.js`)
4. Ensure the `backend/uploads` directory is writable and persistent (or switch `middleware/upload.js` to an object-storage backend like S3 for platforms with ephemeral filesystems — most PaaS hosts wipe local disk on redeploy).
5. Health check endpoint: `GET /api/health`

### Process management (if deploying to a raw VPS)

```bash
npm install -g pm2
cd backend
pm2 start server.js --name growth-tracker-api
pm2 save
pm2 startup   # follow the printed instructions to run pm2 on boot
```

Put Nginx or Caddy in front for TLS termination and to proxy `/api` and `/uploads` to the Node process.

## 3. Frontend

The `client/` folder is fully static — deploy it to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host / CDN / S3+CloudFront bucket.

1. Deploy the contents of `client/` as-is (no build step).
2. Set your host's default document to `client/index.html`.
3. Configure a fallback so unknown routes serve `client/pages/404.html` (most static hosts have a "custom 404" setting).
4. Confirm the API base URL logic in `client/js/api.js` resolves correctly for your production domain — by default it uses `/api` (relative) for any non-localhost host, so putting the frontend and API behind the same domain/reverse-proxy is the simplest setup. If they're on different domains, update `API_BASE_URL` in `api.js` to your API's absolute URL and make sure `CLIENT_URL` on the backend matches your frontend's origin for CORS.

## 4. Single-origin option (simplify CORS entirely)

If you'd rather not manage CORS between two origins, serve the static `client/` folder directly from the Express app:

```js
// near the bottom of backend/app.js, before notFound/errorHandler
app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});
```

With this, one deployment (one Node process) serves everything, and `client/js/api.js`'s relative `/api` base URL works without any CORS configuration.

## 5. Post-deploy checklist

- [ ] `GET /api/health` returns `200`
- [ ] Signup → login → dashboard loads without console errors
- [ ] Password reset email actually arrives (test with a real SMTP provider)
- [ ] File upload (child photo / avatar) persists and is retrievable after a redeploy
- [ ] PDF/CSV report downloads work
- [ ] Dark mode preference persists across reload
- [ ] Run `npm run seed` against a staging DB (never production) if you want demo data for a walkthrough
- [ ] Rotate `JWT_SECRET`/`JWT_RESET_SECRET` from the defaults before going live
