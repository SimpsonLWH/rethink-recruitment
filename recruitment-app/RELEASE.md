# Release checklist — Rivet pre-screen

This is the honest shipping state for the interviewer pre-screen work. It is not a deployment claim.

## Current repository state

- Work is on `feat/assessment-platform-expansion`.
- `main` is behind this branch by more than a dozen commits. Run `git log main..HEAD` in the checkout for the exact range.
- The Vercel deployment at <https://rethink-recruitment.vercel.app> has **not** been shown to run this pre-screen pass.
- No Vercel CLI session or deployment token was used in this checkout. `recruitment-app/.vercel` is absent.
- Do not describe the live demo as pre-screen-capable until the checklist below passes against the deployed URL.

## What is verified locally

- `npm run seed`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- `npm run smoke` against the production build.
- `npm run audit:a11y` at 1440px, 768px and 390px.
- `npm run screenshots` against a seeded demo.
- Internal link crawl: 92 internal links, 0 failures.

## Ship steps

1. **Review the branch diff and the CI result.** The workflow runs tests, typecheck, lint and the production build. At minimum, review the schema change (`ScreeningRun`, `ScreeningEvent`, `Account.displayName`, plan version fields), the screening API routes and the seed changes.
2. **Get owner approval to merge.** This repository belongs to the event team; do not merge to `main` or push a deployment without the owner's say-so.
3. **Merge into `main`.** Open a pull request from `feat/assessment-platform-expansion` or fast-forward `main` if the team prefers. Keep the merge commit so the release is traceable.
4. **Push `main`.** Vercel should build the repository with Root Directory `recruitment-app` and framework preset Next.js.
5. **Wait for the build.** `npm run build` runs `prisma generate`, then `prisma db push` and the synthetic seed, then `next build`.
6. **Verify the deployment.**
   - `GET /api/health` returns `{"ok":true,...}`.
   - `/enter` shows the pre-screen sample account and the second reviewer account.
   - `/prescreen` lists the Northwind role queues and recent decisions.
   - Open the Aino packet: work-sample breakdown, claims, decision panel and conversation kit render.
   - Record a test decision on a temporary/seeded record, then reseed locally; do not use a real person.
   - `/prescreen/decisions` shows the decision log, CSV export and per-record JSON export.
   - `/profile/evidence` renders for the sample candidate.
   - Export a record and confirm it downloads JSON.
7. **Check the deployment caveat.** The SQLite file is copied to `/tmp` per serverless instance. Writes can reset on a cold start. Use the sample accounts for a reliable demo. A production deployment needs a persistent database, real auth and rate limits.
8. **Record the result.** Add the deployed commit, time, viewport and checks to `HANDOFF.md`. Do not claim a live model run; no NVIDIA key is used.

## Rollback

- Revert the merge on `main` and push. Vercel will rebuild the previous commit.
- The synthetic seed can be regenerated with `npm run seed` locally.
- No production data migration exists; the database is a demo SQLite file.

## What not to claim

- Legal compliance, assessment validation, bias elimination or secure proctoring.
- Live Nemotron output; the advisory reading still runs in deterministic demo mode without a key.
- Real authentication, persistent production storage or multi-tenant permissions. The two reviewers are identity attribution, not an authorisation model.
