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

- Added the OA platform: five playable JavaScript coding assessments, ten problems, a Monaco editor in Visual Studio Dark, public examples, deterministic server-side hidden-test marking, final scores and one attempt per recruiting cycle with no retake. Linux, infrastructure and design-only catalogue entries were removed.
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
3. Assessments: JavaScript Data handling is closed with a final score; take Algorithms Problem solving, run a public example, submit once and see the final score survive a reload.
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

The OA platform was pushed from `main`. Vercel deployed it, and a live browser check confirmed:

- the catalogue shows "Online assessments" and five playable JavaScript challenges, with no Linux or design catalogue entries;
- starting an OA opens the runner in place, with no attempt-page 404;
- a complete two-problem Algorithms sitting submitted and returned 100/100;
- a live JavaScript Essentials sitting also submitted and returned 100/100;
- the Monaco editor loads in Visual Studio Dark from jsDelivr and tokenizes JavaScript;
- the `Permissions-Policy` header contains only recognised features;
- `/api/health` returns `{"ok":true,"runtime":"vercel"}`.

The production SQLite file is still copied per serverless instance. The OA start flow is resilient to that split; other write flows remain per-instance and may reset on cold start.

## UI review pass

A focused UI/copy/layout pass followed the assessment-backed pivot. It changes no backend logic, seed data, demo accounts or product semantics.

What changed:
- The evidence popover is now a collision-aware layer: it renders in a portal, flips or shifts to stay inside the viewport, keeps a solid surface above the fixed action bar, moves focus into the panel, closes on Escape or outside click, and returns focus to the trigger. Below 640px it expands inline instead of floating.
- One focus ring rule. The global `focus-visible` ring is the only focus indicator; per-component ring overrides were removed.
- The matched conversation route works from `/matches`, and both the match route and unknown URLs have styled not-found pages with a way back. Recruiters opening a candidate from the discovery lane now get an explicit gated-profile explanation instead of a silent redirect to `/discover`.
- The loading skeleton for `/discover` matches the loaded 920px card, so the loaded page does not jump.
- Assessment cards say "Attempt submitted … · final" instead of "Closed …", and assessment titles use a colon ("Algorithms: Advanced") on cards, detail pages and browser titles.
- De-slop pass: redundant eyebrows removed from app pages; repeated disclaimers and role-detail prompt duplicates trimmed while consent/ranking promises stay intact; one heading type rule (sans for UI, serif only for names/quotes/empty states/landing); neutral info callouts replace rose-tinted ones; enum tokens and database/AI jargon replaced with human wording; single-item Matches and Priority intro pages got anchored section headers; keyboard hints use readable kbd styling; the sidebar logo accessible name matches its visible text; the profile stat labels are plain language.
- `PRODUCT.md` and `DESIGN.md` at the repository root record the register, voice, anti-references and the typography/colour/component rules this pass follows.

Verification (against the production build unless noted):
- `npx tsc --noEmit`, `npx next lint`, `npx vitest run` (117 passed), `npm run build`, and `npm run smoke` all pass.
- Playwright checks at 1280, 768 and 375: every evidence popover stays fully inside the viewport and remains readable; focus moves into the panel and returns to the trigger; Escape and outside click close it; no horizontal overflow; the discovery Profile link resolves to the gated view; the match conversation opens with its message thread; the match and global 404 pages are styled; the discover skeleton is 920px wide like the loaded card.
- App pages show no restating eyebrow, no raw `not_met`/`not_stated` tokens, no "Likes left" capitalisation, no "master-record"/"simulated confirmations" labels, and no rose-tinted neutral callouts.

Note: the committed `screenshots/` suite predates this pass. Regenerate it with `npm run seed` then `npm run screenshots` if the repo images are needed for submission.

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