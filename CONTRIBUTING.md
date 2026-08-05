# Contributing to Child Growth Tracker

Thanks for your interest in contributing! This is a hobby/portfolio project, but contributions, bug reports, and suggestions are genuinely welcome.

## Getting Started

1. Fork the repository and clone your fork
2. Follow the setup steps in [README.md](./README.md#-getting-started) to get the backend and frontend running locally
3. Create a branch for your change: `git checkout -b feature/short-description` or `fix/short-description`

## Development Guidelines

- **No framework migrations.** The frontend is intentionally vanilla HTML/CSS/JS with no build step — please don't introduce React, Vue, a bundler, or a CSS framework in a PR. If you want to discuss a bigger architectural change, open an issue first.
- **Match the existing patterns.** Controllers stay thin and delegate validation to `express-validator` chains in `backend/validators/`; frontend feature modules follow the pattern in `client/js/*.js` (a `fetchX`, a render/HTML helper, and an `openXModal` where relevant).
- **One responsibility per file.** Keep new backend routes/controllers/models split the same way the existing ones are (see `backend/models/`, `backend/controllers/`, `backend/routes/`).
- **Comment non-obvious logic**, especially anything involving the growth-percentile math or safety-relevant behavior (e.g. the AI assistant's system prompt, child-safety-adjacent copy).
- **Write tests for new endpoints.** See `backend/tests/` for the existing pattern (Jest + Supertest + an in-memory MongoDB via `mongodb-memory-server`).

## Before Submitting a Pull Request

- [ ] `cd backend && npm test` passes
- [ ] `node --check` (or just loading the page) confirms no syntax errors in any touched file — there's no bundler to catch this for you
- [ ] New/changed endpoints are reflected in [docs/API.md](./docs/API.md)
- [ ] New models are reflected in [docs/DATABASE.md](./docs/DATABASE.md)
- [ ] No secrets, API keys, or `.env` files are included in the diff
- [ ] UI changes are checked in both light and dark mode, and at a mobile viewport width

## Commit Messages

Keep them short and descriptive: `Fix vaccination due-date calculation for leap years`, not `fix bug`. Reference an issue number if applicable (`Fixes #12`).

## Reporting Bugs / Requesting Features

Please use the issue templates — they ask for the information that actually speeds up a fix (repro steps, expected vs. actual behavior, environment). See [SECURITY.md](./SECURITY.md) instead if you're reporting a security vulnerability — don't open a public issue for those.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). Be kind.

## Questions

Open a [discussion or issue](../../issues) — no question is too small.
