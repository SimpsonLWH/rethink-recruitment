# Handoff — Rivet interviewer pre-screen

**Status:** The interviewer-first pre-screen pass (15 November 2026, below) is implemented and verified locally. It is **not yet deployed**: the live demo at <https://rethink-recruitment.vercel.app> still runs commit `3322224`. D10 (Yath) and D1 (mentor) remain external gates, and the live NVIDIA gate is still open.

All data is synthetic. No real people, employers, assessments, evidence, messages or contact details are used. No live AI call or paid resource was used.

## At a glance

- App: `recruitment-app/`
- Branch: `main`
- Baseline: second-pass commit `c0ed587`
- Current commit: `ba58f9d` (pre-screen pass; not yet pushed or deployed)
- Tests: **181 passed** across 23 files
- Typecheck: clean
- Lint: clean
- Production build: passed
- Browser smoke: passed, including the pre-screen desk, queue, plan editor and versioning, frozen decision snapshot, work-sample breakdown, claim check, note, human decision and JSON export
- Screenshots: regenerated, including the pre-screen desktop and mobile screens
- Live AI evidence: none
- Evidence reading: implemented with a deterministic fallback; no live capture
- Pre-screen: deterministic, no model in the plan, claim checks, kit or decision

## 15 November 2026 pass: interviewer-first pre-screen

### What this pass changed

- **New primary surface: `/prescreen`.** A desk with live role queues, evidence counts and recent decisions; `/prescreen/[roleId]` with the stated bar, the screening plan and an event-ordered queue; `/prescreen/[roleId]/[candidateId]` with the full packet.
- **The packet** contains the work-sample result against the bar, an evidence brief, criterion-by-criterion status and questions, a claim ledger with provenance/artifact/link status, reviewer notes, an append-only audit trail, a conversation kit and the decision panel.
- **Claim checks.** A reviewer marks a claim *checked*, *artifact only*, *for conversation* or *not checkable*, with an optional note. Preference and availability facts are classified as *context*, not claims. A working link is never treated as proof of the claim.
- **Human decision.** The reviewer rates each criterion, chooses *move to interview*, *hold* or *not moving forward*, writes a reason, and confirms the decision. The server stores the basis, reviewer and time. No automatic rejection, no match, no outcome.
- **Editable, versioned screening plan.** A live role card derives a plan from its assessment bars and signals. The plan editor changes the criteria (1-7) and persists them on `Role.screeningPlanJson`; each save increments `Role.screeningPlanVersion`.
- **Frozen decision snapshots.** A recorded decision stores the full plan snapshot and version on the run. A later plan edit cannot reword the criteria the reviewer actually decided against; decided packets show the frozen version and warn when the role plan has moved on.
- **Question-level work sample.** The packet shows each problem's passed/total checks, without exposing hidden tests. Seeded attempts get deterministic synthetic per-problem marks; live sittings store real marks.
- **Portable audit record.** The packet exports as a JSON download with the frozen plan, claim states, decision, notes and audit trail. The route is employer-only.
- **Plan drift and reset.** If the plan's assessment or signal sources no longer match the role card, the queue warns and the plan editor can reset from the role card. The reset increments the plan version.
- **Optional candidate outcome.** A decline can send one short, honest outcome only when the reviewer explicitly ticks the box. The run records `outcomeSentAt` and an `OUTCOME_SENT` audit event; the existing `Outcome` row drives the candidate update. Nothing is automatic.
- **Candidate evidence record.** `/profile/evidence` gives the candidate the same work samples, claims, artifacts and context/claim distinction a hiring team sees, without internal check notes or a CV score. It is linked from the dashboard and profile.
- **Decision log.** `/prescreen/decisions` lists every recorded decision with its reason, basis, author, time-to-decision, outcome status and export link. It is filterable by outcome and shows a median time-to-decision as operational context.
- **Conversation kit.** A deterministic, time-boxed kit built from open must-haves, claims saved for the conversation and work-sample questions with gaps, with a listen-for and follow-up. It is copyable.
- **New persistence.** `ScreeningRun` (stage, status, claim checks, criterion checks, notes, decision) and `ScreeningEvent` (append-only audit). Seeded with 7 realistic runs at different stages.
- **Positioning.** The landing page, entry page, how-it-works page, README, PRODUCT and DESIGN now lead with the AI-CV problem and the interviewer pre-screen. The candidate side is the evidence supply, not a CV contest.
- **CV is optional.** Candidate login no longer forces CV onboarding. The setup page has a *Skip to dashboard* action. The CV remains metadata-only context and is never parsed, scanned or scored.
- **Dashboard and nav.** Pre-screen is a primary employer nav item and dashboard card. Recent decisions appear on the desk.
- **Mobile order.** The decision panel appears before the long record on small screens. Touch targets were raised on claim, rating, filter and kit controls.
- **Favicon.** `public/favicon.ico` stops the benign `/favicon.ico` 404 in the browser smoke.

### Verification (15 November 2026, local)

- `npx tsc --noEmit` and `npx next lint`: clean.
- `npx vitest run`: **181 passed** across 23 files. 33 new tests cover plan derivation, drift detection, criterion evaluation, claim contexts, the shared context classifier, the interview kit (including work-sample gaps and saved claims), the packet summary and decision validation.
- `npm run build`: passed.
- `npm run smoke` against the production build: passed. It now covers the pre-screen desk, decision log, role queue, plan editor and version increment, plan reset, frozen decision snapshot, packet, question-level work sample, claim check, note, human decision, export authorization, and a decline that explicitly sends a candidate outcome, alongside all earlier candidate/employer flows.
- `npm run screenshots`: passed; the suite now includes the pre-screen desk, queue, plan editor, packet, decision, decline outcome and mobile views.
- `npm run audit:a11y`: passed at 1440px and 390px, including the decision log and candidate evidence record. It checks landmarks, headings, alt attributes, overflow, accessible control names, skip navigation, dialog focus/Escape/focus return, and print media.
- No horizontal overflow at 390px; no console/page errors or failed requests in the screenshot pass.

### Still not claimed

- The pre-screen is a structured human process, not a validated predictor. No assessment validation, bias-elimination or legal-compliance claim.
- No AI detector exists, by design. The product does not classify a document as AI-written.
- The decision is internal by default. It does not create a match or notify a candidate. An outcome is sent only when the reviewer explicitly ticks the box on a decline.
- A plan edit affects future decisions. Historical decided packets keep their frozen snapshot; there is no multi-reviewer or second-opinion workflow yet.
- The deployed demo is not updated with this pass. Deploy and re-check after the commit.
- Live NVIDIA evidence remains absent. The separate advisory reading still runs in deterministic demo mode without a key.

## 15 November 2026 pass: assessment platform expansion

### Honest gates: status on 15 November 2026

| Gate | Status |
| --- | --- |
| NVIDIA challenge still selectable on the Junction project | **Not checked.** This needs someone signed in to the Junction platform; it cannot be verified from the repository. |
| One real Nemotron call (`audit:live`, `eval:reading`) | **Not run.** No `NVIDIA_API_KEY` exists in this checkout or the shell, and the scripts correctly refuse to run without it. `LIVE_EVIDENCE` is still empty, and the UI still says *Deterministic reading · demo mode*. |
| `SUBMISSION-NOTES.md` real numbers | **Not updated with numbers**, because none exist. The status line records this check instead. |
| 2-minute video from the live path | **Not recorded.** This needs a person, and the live path has not run. The deployed demo is deterministic; do not describe it as live. |
| Cloudinary hosting and survey | **Not done.** Optional, and it should wait until the core submission is safe. |
| D1 human-review route, D10 Yath sign-off | **External, still open.** |

To close the live gate, follow `audit/live/README.md` exactly, with an authorised key:

    npm run seed
    npm run audit:live -- --confirm-live
    npm run eval:reading -- --confirm-live

### Product roadmap items

- **P0 (hosted Postgres/libSQL, object storage, real auth and rate limits, D1, D10):** not started in this pass. The OA timer and integrity record make persistent storage *more* important: on Vercel an attempt row is still per instance.
- **P1 (validate the one-attempt policy and the caps; accessibility/privacy review of the reading):** not started. The new proctoring needs the same privacy review; it collects browser events only, with no camera or keystrokes.
- **P1 (keep or kill the reading):** unchanged; still advisory and still unevaluated.
- **P2 (Modal Sandboxes for marking, Gemini):** unchanged; the marker is still a Node `vm`.

### What this pass changed

- **HackerRank-style design.** A navy top bar replaces the left sidebar, with a green accent (`#16833F` for text-bearing fills, `#2EC866` for highlights), cool grey canvas, Inter throughout, 6–12px radii and square-cornered buttons. There is a white "Hiring for" bar for employers. The OA runner is a full-screen split workspace: question navigator, timer and **Submit test** in the header; statement on the left; editor or answer panel on the right. **Run code** and the sample-case panel are kept. This adopts the platform's visual language only, with no HackerRank name, logo or assets.
- **More OAs: 12 playable, 47 questions** (`prisma/seed-data/assessments-more.ts`). These add JavaScript Strings and parsing; Algorithms Stacks and queues and Dynamic programming; and four Quant tests: Mental arithmetic, Probability and expected value, Statistics and markets, and Coding for markets.
- **New question types.** `choice` and `numeric` questions sit alongside `code`. Answer keys are stored as hidden tests and are never sent to the browser. Numeric answers accept decimals, fractions and percentages with a tolerance. Each question now carries equal weight, which gives the same score as before for the original five tests.
- **Timers.** `durationMinutes` on `Assessment`. The countdown starts at the server's `startedAt`, corrects for clock skew and auto-submits at zero. A submission more than 90 seconds late is flagged.
- **Proctoring and browser lockdown.** `proctoring` on `Assessment` takes `NONE`, `PROCTORED` or `LOCKDOWN`. A preflight screen states the rules and what is recorded. Lockdown requires fullscreen, blocks clipboard, drop and the context menu, shows a blocking warning when the candidate leaves, and auto-submits on the third warning. The server builds `integrityJson` from its own clock plus the browser's event report. Candidates see it on their result; employers see one advisory line in the evidence popover. It never changes the score. There is no camera, and the existing `camera=()` Permissions-Policy stays.
- **Prepare (`/learn`).** Four tracks, 13 lessons and 13 practice challenges (code, choice and numeric) with unlimited runs, all tests visible, hints, and explanations only after a correct answer. `POST /api/practice/check` stores nothing. Progress is kept in `localStorage`. There is a "Prepare next" panel on the candidate dashboard.
- **Quant roles and more mock data.** There is a new `Quantitative finance` role family with a template. Kallio Capital (Quantitative Researcher, Quant Developer) and Tapiola Markets (Junior Trader, Risk Analyst) role cards use two assessment bars each. Revontuli Games and Sisu Mobility were also added, along with 8 new candidates, 34 attempts in total (some with synthetic proctoring records), 2 new matches and 3 new invitations. There is a third sample login: **Open quant recruiter demo** (`lea@kallio.demo` / `demo-quant`).
- **Employer test library.** `/assessments` for employers is a read-only library with the same filters.
- With several tests per family, labels now use the exact test title ("Quant: Probability and expected value") instead of "Quant v1".

### Verification (15 November 2026, local)

- `npx tsc --noEmit` and `npx next lint`: clean.
- `npx vitest run`: **148 passed** across 21 files. New tests cover choice and numeric marking, equal weighting, hidden answer keys, numeric parsing, the integrity summary, and reference answers for every practice problem. The existing seed check proves every assessment's reference answers score 100.
- `npm run build`: passed.
- `npm run smoke` against `next dev`: passed. It now also checks a timed lockdown quant sitting through the API (no leaked answer keys, score 100, one lockdown violation recorded), a Prepare practice check, and the quant recruiter login and test library.
- A Playwright visual pass at 1366px and 390px confirmed that fullscreen engages for a lockdown sitting and that leaving it shows the warning. It found no horizontal overflow on mobile and no console or page errors.
- `npm run screenshots` regenerated the suite; the database was reseeded afterwards.

### Still not claimed

Proctoring is a deterrent and a record, not a secure exam browser or identity check. It cannot see a second device. The quant questions are illustrative, not validated. No live AI output exists.

## What changed (pivot, before 15 November)

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
- Added an advisory evidence reading on the employer review card: `POST /api/ai/reading`, a strict grounded JSON contract, a Radix dialog with citations and open questions, and a deterministic no-key fallback. It never changes the bar, feed, decision, match or outcome.
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
13. Review card → **Read the evidence**: inspect the deterministic reading, its citations and open questions, then close it. With a key configured, the same dialog shows Nemotron live or cached.

## Verification evidence

Run from `recruitment-app/`:

    npm run seed
    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run audit:ai      # deterministic fallback artifact, including the reading
    npm run dev           # separate terminal
    RIVET_BASE_URL=http://localhost:3000 npm run smoke
    RIVET_BASE_URL=http://localhost:3000 npm run screenshots
    npm run seed          # clean final demo
    # only with an authorised key and explicit approval:
    # npm run audit:live -- --confirm-live
    # npm run eval:reading -- --confirm-live

The smoke covers sample candidate/employer login, candidate signup + CV sample, recruiter signup + multi-OA role setup, dashboards, the in-place OA runner (public example check, final submission, result reload, second-sitting rejection), security headers, missing-attempt recovery, profile edit, mixed feed, evidence status/hover, the evidence reading dialog and its keyboard guard, keyboard confirmation, Like/Priority limits, invitation acceptance without auto-match, outcome wording, role-card form, discovery invitation dialog and match stage. The screenshot script covers the OA catalogue, detail and runner plus the existing desktop/mobile UX screens. It mutates state by creating one temporary candidate and taking one assessment; reseed afterwards.

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

### Evidence reading deployed check

The evidence reading was deployed in `3322224` and checked in a live browser at 1440×1000:

- the employer review card opens **Read the evidence**;
- the deployed environment has no `NVIDIA_API_KEY`, so the dialog honestly shows **Deterministic reading · demo mode** and the no-key note;
- the dialog renders the summary, covered requirements with a source quote, open questions with their statuses and two conversation questions;
- the close button, footer and `/api/health` respond normally; no console or page errors were captured.

This is a live deployment of the deterministic fallback, **not** a live model run. The Nemotron path remains implemented, not run live, until a key, a real call and a redacted capture exist.

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
- `npx tsc --noEmit`, `npx next lint`, `npx vitest run` (139 passed), `npm run build`, and `npm run smoke` all pass.
- Playwright checks at 1280, 768 and 375: every evidence popover stays fully inside the viewport and remains readable; focus moves into the panel and returns to the trigger; Escape and outside click close it; no horizontal overflow; the discovery Profile link resolves to the gated view; the match conversation opens with its message thread; the match and global 404 pages are styled; the discover skeleton is 920px wide like the loaded card.
- App pages show no restating eyebrow, no raw `not_met`/`not_stated` tokens, no "Likes left" capitalisation, no "master-record"/"simulated confirmations" labels, and no rose-tinted neutral callouts.

The `screenshots/` suite has since been regenerated with the evidence-reading views. Run `npm run seed` then `npm run screenshots` again only if the UI changes before submission.

## Evidence reading

The employer review card now offers an advisory reading of the candidate record against the role's stated bar.

- `POST /api/ai/reading` is employer-only and verifies that the role belongs to the session employer.
- `getEmployerReview` returns one candidate/role pair without the feed's decision filters, so the reading is still available after interest.
- The input contains the role's stated requirements with their deterministic statuses and the source facts on the card. It excludes names, locations, tags, bio, CV and protected traits.
- The live path uses Nemotron 3.5 Super VL with strict JSON, one repair attempt, a 24-hour cache and a deterministic fallback. The dialog labels the engine and exact model.
- The output is advisory. It cannot change the bar, feed order, a decision, a match or an outcome.
- Verification: 22 new reading/validation/orchestration tests; browser smoke opens the dialog, checks the engine label and verifies that arrow keys do not decide behind it; `npm run audit:ai` includes the deterministic reading.
- A live claim still requires a real call, a `LIVE` `AiRun` row and a redacted `LIVE_EVIDENCE` entry. No live capture exists in this checkout. Use `npm run audit:live -- --confirm-live` only with an authorised key.

## Known limitations

- D1 human-review route is not claimed as sufficient; A9 is not satisfied.
- D10 sign-off is external.
- Organiser flow is not built beyond read-only intent; D9 remains open.
- Assessments are synthetic and unvalidated. Proctoring is browser-event logging and lockdown is a fullscreen/clipboard deterrent, not a secure exam browser. The one-attempt rule, hidden-test marker and Like caps are demo defaults. The marker uses a Node vm, not a production code sandbox.
- The evidence reading is advisory and has no live evidence in this checkout. It is not used for assessment scoring, feed order, matching or outcomes. No live model quality, latency or usefulness is claimed.
- The reading route is authenticated but has no per-user rate limit. Use a restricted or low-quota key if the public demo is exposed; repeated clicks are served from the cache.
- The other AI/tailoring surfaces remain secondary and have no live evidence.
- No real authentication, payments, uploads or messaging transport. The Vercel deployment is a synthetic demo, not production infrastructure.

## Before submission

1. Get Yath's sign-off on the pivot/PRD (D10).
2. Get mentor confirmation on the human-review route (D1); do not claim A9 before it.
3. Confirm the NVIDIA Tech Challenge can still be selected before spending time on a live capture (not checked on 15 November; it needs a Junction login).
4. Run `audit:live` and `eval:reading` with an authorised key, inspect the capture, add the printed `LIVE_EVIDENCE` entry, and update the submission notes with actual numbers.
5. Re-run the verification commands, regenerate the screenshots and reseed. Deploy the 15 November pass (push `main`), then re-check the live demo: Prepare, a lockdown quant test and the quant recruiter login.
6. Do not claim legal compliance, assessment validation, secure proctoring or live AI output without a capture. Browser-event proctoring may be described exactly as built.
7. Do not describe the demo deployment as production-ready or as satisfying D1/D10.

## Links

- Repository: `SimpsonLWH/rethink-recruitment`
- Branch: `main`
- App README: `README.md`
- Decisions: `DECISIONS.md`
- AI audit: `AI-AUDIT.md`
- Screenshots: `screenshots/README.md`