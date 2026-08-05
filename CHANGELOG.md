# Changelog

All notable changes to this project, in reverse chronological order.

## Round 6c — Bug Fix

- **Fixed:** Tab panel fade-in animation could occasionally get skipped entirely (snapping instantly instead of fading), caused by a browser timing quirk where the "double requestAnimationFrame" trick used to kick off the CSS transition could get batched away. Replaced with a forced synchronous reflow (`offsetHeight` read), which is the more reliable technique for this. See `client/js/components/tabs.js`.

## Round 6b — Bug Fix

- **Fixed:** Misleading "You are offline" message. `client/service-worker.js`'s fallback for failed API requests fired that message whenever a `/api/...` request failed for *any* reason — including simply because the backend server wasn't running — not only when the device was genuinely offline. This sent users troubleshooting their Wi-Fi when the real issue was "the backend process isn't running." Reworded to "Could not reach the server. Make sure the backend is running and try again." and bumped the service worker's cache version so the fix actually takes effect for existing installs.

## Round 6 — Smooth Tab Navigation

Replaced the ad-hoc, instant show/hide tab switching (`client/pages/children.html`'s 10-tab detail view, `client/pages/admin.html`'s 2-tab panel) with a reusable, accessible controller: `client/js/components/tabs.js`.

- **Smooth transitions** — panels crossfade + slide (fade/translate) instead of snapping instantly; a sliding underline indicator glides between active tabs instead of each button's border toggling on/off.
- **No unnecessary re-renders** — each tab's data-loading callback now fires once per "session" (first visit), not on every click back to an already-loaded tab. Explicit refreshes (e.g. after adding a growth record) are unaffected — those still call their loader function directly, same as before.
- **Scroll position memory** — each tab remembers where you'd scrolled to and restores it when you switch back.
- **Full keyboard accessibility** — proper ARIA tabs pattern (`role="tablist"/"tab"/"tabpanel"`, `aria-selected`, roving `tabindex`), Arrow Left/Right/Home/End navigation.
- **Correctness fix for children.html specifically**: since its tab panels are reused across different children (not recreated per child), the controller's cache is explicitly invalidated and the active tab force-refreshed every time a *different* child is opened — otherwise switching from child A to child B while already on, say, the Growth tab would silently keep showing child A's cached data.
- Respects `prefers-reduced-motion` automatically via the existing global rule in `base.css` — no special-casing needed.

## Round 5b — Bug Fix

- **Fixed:** Emergency Card layout bug. `client/pages/emergency-card.html` had its `<main>` content placed as a sibling *after* the `.app-shell` grid closed, instead of nested inside it like every other page. Since `.app-shell` is a full-height CSS grid, this pushed all real page content below an entire extra screen-height of empty space, forcing a scroll before anything appeared. Fixed by nesting `<main>` correctly inside the grid's second column (verified structurally identical across all 8 pages now).

## Round 5 — Audit Pass

Rather than adding more features, this round audited the existing codebase for inconsistencies left behind by earlier rounds.

- **Fixed:** Color system leftovers from the Round 4 palette change (teal → indigo/cyan/violet) that didn't fully propagate: the loading spinner (`client/index.html`), the sibling-comparison chart palette (`client/pages/compare.html`), the PWA theme color (`client/manifest.json`, `favicon.svg`), and — most importantly — **every PDF report and the password-reset email**, which were still branded in the old color.
- **Fixed:** Inconsistent empty states — the Medicines tab, Compare Siblings picker/prompt, and dashboard's "no children" state were still using the older plain icon+text empty state while everything else had been upgraded to illustrated ones. Added a missing `noMedicines` illustration and made usage consistent everywhere.
- **Fixed:** Accessibility gap — the admin panel's pagination prev/next buttons were icon-only with no `aria-label`.
- **Removed:** One dead import left behind by the empty-state cleanup.
- **Confirmed already solid:** no duplicate CSS selector definitions; `prefers-reduced-motion` handling is a single blanket rule that already covers every animation added in later rounds; no `<img>` tags missing `alt` text.

## Round 4 — Premium UI Overhaul

- New color system: indigo/cyan/violet palette (`#4F46E5` / `#06B6D4` / `#8B5CF6`) replacing the original teal, light and dark themes. Wider corner radii (14–24px).
- Command palette — `Ctrl/Cmd+K` to jump to any page or child instantly.
- Drag-and-drop dashboard widgets — reorder the sidebar widgets, order persists via `localStorage`.
- Appointments calendar — month-grid view across all children, click a day for details.
- Micro-interactions — button ripple, card tilt-on-hover, icon bounce, gradient/glow utilities — applied across stat cards, child cards, badge cards, report cards.

## Round 3

- AI Health Insights — rule-based insight cards (growth/sleep/nutrition trends), no external API needed.
- Emergency Card upgrades — QR code, PDF download, native Share.
- Health status badges on the dashboard ("Healthy Growth" / "Needs Attention").
- Mobile bottom navigation bar.
- Illustrated empty states (inline SVG, no external assets).

## Round 2

- Memory Timeline (first steps/words/birthdays/photos).
- Gamification — 5 achievement badges computed live from existing data.
- Emergency Health Card (printable digital ID).
- AI Health Assistant chat widget — optional, requires the user's own `ANTHROPIC_API_KEY`; carefully scoped to avoid diagnosing or recommending medication.

## Round 1

- Appointments scheduler and medicine reminders.
- CSV import for bulk-adding children.
- Client-side photo cropping before upload.
- Sibling growth comparison charts.
- Security fixes: upgraded `multer` 1.x → 2.x, fixed a service-worker staleness bug causing stale-page loads after a dev server restart.

## Initial Release

- Full authentication (signup/login/forgot-reset password/profile/avatar).
- Multi-child management with medical/emergency/doctor details.
- Growth tracking with auto-calculated BMI, percentile, velocity, height prediction, and health score.
- Vaccination schedule (auto-generated), milestone checklist (auto-generated), nutrition and sleep logging.
- Dashboard, PDF/CSV reports, admin panel with analytics and audit log.
