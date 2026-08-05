# API Documentation

Base URL: `http://localhost:5000/api` (local) or your deployed API origin.

All responses follow this envelope:
```json
{ "success": true, "message": "optional", "data": { }, "errors": [] }
```
`errors` is only present on validation failures (HTTP 400), as an array of `{ field, message }`.

Protected endpoints require a header: `Authorization: Bearer <jwt>`. Get a token from `/auth/login` or `/auth/signup`.

---

## Auth

### `POST /auth/signup`
Body: `{ name, email, password }` (password ≥ 8 chars, at least one number)
→ `201` `{ user, token }`

### `POST /auth/login`
Body: `{ email, password }`
→ `200` `{ user, token }`

### `POST /auth/forgot-password`
Body: `{ email }`
→ `200` (always the same response, regardless of whether the email exists, to prevent account enumeration)

### `POST /auth/reset-password`
Body: `{ token, password }` — token comes from the emailed reset link (15 min expiry)
→ `200`

### `GET /auth/me` 🔒
→ `200` `{ user }`

### `PATCH /auth/me` 🔒
Body: any of `{ name, phone, theme }`
→ `200` `{ user }`

### `POST /auth/change-password` 🔒
Body: `{ currentPassword, newPassword }`
→ `200`

### `POST /auth/avatar` 🔒
Multipart form, field `photo` (image, ≤ `MAX_UPLOAD_MB`)
→ `200` `{ user }`

---

## Children

### `GET /children` 🔒
Query: `search`, `gender`, `page`, `limit`
→ `200` `{ children, pagination }`

### `POST /children` 🔒
Body: `{ name, gender, dateOfBirth, bloodGroup?, birthWeightKg?, birthHeightCm?, medicalConditions?, allergies?, emergencyContact?, doctor? }`
→ `201` `{ child }` — also auto-generates the vaccination schedule and milestone checklist for this child.

### `GET /children/:id` 🔒 · `PATCH /children/:id` 🔒 · `DELETE /children/:id` 🔒 (soft delete)

### `POST /children/:id/photo` 🔒
Multipart form, field `photo`
→ `200` `{ child }`

### `POST /children/import` 🔒
Multipart form, field `file` (CSV, columns: `name,gender,dateOfBirth,bloodGroup`)
→ `201`/`400` `{ created: [...], errors: [{ row, message }] }` — bad rows are skipped and reported individually, not fatal to the whole import.

---

## Growth

### `GET /children/:childId/growth` 🔒
→ `200` `{ records }` (sorted by date ascending)

### `POST /children/:childId/growth` 🔒
Body: `{ date?, heightCm, weightKg, headCircumferenceCm?, notes? }`
→ `201` `{ record, heightPercentile, weightPercentile }` — BMI, percentile, and weight status are all server-computed, never trust client-supplied values for these.

### `GET /children/:childId/growth/insights` 🔒
→ `200` `{ heightPercentile, weightPercentile, velocity, prediction, healthScore, alerts }`

### `PATCH /growth/:id` 🔒 · `DELETE /growth/:id` 🔒

---

## Vaccinations

### `GET /children/:childId/vaccinations` 🔒
Query: `status` (`upcoming`/`completed`/`missed`)

### `POST /children/:childId/vaccinations` 🔒
Body: `{ vaccine, doseLabel?, dueDate, notes? }`

### `PATCH /vaccinations/:id/complete` 🔒
Body: `{ completedDate?, administeredBy? }`

### `PATCH /vaccinations/:id` 🔒 · `DELETE /vaccinations/:id` 🔒

---

## Milestones

### `GET /children/:childId/milestones` 🔒 · `POST /children/:childId/milestones` 🔒
### `PATCH /milestones/:id/achieve` 🔒 · `DELETE /milestones/:id` 🔒

---

## Nutrition

### `GET /children/:childId/nutrition?date=YYYY-MM-DD` 🔒
→ `200` `{ log, suggestions }`

### `POST /children/:childId/nutrition/meals` 🔒
Body: `{ name, type, calories?, proteinG?, date? }`

### `PATCH /nutrition/:id/water` 🔒
Body: `{ waterIntakeMl }`

---

## Sleep

### `GET /children/:childId/sleep?limit=30` 🔒 · `POST /children/:childId/sleep` 🔒
### `PATCH /sleep/:id` 🔒 · `DELETE /sleep/:id` 🔒

---

## Appointments

### `GET /children/:childId/appointments?status=` 🔒 · `POST /children/:childId/appointments` 🔒
### `PATCH /appointments/:id` 🔒 · `DELETE /appointments/:id` 🔒

---

## Medicine Reminders

### `GET /children/:childId/medicines?active=true` 🔒 · `POST /children/:childId/medicines` 🔒
### `PATCH /medicines/:id/taken` 🔒 · `PATCH /medicines/:id` 🔒 · `DELETE /medicines/:id` 🔒

---

## Memories

### `GET /children/:childId/memories` 🔒
### `POST /children/:childId/memories` 🔒
Multipart form: `title`, `type?`, `description?`, `date?`, `photo?` (file, optional)
### `DELETE /memories/:id` 🔒

---

## Badges (Gamification)

### `GET /children/:childId/badges` 🔒
→ `200` `{ badges: [{ id, title, description, icon, earned, progress, target }], earnedCount }` — computed live from existing growth/vaccination/milestone/sleep/nutrition data, nothing is separately stored.

---

## Insights

### `GET /children/:childId/insights` 🔒
→ `200` `{ insights: [{ icon, tone, text }] }` — rule-based, no external API call.

---

## AI Assistant *(optional — requires `ANTHROPIC_API_KEY`)*

### `GET /assistant/status` 🔒
→ `200` `{ available: boolean }`

### `POST /children/:childId/assistant/ask` 🔒
Body: `{ message }` (max 1000 chars)
→ `200` `{ reply }` · `503` if not configured. Rate-limited to 15 requests / 5 minutes since each call costs real API tokens.

---

## Reports

### `GET /children/:childId/reports/growth` 🔒 → PDF
### `GET /children/:childId/reports/vaccination` 🔒 → PDF
### `GET /children/:childId/reports/summary` 🔒 → PDF
### `GET /children/:childId/reports/emergency-card` 🔒 → PDF
### `GET /children/:childId/reports/growth.csv` 🔒 → CSV

---

## Dashboard

### `GET /dashboard/summary` 🔒
→ `200` `{ totalChildren, averageGrowthScore, upcomingVaccinations, todaysReminders, recentActivity, childSummaries, upcomingAppointments, activeMedicines }` — one aggregated payload for the whole dashboard, avoiding multiple round trips.

---

## Notifications

### `GET /notifications` 🔒 · `PATCH /notifications/:id/read` 🔒 · `PATCH /notifications/read-all` 🔒

---

## Admin *(role: `admin` only)*

### `GET /admin/users` 🔒
Query: `search`, `role`, `page`, `limit`, `sortBy`, `sortOrder`

### `PATCH /admin/users/:id` 🔒
Body: any of `{ isActive, role }`

### `DELETE /admin/users/:id` 🔒
### `GET /admin/analytics` 🔒
### `GET /admin/audit-logs` 🔒

---

## Health Check

### `GET /health` (unauthenticated)
→ `200` `{ success: true, message: "API is healthy", timestamp }`
