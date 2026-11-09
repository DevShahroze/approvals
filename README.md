# Job Approvals — AI Application Automation Hub

Personal platform for job discovery, matching, document generation, **mandatory approval**, and Playwright-assisted submission.

## Stack

- Next.js (JavaScript), Tailwind, shadcn-style UI
- MongoDB Atlas + Mongoose
- Firebase Authentication + Storage
- Anthropic Claude API (server-side)
- Playwright worker (`worker/`)

## Quick start (local dev without Firebase)

1. Copy env: `cp .env.example .env.local`
2. Set `MONGODB_URI` and `DEV_BYPASS_AUTH=true`, `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`
3. Install: `npm install && cd worker && npm install`
4. Run app: `npm run dev`
5. Open http://localhost:3000/login → **Continue as dev user**
6. Optional worker: `npm run worker` (requires Playwright: `cd worker && npx playwright install chromium`)

## Production setup

1. Create MongoDB Atlas cluster and allow Vercel IPs (or `0.0.0.0/0` for personal use).
2. Firebase: enable Email/Google sign-in, create service account, enable Storage.
3. Add all variables from `.env.example` to Vercel.
4. Deploy Next.js on Vercel.
5. Run worker on free-tier host (Render/Railway/Fly) with same `MONGODB_URI` and `WORKER_API_SECRET`.
6. Configure [cron-job.org](https://cron-job.org) (free) to POST to your cron endpoints (see below).

## Scheduled tasks (cron-job.org)

Set `CRON_SECRET` in Vercel. In **Settings**, choose discovery/expiry schedule (`off`, `hourly`, `daily`).

| cron-job.org schedule | URL |
|----------------------|-----|
| Daily | `POST /api/cron/discovery?schedule=daily` |
| Hourly | `POST /api/cron/discovery?schedule=hourly` |
| Daily | `POST /api/cron/expire-jobs?schedule=daily` |

Headers: `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret`).

Execution history: `GET /api/cron/executions` (authenticated) or MongoDB `CronExecution` collection. Overlapping runs return HTTP 409.

The Playwright worker does **not** run scheduled discovery.

## Approval workflow

Applications move to `awaiting_approval` after preparation. Submit jobs run only when:

- `Approval.status === approved`
- `boundPayloadHash === application.payloadHash`
- No duplicate submission for the same job

## Documentation

- `PROJECT_REQUIREMENTS.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT_PLAN.md`
- `AGENTS.md`
