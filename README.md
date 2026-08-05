# 🌱 Child Growth Tracker

A full-stack web application for parents to track their child's growth, vaccinations, developmental milestones, nutrition, sleep, and more — with an interactive dashboard, PDF/CSV reports, gamified achievements, and an admin panel.

Built with a vanilla HTML/CSS/JavaScript frontend (no build step, no framework) and a Node.js/Express/MongoDB backend.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![CI](https://github.com/OWNER/child-growth-tracker/actions/workflows/ci.yml/badge.svg)

---

## ✨ Features

**Accounts** — signup/login, forgot/reset password, profile editing, avatar upload with photo cropping, dark mode, session auto-timeout.

**Multi-Child Management** — add/edit multiple children with photo, DOB, blood group, allergies, medical conditions, emergency contact, and doctor info. Search, and bulk-import via CSV.

**Growth Tracking** — log height/weight/head circumference over time with auto-calculated BMI, percentile, growth velocity, a 6-month height prediction, and a 0–100 growth score. Interactive Chart.js visualizations. Automatic alerts for unusual measurements. Sibling growth comparison.

**Vaccinations & Milestones** — auto-generated vaccination schedule and developmental milestone checklist per child, with completion tracking.

**Nutrition & Sleep** — meal and water intake logging with daily suggestions; sleep duration, naps, and quality history.

**Appointments & Medicines** — schedule doctor visits with a calendar view; track ongoing medication reminders.

**Memory Timeline** — log first steps, first words, birthdays, and photos as a chronological story.

**Gamification** — achievement badges computed live from real tracking data (no separate bookkeeping to drift out of sync).

**AI Features** *(optional)* — rule-based health insight cards work out of the box; an AI chat assistant is available if you add your own Anthropic API key, carefully scoped to avoid diagnosing or recommending treatment.

**Emergency Health Card** — a printable/shareable digital ID with QR code, blood group, allergies, and emergency contacts.

**Reports** — downloadable PDF (growth/vaccination/summary/emergency card) and CSV exports.

**Admin Panel** — user management, platform analytics, audit log.

**Polish** — command palette (`Ctrl/Cmd+K`), drag-and-drop dashboard widgets, mobile bottom navigation, dark mode, illustrated empty states, skeleton loading, and animated micro-interactions throughout.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES6 modules), Chart.js, Font Awesome |
| Backend | Node.js, Express.js, MongoDB + Mongoose |
| Auth & Security | JWT, bcrypt, Helmet, express-rate-limit, express-mongo-sanitize, express-validator |
| File Handling | Multer (uploads), PDFKit (PDF reports), json2csv / csv-parse (CSV export & import) |
| Optional | Anthropic API (AI chat assistant), Nodemailer (password reset email) |

---

---

## 🏗️ Architecture

High-level system diagrams, request-flow walkthrough, and the reasoning behind key design decisions (why no framework, how data integrity is enforced, how ownership checks work) live in **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

## 📁 Project Structure

```
child-growth-tracker/
├── client/                  # Static frontend — no build step
│   ├── css/                 # variables, base, layout, components, forms, tables,
│   │                        # animations, themes, responsive, utilities + css/pages/*
│   ├── js/
│   │   ├── api.js, auth.js, app.js, charts.js, dashboard.js, children.js,
│   │   │   growth.js, vaccination.js, nutrition.js, sleep.js, appointments.js,
│   │   │   medicines.js, memories.js, badges.js, insights.js, assistant.js,
│   │   │   reports.js, profile.js, theme.js, notifications.js, validators.js, utils.js
│   │   └── components/      # navbar, sidebar, bottomNav, modal, toast, loader,
│   │                        # commandPalette, dragReorder, imageCrop
│   ├── pages/                # login, signup, dashboard, children, compare,
│   │                         # appointments-calendar, reports, profile, admin,
│   │                         # emergency-card, 404
│   ├── assets/, manifest.json, service-worker.js
│   └── index.html
├── backend/
│   ├── server.js, app.js
│   ├── config/               # db.js, constants.js
│   ├── models/                # User, Child, GrowthRecord, Vaccination, Milestone,
│   │                         # NutritionLog, SleepLog, Appointment, MedicineReminder,
│   │                         # Memory, Notification, AuditLog
│   ├── controllers/, routes/, middleware/, validators/, utils/
│   ├── uploads/               # multer file storage (gitignored)
│   └── tests/                 # Jest + Supertest, in-memory MongoDB
└── sample-data/
    └── sample-dataset.json
```

---

## 🚀 Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env     # then edit MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev               # starts on http://localhost:5000
```

Requires a running MongoDB instance — local `mongod`, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works fine).

Populate demo data:
```bash
npm run seed
# Admin login:  admin@growthtracker.app / Admin@1234
# Parent login: parent@growthtracker.app / Parent@1234
```

Run tests:
```bash
npm test
```

### 2. Frontend

Fully static, no build step:
```bash
cd client
npx serve . -l 5500
```

Open `http://localhost:5500`. It talks to the API at `http://localhost:5000/api` when running locally; set `CLIENT_URL` in the backend `.env` to your frontend origin for CORS.

### 3. Optional: AI Chat Assistant

Add your own key to `backend/.env`:
```
ANTHROPIC_API_KEY=your-key-here
```
Get one at [console.anthropic.com](https://console.anthropic.com). Without it, the app works normally — the chat widget simply doesn't appear.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for production deployment steps.

---

## 📡 API Overview

Full endpoint-by-endpoint reference with request/response shapes: **[docs/API.md](./docs/API.md)**. Database schema documentation (all 11 models, relationships, indexes): **[docs/DATABASE.md](./docs/DATABASE.md)**.

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`. Every response follows `{ success, message?, data?, errors? }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET/PATCH /auth/me`, `POST /auth/change-password`, `POST /auth/avatar` |
| Children | `GET/POST /children`, `GET/PATCH/DELETE /children/:id`, `POST /children/:id/photo`, `POST /children/import` |
| Growth | `GET/POST /children/:childId/growth`, `GET /children/:childId/growth/insights`, `PATCH/DELETE /growth/:id` |
| Vaccinations | `GET/POST /children/:childId/vaccinations`, `PATCH /vaccinations/:id/complete`, `PATCH/DELETE /vaccinations/:id` |
| Milestones | `GET/POST /children/:childId/milestones`, `PATCH /milestones/:id/achieve`, `DELETE /milestones/:id` |
| Nutrition | `GET /children/:childId/nutrition`, `POST /children/:childId/nutrition/meals`, `PATCH /nutrition/:id/water` |
| Sleep | `GET/POST /children/:childId/sleep`, `PATCH/DELETE /sleep/:id` |
| Appointments | `GET/POST /children/:childId/appointments`, `PATCH/DELETE /appointments/:id` |
| Medicines | `GET/POST /children/:childId/medicines`, `PATCH /medicines/:id`, `PATCH /medicines/:id/taken`, `DELETE /medicines/:id` |
| Memories | `GET/POST /children/:childId/memories`, `DELETE /memories/:id` |
| Badges | `GET /children/:childId/badges` |
| Insights | `GET /children/:childId/insights` |
| AI Assistant | `GET /assistant/status`, `POST /children/:childId/assistant/ask` |
| Reports | `GET /children/:childId/reports/{growth,vaccination,summary,emergency-card}` (PDF), `GET /children/:childId/reports/growth.csv` |
| Dashboard | `GET /dashboard/summary` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Admin (role=admin) | `GET/PATCH/DELETE /admin/users`, `GET /admin/analytics`, `GET /admin/audit-logs` |

---

## ⚠️ Notes on the Growth Math

`backend/utils/growthCalculations.js` estimates height/weight percentiles using a simplified statistical model (a normal-distribution approximation around illustrative age-based reference points) — **not** the official WHO/CDC LMS growth-chart tables, and it's commented as such in the source. Swap in the real LMS dataset before using this for actual clinical decisions. The same applies to the future-height prediction, which is a simple linear trend estimate, not a medical forecast. The rule-based health insights and AI chat assistant are similarly scoped: general, non-diagnostic information only.

## 🔒 Security Notes

- Passwords hashed with bcrypt (cost factor 12); JWTs signed with a secret you set in `.env`
- `express-mongo-sanitize` strips `$`/`.` operators from input to prevent NoSQL injection
- `express-validator` validates every request body/param/query
- Stricter rate limiting on auth and AI assistant endpoints; general rate limiting elsewhere
- File uploads restricted by type (images/CSV only) and size
- Ownership checks on every child-scoped resource — a parent can only access their own children's data; admins can access all

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Please follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🔐 Reporting a Security Issue

Please don't open a public issue for security vulnerabilities — see [SECURITY.md](./SECURITY.md) for how to report privately.

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

## 📓 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full development history.

---

## 🚢 Publishing to GitHub

1. **Create the repository** on GitHub (github.com → "+" → New repository). Name it `child-growth-tracker`, leave it empty (no README/license/gitignore — this project already has all three), and copy the URL it gives you.

2. **Replace the `OWNER` placeholder.** A few files reference `github.com/OWNER/child-growth-tracker` as a placeholder — find-and-replace `OWNER` with your actual GitHub username in:
   - `README.md` (the CI badge near the top)
   - `package.json` (`homepage`, `bugs.url`, `repository.url`)
   - `.github/ISSUE_TEMPLATE/config.yml`

3. **Push it up**, from the project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/child-growth-tracker.git
   git push -u origin main
   ```

4. **Double-check `.env` didn't get committed.** Run `git status` before your first commit and confirm `backend/.env` is *not* listed (it's git-ignored, but worth a sanity check since it holds your database credentials).

5. **On GitHub**, go to the repo's **Settings → General** and add a description + topics (e.g. `nodejs`, `express`, `mongodb`, `healthcare`, `javascript`) so it's discoverable. The CI workflow in `.github/workflows/ci.yml` will run automatically on your first push and on every future PR.


