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
4. **Prepare, then take an online assessment.** The **Prepare** hub has four tracks (JavaScript, Algorithms, Quant, OA strategy) with lessons and unlimited practice that never counts as evidence. Every role card shows the exact assessment and bar it asks for. Assessments mix JavaScript coding, multiple-choice and numeric questions; some are timed, proctored or in browser lockdown. One attempt per cycle, marked against hidden tests and answer keys; a below-bar result stays visible in a secondary view.
5. **Use Like or one Priority intro.** Both sides must say yes for a match.
6. **Respond to discovery invitations.** Accepting records interest, not a match. A separate recruiter yes is still needed.
7. **See honest outcomes.** A pass never claims a review that did not happen. A closed match uses after-conversation wording.

### Hiring team

1. **Sign in or create an account.** Choose the hiring side.
2. **Set the bar before browsing.** Create a role card with one to three exact assessment requirements, each with its own required score, plus up to four structured signals.
3. **Land on the hiring dashboard.** See configured roles, stated requirements, outreach and matches.
4. **Review the mixed feed.** Cards show assessment evidence, signal evidence, and the employer's own bar. Below-bar and no-evidence candidates stay visible. Open **Read the evidence** for an advisory reading with citations and open questions.
5. **Use the discovery lane.** Invite opted-in candidates who have not swiped; the invitation is a message only.
6. **Move matches through a lightweight stage list.** Closing sends an honest outcome.

## Product rules

| Rule | Implementation |
| --- | --- |
| **Separate flows** | Candidate and hiring accounts share authentication but get different onboarding, dashboards and navigation. |
| **Temporary auth** | Demo-only email/password accounts with scrypt hashes. No email verification, reset or rate limit. Sample accounts sign in without creation. |
| **CV onboarding** | Candidates upload a CV or choose a synthetic sample. The demo stores file metadata only; there is no automated CV screening. |
| **Online assessments, not CVs** | Twelve playable assessments and 47 questions across JavaScript, Algorithms and Quant tracks: coding problems marked against hidden tests, plus multiple-choice and numeric questions marked against hidden answer keys that never reach the browser. Every question carries equal weight. Catalogue filters by track, difficulty, format and status. |
| **Timers** | Timed tests show a countdown from the server start time and auto-submit at zero. A submission more than 90 seconds past the limit is flagged, not rejected. |
| **Proctoring and browser lockdown** | *Proctored* tests log tab switches, focus loss and paste attempts with timestamps. *Lockdown* tests also require fullscreen, block copy/cut/paste/drop and the context menu, pause the questions when the candidate leaves, and auto-submit on the third warning. No camera, microphone, screen recording or keystrokes. The server stores a summary that reviewers see as one advisory line; it never changes the score or a decision. It is a deterrent, not a secure exam browser. |
| **Prepare** | Lessons and practice challenges with all tests visible and unlimited runs (`/learn`). Explanations appear only after a correct answer. Progress is kept in the browser only. |
| **One attempt, final** | One sitting per candidate per assessment per recruiting cycle. No retake, no cooldown and no second submission. The database unique key enforces the rule. |
| **Monaco editor** | The OA editor is Monaco in Visual Studio Dark, lazy-loaded from jsDelivr. Public examples can be run repeatedly; hidden tests mark the one final submission. |
| **Recruiter need capture** | One to three exact assessment requirements per role, each with its own 0–100 score, plus structured signals. |
| **No ranking** | No percentile, match percentage, or universal person score. Cards are not sorted by score. |
| **Below-bar visibility** | Candidates below any stated bar stay in a visible secondary view with evidence and a named review owner. |
| **Mutual match** | A match needs two explicit yeses. An invitation, accepted invitation, Like or Priority intro alone does not create one. |
| **Limited interest** | 5 Likes per candidate, 10 per employer, one Priority intro per side. Responses/acceptances do not consume Likes. |
| **Keyboard use** | On either feed, use Left arrow to pass, Right arrow to like, and P for a Priority intro. Keyboard actions open a confirmation before they are saved. The decision bar stays fixed on screen. |
| **Evidence state** | A compact badge shows green for met, amber for an assessment not taken, and rose for a score below the stated bar. Hover or tap it for the exact assessment versions, scores and links. |
| **Evidence reading** | The employer review card offers an advisory reading of the record against the stated bar. It cites source facts, names open questions and suggests conversation questions. It cannot change the bar, feed order, decision, match or outcome. With no key it is deterministic; with `NVIDIA_API_KEY` it can use Nemotron and is labelled live or cached. |
| **Discovery opt-in** | Off by default for new accounts; seeded sample candidates opt in. Turning it off hides both discovery surfaces and withdraws pending invitations. |
| **Honest outcomes** | State-derived wording. "After your conversation" only for a closed match. |
| **Synthetic data** | 21 candidates, 12 employers (two fictional quant firms), 21 roles, 12 assessments (47 questions), 3 sample accounts. |

## Seed data

- 21 candidates, 12 employers, 21 roles. New: Kallio Capital and Tapiola Markets (fictional quant firms), Revontuli Games and Sisu Mobility.
- 12 assessments, all playable, 47 questions:
  - JavaScript: Essentials, Data handling (untimed), Strings and parsing (45 min).
  - Algorithms: Fundamentals, Problem solving, Advanced (untimed), Stacks and queues (40 min, proctored), Dynamic programming (60 min, proctored).
  - Quant: Mental arithmetic (8 min, lockdown), Probability and expected value (25 min, lockdown), Statistics and markets (30 min, lockdown), Coding for markets (45 min, proctored).
- 12 live role cards (6 in the Quantitative finance family, most with two assessment bars), 9 draft roles.
- 34 assessment attempts, some with synthetic proctoring records. Each candidate has at most one sitting per assessment.
- 7 matches at different stages; 6 invitations; 1 outcome; 2 Priority intros.
- 3 sample accounts: Aino (candidate), Northwind Labs (employer) and Kallio Capital (quant employer, `lea@kallio.demo` / `demo-quant`).
- Every reference answer is checked to score 100 at seed time and in the test suite.

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
    RIVET_BASE_URL=http://localhost:3000 npm run check:ui
    RIVET_BASE_URL=http://localhost:3000 npm run smoke
    RIVET_BASE_URL=http://localhost:3000 npm run screenshots
    npm run seed         # leave a clean demo

Current local results:

- Unit tests: **148 passed** across 21 files.
- Typecheck: clean.
- ESLint: clean.
- Production build: passed.
- Browser smoke: passed (sample logins, candidate signup + CV sample, recruiter signup + multi-OA role, dashboards, in-place OA runner with public examples and final submission, one-and-done enforcement, result reload, security headers, missing-attempt recovery, profile, mixed feed, evidence reading dialog and keyboard guard, Like/Priority caps, invitation acceptance, outcomes, role-card form, discovery lane, match stage).
- UI check: **passed** — 32 assertions across 1440, 390 and 320px, plus reduced motion and the public `/enter` and `/how-it-works` controls.
- Screenshots: **29 screens** captured by the script: 23 desktop and 6 mobile, plus the six separate quant/Prepare captures.
- Deployed check: **passed**. The live Vercel build serves the five JavaScript-only OA challenges with no old Linux or design catalogue entries, starts the runner in place, marks a live JavaScript Essentials sitting 100/100, loads the Monaco editor in Visual Studio Dark, returns `/api/health` ok and sends the explicit Permissions-Policy header.
- Deployed reading check: **passed**. The employer review card opens **Read the evidence**; with no key configured on Vercel the dialog shows **Deterministic reading · demo mode**, the no-key note, citations and open questions. No live model call was made.
- The screenshot script warns if the employer review card pushes its decision bar past the first 1000px view; the latest run did not.

No key is required. The evidence reading has a deterministic fallback and is labelled as such. With `NVIDIA_API_KEY` configured, the same dialog can use Nemotron 3.5 Super VL and is labelled live or cached. No live capture is registered in this checkout, and no model is used for assessment scoring, matching, thresholds or outcomes.

## Architecture

    src/app/                     landing, enter, signup, onboarding, dashboard, discover, discovery,
                                 assessments, roles, invitations, updates, matches, priority-intros,
                                 profile, how-it-works
    src/app/actions/             demo auth, session, CV onboarding, tailoring/session actions
    src/app/api/                 decisions, assessments, invitations, roles, profile, matches, messages,
                                 evidence, feed, AI routes including the evidence reading
    src/components/              account/onboarding panels, Monaco OA editor and runner, dashboards, feeds,
                                 role-card form, invitations, discovery lane, review/evidence reading, matches
    src/lib/                     auth hashing, OA rules and server marking, feed composition, matching,
                                 outcomes, stages, profile completeness, repository boundary, reading logic
    prisma/                      SQLite schema, synthetic seed data and seed assertions
    scripts/                     smoke, screenshots, AI fallback audit, fit helpers
    audit/                       deterministic fallback evidence; future redacted live-capture rules

The repository boundary is still `src/lib/repo`. Runtime pages and components do not call Prisma directly.

## Repository and deployment

- Repository: [SimpsonLWH/rethink-recruitment](https://github.com/SimpsonLWH/rethink-recruitment), branch `main`
- Deployment: <https://rethink-recruitment.vercel.app>
- Only `recruitment-app/` is changed by this work. The synthetic demo is deployed from `main`.

## What is not claimed

- No live AI run or live model output in this checkout.
- No model-vs-fallback superiority. The reading's live quality, latency and usefulness have not been measured here.
- No claim that the reading changes or improves a hiring decision. It is advisory; a human decides.
- No assessment validation or legal-compliance claim. Proctoring is browser-event logging and lockdown is a fullscreen/clipboard deterrent; neither is a secure exam browser or identity check, and neither can see a second device. The code marker uses a Node vm and is not a production code sandbox. The Monaco editor is loaded from a public CDN at runtime.
- No bias-elimination guarantee; the design is an intent under review.
- No real authentication, email verification, payment, file storage or messaging transport. The public Vercel demo is synthetic and is not production infrastructure.
- No prize, placement or eligibility prediction.