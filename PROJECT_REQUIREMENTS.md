# Project Requirements — AI-Powered Job Application Automation Platform

## Purpose

Personal job-search and application automation platform (not commercial SaaS) that discovers jobs worldwide, scores fit against a verified professional profile, generates documents with Claude, prepares applications, requires explicit per-job approval before submission, and tracks outcomes.

## Technology Stack (Authoritative)

| Layer | Choice | Notes |
|-------|--------|--------|
| Frontend & API | Next.js (latest stable), JavaScript ES modules | Single monolith project |
| UI | Tailwind CSS + shadcn/ui | Dashboard-first |
| Database | MongoDB Atlas + Mongoose | Indexes, pagination |
| Authentication | Firebase Authentication | No Auth.js |
| File storage | Firebase Storage | CVs, cover letters, exports |
| AI | Anthropic Claude API | Server-only, configurable model |
| Browser automation | Playwright | Separate Node.js worker only |
| Scheduled tasks | Free external cron (e.g. cron-job.org) → Next.js `/api/cron/*` | Discovery, expire checks |
| Browser queue | Node.js Playwright worker | Prepare/submit only (not scheduling) |
| Deployment | Vercel (Next.js); free/low-cost host for worker | Env-based secrets |

Constraints:

- JavaScript only unless TypeScript is explicitly requested.
- Prefer free-tier and open-source; no paid third-party services without owner approval.
- All credentials via environment variables; never commit secrets.
- Frontend and backend in one Next.js app; worker only where Playwright requires isolation.

## Functional Modules

1. **Dashboard** — Overview, discover, recommendations, details, approvals, applications, CV, profile, agent activity, browser sessions, settings.
2. **Authentication & authorization** — Firebase Auth; server-side session/token verification; single-user personal app with strict server routes.
3. **Professional profile** — Editable, verified source of truth (no invented data in outputs).
4. **Job discovery** — Provider-based: Greenhouse, Lever, Ashby, LinkedIn/Indeed/Glassdoor (permitted APIs only), Wellfound, career pages; worldwide; remote/hybrid/onsite; dedupe; expiry; scheduled runs.
5. **Job matching** — Weighted score 0–100; explain fit, gaps, eligibility issues; configurable minimum score.
6. **Claude services** — Analysis, matching assist, CV/cover letter/answers, requirement extraction; JSON schemas, retries, rate limits, token/cost tracking, prompt versions.
7. **Documents** — Upload/parse PDF/DOCX; master CV; job-specific versions; export; version history; traceability to profile.
8. **Application preparation** — Answers, form payloads; no submit without approval.
9. **Approval** — Bound to job ID, document versions, answers, payload; invalidate on change; no auto-approve or auto-submit.
10. **Playwright worker** — Site adapters; fill/upload/screenshots; pause on CAPTCHA/MFA/ambiguous flows.
11. **Tracking** — Status, submission verification, interviews, rejections, success rate.
12. **Logging & monitoring** — ActivityLog, audit trail, API spend visibility.

## Initial Profile Data (Seed Only — Editable by Owner)

- ~7 years software engineering; Principal Software Engineer at Ethizo.
- BSCS GCU Lahore; MCS FAST Lahore.
- JavaScript, TypeScript, React, Redux, Angular, PHP, CakePHP; healthcare SaaS; full-stack and architecture.
- Published research: COVID-19 diagnosis using chest X-ray and CT images.

Do not invent additional employment, skills, or achievements beyond verified profile data.

## Matching Weights (Initial)

| Factor | Weight |
|--------|--------|
| Technical skills | 30% |
| Experience | 25% |
| Seniority | 15% |
| Responsibilities | 15% |
| Location & work arrangement | 10% |
| Education | 5% |

## Mandatory Approval Workflow

1. Discover → evaluate → generate documents → prepare answers.
2. Fill form where permitted (worker); save prepared application.
3. Display full application for review → wait for explicit approval.
4. Submit only approved payload → verify → update status.
5. Prevent duplicate submissions.

## MongoDB Models

`UserProfile`, `Experience`, `Education`, `Skill`, `Document`, `Job`, `JobMatch`, `Application`, `ApplicationAnswer`, `Approval`, `BrowserSession`, `ActivityLog`, `AutomationSettings`, `CronExecution`, `WorkerJob` — with references, validation, indexes, timestamps, pagination.

## Security

Firebase-secured routes, input validation, API rate limiting, safe uploads, encrypted sensitive fields where needed, audit logs, server-only Claude and worker credentials.

## Cost Optimization

Cache job descriptions and analyses; tier models (lighter for classification, stronger for generation); minimize Playwright sessions; batch discovery; monitor Claude usage in DB/logs.

## Development Phases

| Phase | Scope |
|-------|--------|
| 1 | Init, architecture, Firebase Auth, MongoDB |
| 2 | Profile and document management |
| 3 | Job discovery integrations |
| 4 | Claude + matching engine |
| 5 | CV, cover letters, application answers |
| 6 | Application preparation and approval UI |
| 7 | Playwright worker |
| 8 | Verification, tracking, notifications |
| 9 | Security hardening, optimization, deployment |

One phase per release; run app and fix errors before next phase; owner approval required to proceed.

## Quality Bar

Production-quality JS, clean modules, responsive UI, no mock-as-real features, no fabricated submissions, no automatic job submissions.
