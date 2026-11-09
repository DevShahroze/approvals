# Development Plan

## Current Status

| Item | Status |
|------|--------|
| Repository | Empty — greenfield |
| Documentation | PROJECT_REQUIREMENTS, ARCHITECTURE, DEVELOPMENT_PLAN, AGENTS |
| Phases 1–9 | **Implemented** — configure `.env.local`, Atlas, Firebase, Claude; deploy worker separately |

## Dependencies & Integrations

### Phase 1 — Core platform

| Dependency | Purpose | Cost |
|------------|---------|------|
| `next` | App + API | Free tier Vercel |
| `react`, `react-dom` | UI | — |
| `tailwindcss`, `@tailwindcss/postcss` | Styling | — |
| `mongoose` | MongoDB ODM | Atlas free M0 |
| `firebase`, `firebase-admin` | Auth + future Storage | Spark free |
| `zod` | Env + API validation | OSS |
| `dotenv` | Local dev | OSS |

Dev/setup: `shadcn` CLI adds `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/*` as needed.

### Phase 2+

- `pdf-parse`, `mammoth` — document parsing
- `@anthropic-ai/sdk` — Claude (Phase 4)
- `playwright` — worker only (Phase 7)
- External cron (cron-job.org) → `/api/cron/*` with `CRON_SECRET`

### External accounts required (owner)

1. MongoDB Atlas cluster + connection string
2. Firebase project (Auth + Storage)
3. Anthropic API key (Phase 4+)
4. Vercel project link (Phase 9)
5. Worker host (Phase 7–9)

No LinkedIn/Indeed scraping without official/permitted APIs — stubs return `not_configured` until credentials supplied.

---

## Phase Checklist

### Phase 1 — Initialization, auth, MongoDB

- [ ] `create-next-app` (JS, App Router, Tailwind, ESLint)
- [ ] shadcn/ui init + base layout (sidebar shell stub)
- [ ] `lib/db/connect.js` + connection cache for serverless
- [ ] Mongoose models: `UserProfile`, `ActivityLog`, `AutomationSettings` (minimal Phase 1 subset)
- [ ] Firebase client + Admin initialization
- [ ] Auth middleware: protect `(dashboard)` routes
- [ ] Login page (Firebase email or Google per config)
- [ ] API: `GET /api/health`, `GET /api/me`, `POST /api/profile/bootstrap`
- [ ] Seed script or bootstrap with **owner-provided** profile fields only
- [ ] `.env.example` (no secrets)
- [ ] README: local run, env vars, Atlas/Firebase setup
- [ ] Manual test: sign in, profile created in MongoDB

**Exit criteria:** App runs locally; authenticated dashboard shell; MongoDB connected; no secrets in repo.

### Phase 2 — Profile & documents

- [ ] Full profile CRUD UI + APIs
- [ ] Firebase Storage upload/download for CVs
- [ ] PDF/DOCX parse pipeline
- [ ] `Document` model + version history

### Phase 3 — Job discovery

- [ ] `Job` model + indexes
- [ ] Provider interface + Greenhouse/Lever/Ashby implementations (API keys optional)
- [x] Dedupe, expiry detection, scheduled via `/api/cron/*` (not worker)
- [ ] Discover Jobs UI

### Phase 4 — Claude + matching

- [ ] `ClaudeClient`, prompts, usage logging
- [ ] Matching engine + `JobMatch` model
- [ ] Recommended Jobs UI

### Phase 5 — Generation

- [ ] Tailored CV/cover letter/answers from verified profile only
- [ ] Export PDF/DOCX

### Phase 6 — Preparation & approvals

- [ ] `Application`, `ApplicationAnswer`, `Approval` models
- [ ] Prepared application review UI
- [ ] Approval invalidation rules

### Phase 7 — Playwright worker

- [ ] Queue processor + adapters (1–2 ATS sites first)
- [ ] Screenshots, `BrowserSession` model
- [ ] Human-intervention states

### Phase 8 — Submit & track

- [ ] Submit-after-approval only
- [ ] Verification + status timeline + stats on Overview

### Phase 9 — Hardening & deploy

- [ ] Security review, rate limits, spend alerts
- [ ] Vercel + worker deploy docs
- [ ] CI lint/build

---

## Phase 1 Implementation Plan (Detailed)

### 1. Project scaffold

- Next.js latest stable, `src` dir optional (use `/app` at root per layout above).
- Strict JS; `"type": "module"` if compatible with Next defaults (follow Next.js template).
- Tailwind v4 or template default.

### 2. Firebase Authentication

- Client: `lib/firebase/client.js` with `initializeApp` from public env.
- Server: `lib/firebase/admin.js` singleton with service account env vars.
- `app/(auth)/login/page.js` — sign-in UI.
- `lib/auth/verify.js` — `verifyIdToken` for API routes.
- `middleware.js` — redirect unauthenticated users from dashboard to `/login`; allow public assets and auth routes.

### 3. MongoDB

- `lib/db/connect.js` — global cache pattern for Mongoose in serverless.
- Models in `lib/db/models/`:
  - **UserProfile**: `firebaseUid`, personal/contact fields (sparse in Phase 1), `timestamps`
  - **ActivityLog**: `type`, `message`, `metadata`, `userId`
  - **AutomationSettings**: `userId`, default matching weights, `minMatchScore`
- Indexes: `firebaseUid` unique on UserProfile.

### 4. Dashboard shell (Phase 1 minimal)

- Route group `(dashboard)` with layout: sidebar nav links (disabled stubs for future pages).
- Overview page: placeholder cards + “signed in as” + profile bootstrap status.

### 5. API routes

- `GET /api/health` — `{ ok, db }`
- `GET /api/me` — verified user + profile
- `POST /api/profile/bootstrap` — create profile if missing; optional seed from env flag `SEED_PROFILE=true` using documented seed fields only

### 6. Configuration

- `.env.example` listing all Phase 1 variables.
- `lib/env.js` — Zod parse at startup for required vars in production.

### 7. Verification

- `npm run dev`
- Fix lint/build errors
- Document manual auth test in README

**Estimated effort:** 1–2 focused sessions.

---

## Post-Phase Ritual (Every Phase)

1. Run application locally.
2. Run lint/build.
3. Fix errors.
4. Quick security check (no leaked keys, routes guarded).
5. Update this checklist and status table.
6. Report completed vs remaining work to owner.
7. **Wait for owner instruction** before next phase.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Serverless + Mongoose cold starts | Connection caching; Atlas IP allowlist `0.0.0.0/0` for Vercel |
| Firebase Admin key multiline in env | `FIREBASE_PRIVATE_KEY` with `\n` escaped |
| Job board ToS | Official APIs only; feature flags per provider |
| Claude cost | Cache + phased rollout; light model for classification |
| Long Playwright on free worker | Time limits; queue backoff; owner notification on stall |

---

## Owner Decision Log

| Date | Decision |
|------|----------|
| 2026-03-23 | Stack: MongoDB Atlas, Next.js JS, Firebase Auth & Storage, Claude, Playwright worker, Vercel |
| 2026-03-23 | Auth.js rejected in favor of Firebase Authentication |
| 2026-03-23 | Single Next.js app; worker separate for Playwright only |
