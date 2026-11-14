# Rivet — evidence first, then decide

A two-sided matchmaking prototype for **Junction 2026 · City of Espoo "Rethinking Recruitment"**. Rivet now opens as a usable product with **separate candidate and hiring flows**, temporary accounts, sample logins, CV onboarding for candidates, and assessment requirements that recruiters set before browsing.

**Everything in this demo is synthetic.** There are no real people, employers, assessments, evidence, messages or contact details. The coding problems are illustrative and not validated. Nothing here is a claim of legal compliance or production readiness.

## Quick start — no keys

Requirements: **Node 20.9+** and npm. No API keys, database server, Docker or account are needed.

    cd recruitment-app
    npm install
    npm run seed
    npm run dev

Open <http://localhost:3000/enter>.

The seed creates two sample accounts:

| Side | Email | Password |
| --- | --- | --- |
| Candidate | `aino@demo.rivet` | `demo-candidate` |
| Hiring team | `mikko@northwind.demo` | `demo-recruiter` |

Use the sample buttons or sign in with those credentials. You can also create a temporary account; no email is sent.

## The two flows

### Candidate

1. **Sign in or create an account.** Choose the candidate side.
2. **Upload a CV or choose a sample profile.** The CV is stored as onboarding context only in this demo; it is not screened automatically. The sample profile copies structured evidence.
3. **Land on the candidate dashboard.** The dashboard shows CV status, profile completeness, assessment results, invitations, matches and updates.
4. **Browse roles or take an online assessment.** Every role card shows the exact assessment and bar it asks for. The assessment is a short set of JavaScript coding problems. One attempt per cycle, marked against hidden tests; a below-bar result stays visible in a secondary view.
5. **Use Like or one Priority intro.** Both sides must say yes for a match.
6. **Respond to discovery invitations.** Accepting records interest, not a match. A separate recruiter yes is still needed.
7. **See honest outcomes.** A pass never claims a review that did not happen. A closed match uses after-conversation wording.

### Hiring team

1. **Sign in or create an account.** Choose the hiring side.
2. **Set the bar before browsing.** Create a role card with one to three exact assessment requirements, each with its own required score, plus up to four structured signals.
3. **Land on the hiring dashboard.** See configured roles, stated requirements, outreach and matches.
4. **Review the mixed feed.** Cards show assessment evidence, signal evidence, and the employer's own bar. Below-bar and no-evidence candidates stay visible.
5. **Use the discovery lane.** Invite opted-in candidates who have not swiped; the invitation is a message only.
6. **Move matches through a lightweight stage list.** Closing sends an honest outcome.

## Product rules

| Rule | Implementation |
| --- | --- |
| **Separate flows** | Candidate and hiring accounts share authentication but get different onboarding, dashboards and navigation. |
| **Temporary auth** | Demo-only email/password accounts with scrypt hashes. No email verification, reset or rate limit. Sample accounts sign in without creation. |
| **CV onboarding** | Candidates upload a CV or choose a synthetic sample. The demo stores file metadata only; there is no automated CV screening. |
| **Online assessments, not CVs** | Four playable coding assessments and seven problems, server-side marking against hidden tests, exact family/version/difficulty. Six catalogue-only entries stay clearly labelled. |
| **One attempt, final** | One sitting per candidate per assessment per recruiting cycle. No retake, no cooldown and no second submission. The database unique key enforces the rule. |
| **Recruiter need capture** | One to three exact assessment requirements per role, each with its own 0–100 score, plus structured signals. |
| **No ranking** | No percentile, match percentage, or universal person score. Cards are not sorted by score. |
| **Below-bar visibility** | Candidates below any stated bar stay in a visible secondary view with evidence and a named review owner. |
| **Mutual match** | A match needs two explicit yeses. An invitation, accepted invitation, Like or Priority intro alone does not create one. |
| **Limited interest** | 5 Likes per candidate, 10 per employer, one Priority intro per side. Responses/acceptances do not consume Likes. |
| **Keyboard use** | On either feed, use Left arrow to pass, Right arrow to like, and P for a Priority intro. Keyboard actions open a confirmation before they are saved. The decision bar stays fixed on screen. |
| **Evidence state** | A compact badge shows green for met, amber for an assessment not taken, and rose for a score below the stated bar. Hover or tap it for the exact assessment versions, scores and links. |
| **Discovery opt-in** | Off by default for new accounts; seeded sample candidates opt in. Turning it off hides both discovery surfaces and withdraws pending invitations. |
| **Honest outcomes** | State-derived wording. "After your conversation" only for a closed match. |
| **Synthetic data** | 13 candidates, 8 employers, 15 roles, 10 assessment catalogue entries (4 playable, 7 problems), 2 sample accounts. |

## Seed data

- 13 candidates, 8 employers, 15 roles.
- 10 assessment catalogue entries: 4 playable with seven coding problems, 6 clearly labelled catalogue-only.
- 6 live role cards, 9 draft roles.
- 9 assessment attempts. Each candidate has at most one sitting per assessment; the fixtures record final scores, not retakes.
- 5 matches at different stages; 3 invitations; 1 outcome; 2 Priority intros.
- 2 sample accounts.
- 195 local deterministic fit briefs from the earlier prototype remain as secondary context.

## Vercel deployment

The demo is deployed at <https://rethink-recruitment.vercel.app>. The app uses a **build-seeded SQLite database** so it can run without a hosted database or environment variables:

- `npm run build` runs `db:build` (schema push + synthetic seed) before `next build`.
- `next.config.ts` includes `prisma/dev.db` in the server file trace.
- On Vercel, `src/lib/prisma.ts` copies the seeded database to `/tmp/rivet-demo.db` on first use.
- Writes are per serverless instance and may reset across cold starts. The seeded sample accounts are always present; for a reliable demo, use the sample logins. A production deployment should use a hosted Postgres/libSQL database and persistent object storage instead.
- The OA start flow keeps the returned attempt in client state and renders it without navigating to a DB-backed attempt page. Submission can recreate a missing attempt row from the assessment id. This avoids the old start-then-404 failure when two serverless instances disagreed, but completed evidence remains per instance. Use the local demo for reliable one-account scoring.
- `/api/health` verifies that the seeded database is readable.

If the deployment shows a server error, check the Vercel function logs and confirm the build trace contains `prisma/dev.db`. The most common cause is building without the seed step or a Vercel Root Directory that is not `recruitment-app`. Direct attempt links can still land on an instance that did not create the attempt; the app now shows a recovery page instead of a 404.

## Verification

Run from `recruitment-app/`:

    npm run seed
    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run dev          # separate terminal
    RIVET_BASE_URL=http://localhost:3000 npm run smoke
    RIVET_BASE_URL=http://localhost:3000 npm run screenshots
    npm run seed         # leave a clean demo

Current local results:

- Unit tests: **117 passed** across 18 files.
- Typecheck: clean.
- ESLint: clean.
- Production build: passed.
- Browser smoke: passed (sample logins, candidate signup + CV sample, recruiter signup + multi-OA role, dashboards, in-place OA runner with public examples and final submission, one-and-done enforcement, result reload, security headers, missing-attempt recovery, profile, mixed feed, Like/Priority caps, invitation acceptance, outcomes, role-card form, discovery lane, match stage).
- Screenshots: **22 screens** captured: 19 desktop and 3 mobile.
- Deployed check: **passed** on `dba4702`. The live Vercel build serves the new OA catalogue, starts the runner in place, submits and marks a 100/100 sitting, returns `/api/health` ok and sends the explicit Permissions-Policy header.
- One warning remains: the tall employer review card can push its decision bar past the first 1000px view.

No live AI call is required or claimed. The optional AI/tailoring surfaces remain secondary and are not used for assessment scoring, matching, thresholds or outcomes.

## Architecture

    src/app/                     landing, enter, signup, onboarding, dashboard, discover, discovery,
                                 assessments, roles, invitations, updates, matches, priority-intros,
                                 profile, how-it-works
    src/app/actions/             demo auth, session, CV onboarding, tailoring/session actions
    src/app/api/                 decisions, assessments, invitations, roles, profile, matches, messages,
                                 evidence, feed, optional AI routes
    src/components/              account/onboarding panels, dashboards, assessment runner, feeds,
                                 role-card form, invitations, discovery lane, review/evidence, matches
    src/lib/                     auth hashing, OA problem rules and server marking, feed composition, matching, outcomes,
                                 stages, role-card templates, profile completeness, repository boundary
    prisma/                      SQLite schema, synthetic seed data and seed assertions
    scripts/                     smoke, screenshots, AI fallback audit, fit helpers
    audit/                       deterministic fallback evidence; future redacted live-capture rules

The repository boundary is still `src/lib/repo`. Runtime pages and components do not call Prisma directly.

## Repository and deployment

- Repository: [SimpsonLWH/rethink-recruitment](https://github.com/SimpsonLWH/rethink-recruitment), branch `main`
- Deployment: <https://rethink-recruitment.vercel.app>
- Only `recruitment-app/` is changed by this work. The synthetic demo is deployed from `main`.

## What is not claimed

- No live AI run or live model output.
- No model-vs-fallback superiority.
- No assessment validation, proctoring or legal-compliance claim. The code marker uses a Node vm and is not a production code sandbox.
- No bias-elimination guarantee; the design is an intent under review.
- No real authentication, email verification, payment, file storage or messaging transport. The public Vercel demo is synthetic and is not production infrastructure.
- No prize, placement or eligibility prediction.