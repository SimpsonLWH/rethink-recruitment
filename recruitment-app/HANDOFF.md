# Handoff — Rivet assessment-backed pivot

**Status:** Local implementation complete and verified; not merged, deployed or made public. D10 (Yath) and D1 (mentor) remain external gates.

All data is synthetic. No real people, employers, assessments, evidence, messages or contact details are used. No live AI call or paid resource was used.

## At a glance

- App: `recruitment-app/`
- Branch: `recruitment-prototype`
- Baseline: second-pass commit `abcf3b3`
- Tests: **112 passed** across 16 files
- Typecheck: clean
- Lint: clean
- Production build: passed
- Browser smoke: passed
- Screenshots: 13 pivot images captured desktop + mobile
- Live AI evidence: none

## What changed

- Added the assessment catalogue, two playable assessments, random-pool selection, deterministic scoring, cooldown and attempt limits.
- Added structured candidate profile editing and discovery opt-in; no CV upload.
- Added role-card need capture: exact playable assessment, required score, structured signals, named review owner.
- Replaced the old feed with a mixed interested/discovery feed for both sides, with assessment and signal evidence on every card.
- Added below-bar and no-evidence secondary views; no auto-rejection or score sorting.
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

1. Employer Northwind Labs → Role cards: inspect the exact assessment bar.
2. Review candidates: mixed feed, evidence, below-bar and no-evidence sections.
3. Discovery lane: open an invite dialog and see message-only semantics.
4. Candidate Aino → Assessments: cooldown on Backend design; take Algorithms.
5. Candidate Discover: evidence cards, Like cap, Priority-intro cap, below-bar section.
6. Invitations: accept the Saari invitation. No automatic match.
7. Employer Saari → Discovery lane/Sent invitations: say yes to match.
8. Matches: move the stage; close to send an after-conversation outcome.
9. Updates: see the honest pass outcome and no fabricated review claim.

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

The smoke covers assessment start/submit/result, cooldown, profile edit, mixed feed, Like/Priority limits, invitation acceptance without auto-match, outcome wording, role-card form, discovery invitation dialog and match stage. The screenshot script covers 13 desktop/mobile pivot screens. It mutates state by taking one assessment; reseed afterwards.

## Known limitations

- D1 human-review route is not claimed as sufficient; A9 is not satisfied.
- D10 sign-off is external.
- Organiser flow is not built beyond read-only intent; D9 remains open.
- Assessments are synthetic, unproctored and unvalidated. Random pool, cooldown and Like caps are demo defaults.
- The employer review card is tall; the decision bar can extend past the first 1000px view. Readable evidence and complete facts take priority.
- The optional AI/tailoring surfaces are secondary and have no live evidence. They are not used for assessment scoring or matching.
- No real auth, payments, uploads, messaging transport or deployment.

## Before submission

1. Get Yath's sign-off on the pivot/PRD (D10).
2. Get mentor confirmation on the human-review route (D1); do not claim A9 before it.
3. Re-run the verification commands and reseed.
4. Do not claim legal compliance, assessment validation, proctoring or live AI output.
5. Do not deploy or make production-readiness claims without explicit approval.

## Links

- Public repository: [SimpsonLWH/rethink-recruitment](https://github.com/SimpsonLWH/rethink-recruitment)
- Branch: `main`
- App README: `README.md`
- Decisions: `DECISIONS.md`
- AI audit: `AI-AUDIT.md`
- Screenshots: `screenshots/README.md`