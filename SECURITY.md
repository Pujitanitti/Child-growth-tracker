# Security Policy

## Supported Versions

This is a single-branch portfolio/hobby project — there are no maintained release branches. Security fixes are applied to `main` only.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report it privately:

- Use GitHub's [private vulnerability reporting](../../security/advisories/new) feature on this repository (Security tab → "Report a vulnerability"), **or**
- Open a new issue with minimal detail asking a maintainer to contact you privately, without describing the vulnerability itself

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, screenshots, or proof-of-concept code

You should receive an acknowledgment within a few days. This is a hobby project maintained by one person, so response times aren't guaranteed on a strict SLA, but reports are taken seriously and addressed as soon as practical.

## Scope & Known Considerations

This application handles data about children (names, birth dates, medical conditions, allergies, photos) and should be treated accordingly if deployed beyond local development:

- **This is not a HIPAA-, GDPR-, or COPPA-certified product.** If you deploy this for real use involving real children's health data, you are responsible for evaluating and meeting whatever regulatory obligations apply in your jurisdiction — this codebase does not claim compliance out of the box.
- **The growth-percentile math is a simplified statistical approximation**, not the official WHO/CDC LMS reference tables, and is explicitly not intended for real clinical decisions (see the note in `backend/utils/growthCalculations.js` and the README). This is a data-accuracy consideration, not strictly a security one, but it matters for how this project should and shouldn't be used.
- **The AI Health Assistant** (optional, requires your own Anthropic API key) is scoped via its system prompt to avoid diagnosing or recommending medication — see `backend/controllers/assistantController.js`. Treat any change to that prompt as security/safety-relevant, not just a copy edit.
- Secrets (`JWT_SECRET`, `JWT_RESET_SECRET`, `ANTHROPIC_API_KEY`, SMTP credentials, MongoDB connection strings) belong only in `.env`, which is git-ignored. Never commit real secrets, including in example configs or test fixtures.

## Security Measures Already in Place

- Passwords hashed with bcrypt (cost factor 12)
- JWT-based auth with a separate, shorter-lived secret for password-reset tokens
- `express-mongo-sanitize` to block NoSQL injection via `$`/`.` operators in input
- `express-validator` on every request body/param/query
- `helmet` for standard security headers
- Rate limiting on all API traffic, with a stricter limiter on auth endpoints and the AI assistant
- File upload restrictions by MIME type and size (`multer`)
- Per-resource ownership checks — a parent can only read/write their own children's data; admin role required for cross-user access
