# AGENTS.md — Persistent Development Rules

## Project Context

Personal AI job application platform. **Never submit an application without explicit owner approval for that specific job.** Never invent profile data in generated content.

## Stack (Do Not Diverge Without Owner Approval)

- Next.js (JavaScript), Tailwind, shadcn/ui
- MongoDB Atlas + Mongoose
- Firebase Authentication + Firebase Storage
- Anthropic Claude API (server-only)
- Playwright in `worker/` only (no scheduling in worker)
- Scheduled discovery/expiry via `/api/cron/*` + free external cron (cron-job.org); `CRON_SECRET` required
- Vercel + separate worker host

No TypeScript unless owner requests. No Auth.js.

## Phase Discipline

- Implement **one phase at a time** per DEVELOPMENT_PLAN.md.
- After each phase: run app, fix errors, update DEVELOPMENT_PLAN checklist, report to owner, **stop** until owner says continue.
- Do not skip ahead (e.g. no Playwright in Phase 1).

## Architecture Rules

- Business logic in `lib/`, not in React components.
- API routes thin; call services in `lib/`.
- Claude and Firebase Admin only on server.
- Browser automation only in `worker/`.
- Job discovery via provider registry; no CAPTCHA bypass or credential scraping.

## Approval System (Non-Negotiable)

- Approval binds: job ID, document versions, answers, form payload hash.
- Invalidate approval when any bound artifact changes.
- Worker `submit` step must re-validate Approval in DB before click.
- No cron or agent may auto-approve.

## Data Integrity

- Generated CVs/cover letters/answers trace to `UserProfile` and verified `Document` records.
- Matching scores use real profile fields; Claude may explain but not inflate qualifications.
- Store original job descriptions and source URLs.

## Security

- No secrets in git; use `.env.example` only.
- Verify Firebase token on protected APIs.
- Validate inputs with Zod.
- Sanitize HTML from job postings.

## Cost

- Cache AI and job description analyses.
- Use env-configured models; cheaper model for simple tasks.
- Log token usage to ActivityLog or dedicated usage fields.

## Code Style

- ES modules, consistent naming, minimal dependencies.
- No mock APIs presented as live integrations — return clear `not_configured` or empty states.
- Match existing patterns when editing files.

## Documentation

- Keep PROJECT_REQUIREMENTS.md, ARCHITECTURE.md, DEVELOPMENT_PLAN.md in sync when stack or scope changes.
- README: setup for Atlas, Firebase, local dev.

## Git

- Do not commit unless owner asks.
- Do not push unless owner asks.

## Testing

- Add tests when owner requests or when phase exit criteria require.
- Phase 1: manual auth + health check sufficient.

## Owner Profile Seed

Use only documented seed fields for initial bootstrap; owner edits profile in UI afterward.
