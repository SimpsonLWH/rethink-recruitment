# Handoff — Rivet assessment-backed pivot

**Status:** Implementation complete and verified. The demo is deployed from `main` at <https://rethink-recruitment.vercel.app>. D10 (Yath) and D1 (mentor) remain external gates.

All data is synthetic. No real people, employers, assessments, evidence, messages or contact details are used. No live AI call or paid resource was used.

## At a glance

- App: `recruitment-app/`
- Branch: `main`
- Baseline: second-pass commit `c0ed587`
- Tests: **117 passed** across 18 files
- Typecheck: clean
- Lint: clean
- Production build: passed
- Browser smoke: passed
- Screenshots: 22 images captured, 19 desktop and 3 mobile
- Live AI evidence: none

## What changed

- Added the OA platform: four playable coding assessments, seven problems, a code runner with public examples, deterministic server-side hidden-test marking, final scores and one attempt per recruiting cycle with no retake.
- Added temporary accounts, sample logins, candidate CV/sample onboarding, separate candidate and hiring dashboards.
- Added structured candidate profile editing and discovery opt-in. The onboarding CV is context only; there is no CV parser or automated screening.
- Added recruiter need-capture onboarding with one to three exact assessment requirements and scores.
- Added role-card need capture: exact playable assessment, required score, structured signals, named review owner.
- Replaced the old feed with a mixed interested/discovery feed for both sides, with assessment and signal evidence on every card.
- Added below-bar and no-evidence secondary views; no auto-rejection or score sorting.
- Added a fixed decision bar and keyboard shortcuts on both feeds: Left arrow pass, Right arrow like, P Priority intro. Keyboard actions require confirmation.
- Added Like caps and changed Priority intros to one per side. Replies and invitation acceptances bypass Like consumption.
- Added recruiter discovery lane and message-only invitations with accept/decline and explicit recruiter yes.
- Added state-derived outcomes and candidate updates.
- Added match stages and employer stage control.
- Kept the existing matches, messages, Priority intro inbox, evidence sheets and optional AI/tailoring surfaces.
- Rewrote seed data, smoke, screenshots, README, decisions and how-it-works for the pivot.

## Demo path

    cd recruitment-app
    npm install
    npm run seed
    npm run dev

Open <http://localhost:3000> → `/enter`.

1. Open `/enter`. Use **Open candidate demo** or **Open recruiter demo**, or create a temporary account.
2. Candidate Aino → Dashboard: CV status, evidence, invitations and updates.
3. Assessments: Backend design is closed with a final score; take Algorithms, run a public example, submit once and see the final score survive a reload.
4. Discover: evidence cards, Like cap, Priority-intro cap, below-bar section.
5. Invitations: accept the Saari invitation. No automatic match.
6. Candidate signup: create an account, choose a sample CV, land on the dashboard.
7. Employer Northwind → Dashboard: role cards and stated bars.
8. Role cards/Onboarding: pick more than one assessment and a score for each.
9. Review candidates: mixed feed, evidence, below-bar and no-evidence sections.
10. Discovery lane: open an invite dialog and see message-only semantics.
11. Employer Saari → Discovery lane/Sent invitations: say yes to match.
12. Matches: move the stage; close to send an after-conversation outcome.

## Verification evidence

Run from `recruitment-app/`:

    npm run seed
    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run dev           # separate terminal
    RIVET_BASE_URL=http://localhost:3000 npm run smoke
    RIVET_BASE_URL=http://localhost:3000 npm run screenshots
    npm run seed          # clean final demo

The smoke covers sample candidate/employer login, candidate signup + CV sample, recruiter signup + multi-OA role setup, dashboards, the in-place OA runner (public example check, final submission, result reload, second-sitting rejection), security headers, missing-attempt recovery, profile edit, mixed feed, evidence status/hover, keyboard confirmation, Like/Priority limits, invitation acceptance without auto-match, outcome wording, role-card form, discovery invitation dialog and match stage. The screenshot script covers the OA catalogue, detail and runner plus the existing desktop/mobile UX screens. It mutates state by creating one temporary candidate and taking one assessment; reseed afterwards.

## Deployment

- Public deployment: <https://rethink-recruitment.vercel.app>
- No external database service is used. The build seeds a synthetic SQLite file and includes it in the Vercel server trace; the runtime copies it to `/tmp/rivet-demo.db`.
- Writes are per serverless instance and may reset on cold start. Sample accounts are always available; use them for the reliable demo. The OA layout starts in place and submission can rebuild a missing attempt, so the old start-then-404 path is gone. Completed OA evidence is still stored per instance.
- `/api/health` is the deployment smoke endpoint.
- Build command: `npm run build` (regenerates Prisma, seeds the demo database, then builds Next).

## Deployed verification

The OA platform was pushed from `main` at commit `dba4702`. Vercel deployed it, and a live browser check confirmed:

- the catalogue shows "Online assessments" and the four playable challenges;
- starting Algorithms opens the runner in place, with no attempt-page 404;
- a complete two-problem sitting submitted and returned 100/100;
- the `Permissions-Policy` header contains only recognised features;
- `/api/health` returns `{"ok":true,"runtime":"vercel"}`.

The production SQLite file is still copied per serverless instance. The OA start flow is resilient to that split; other write flows remain per-instance and may reset on cold start.

## Known limitations

- D1 human-review route is not claimed as sufficient; A9 is not satisfied.
- D10 sign-off is external.
- Organiser flow is not built beyond read-only intent; D9 remains open.
- Assessments are synthetic, unproctored and unvalidated. The one-attempt rule, hidden-test marker and Like caps are demo defaults. The marker uses a Node vm, not a production code sandbox.
- The optional AI/tailoring surfaces are secondary and have no live evidence. They are not used for assessment scoring or matching.
- No real authentication, payments, uploads or messaging transport. The Vercel deployment is a synthetic demo, not production infrastructure.

## Before submission

1. Get Yath's sign-off on the pivot/PRD (D10).
2. Get mentor confirmation on the human-review route (D1); do not claim A9 before it.
3. Re-run the verification commands and reseed.
4. Do not claim legal compliance, assessment validation, proctoring or live AI output.
5. Do not describe the demo deployment as production-ready or as satisfying D1/D10.

## Links

- Repository: `SimpsonLWH/rethink-recruitment`
- Branch: `main`
- App README: `README.md`
- Decisions: `DECISIONS.md`
- AI audit: `AI-AUDIT.md`
- Screenshots: `screenshots/README.md`