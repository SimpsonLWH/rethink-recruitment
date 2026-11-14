# Rivet — evidence first, then decide

A two-sided matchmaking prototype for **Junction 2026 · City of Espoo "Rethinking Recruitment"**. Rivet keeps the familiar mutual-swipe loop, but puts evidence before the swipe: candidates show capability through short role-relevant assessments and structured experience, while employers state their need as role cards with an explicit assessment bar.

**Everything in this demo is synthetic.** There are no real people, employers, assessments, evidence, messages or contact details. The assessment questions are illustrative and not validated. Nothing here is a claim of legal compliance or production readiness.

## Quick start — no keys

Requirements: **Node 20.9+** and npm. No API keys, database server, Docker or account are needed.

    cd recruitment-app
    npm install
    npm run seed
    npm run dev

Open <http://localhost:3000>. The app starts with a deterministic local-only demo. All AI surfaces are optional and are not used for assessment scoring, thresholds, feed order or outcomes.

- `npm run seed` creates the SQLite database at `prisma/dev.db` and inserts the synthetic event.
- The SQLite URL is hard-coded as `file:./dev.db`. No `DATABASE_URL` is required.
- If you have an older database, delete `prisma/dev.db` before seeding. The pivot adds assessment, invitation, outcome and role-card fields.
- Optional NVIDIA/Gemini paths remain secondary and have no captured live evidence in this checkout.

## Primary demo path

1. Open **/enter**. The recruiter tab is the default; Northwind Labs is marked **Start here**.
2. Open **Role cards**. A live role card shows the exact assessment version, difficulty and required score, plus the structured signals the employer accepts.
3. Open **Review candidates**. The mixed feed shows candidates who expressed interest and candidates who have not, with assessment evidence and signal matches. No cohort label, no match percentage.
4. Open **Discovery lane**. It lists opted-in non-swipers who meet the bar. **Invite** sends a message only.
5. Switch to candidate **Aino Vikström**. Open **Assessments**:
   - Backend design v1 Advanced is already complete (84/100) and is cooling down.
   - Algorithms v1 Medium is playable: four questions are drawn from eight, then scored.
6. Open **Discover roles**. Every card shows the evidence and the employer's stated bar. There is a visible below-bar section; no auto-rejection.
7. Open **Invitations**. Aino has a pending invitation from Saari Systems. Accepting records interest, **not a match**.
8. Switch back to Saari Systems. The accepted invitation shows **Say yes to match**; only then does a match form.
9. Open **Matches**. The employer can move the match through intro call, event-day meeting, interview, or closed. Closing sends an after-conversation outcome.
10. **/updates** shows the candidate's interest status and honest outcomes. A pass never claims that a human reviewed a profile that no human opened.

## Product rules

| Rule | Implementation |
| --- | --- |
| **Assessments, not CVs** | No CV parser, upload field or file input. Candidates add structured experience/projects and take short assessments. |
| **Exact evidence** | A result records family + version + difficulty. Scores are never compared across versions or averaged into a person score. |
| **Employer need capture** | A role card states one playable assessment, a 0–100 bar, and up to four structured signals. The role must be LIVE to enter the feed. |
| **Random pool + cooldown** | Two playable assessments, 8 questions each, 4 served per sitting. One retake after 24h; two attempts per cycle. Demo policy, not validated. |
| **No proctoring** | There is no timer, webcam, tab detection or identity check. The limitation is stated on the assessment screens and in the pitch. |
| **Mixed feed, no cohort leak** | The two cohorts are mixed 1:1 and shuffled deterministically. The cohort is internal only; no label, count or client field. |
| **No ranking** | Cards are not sorted by score. There is no percentile, match percentage or universal person score. |
| **Below-bar visibility** | Candidates below the stated bar stay in a visible secondary view with evidence and a named review owner. They are not auto-rejected. |
| **Mutual match** | A match needs two explicit yeses. A swipe, Priority intro, invitation or accepted invitation alone does not create one. |
| **Limited interest** | 5 Likes per candidate and 10 per employer in this demo; one Priority intro per side. Replies/acceptances do not consume Likes. |
| **Discovery opt-in** | Discovery is off by default for new candidates. Seeded demo candidates opt in. Turning it off hides them from both recruiter discovery surfaces and withdraws pending invitations. |
| **Invitations are messages** | The recruiter chooses a candidate from discovery and sends a message. The candidate can accept, decline or ignore. No application, booking or match is created automatically. |
| **Honest outcomes** | Outcome wording is state-derived. "After your conversation" is only used for a closed match. A pass or role close never fabricates a review. |
| **Next steps** | A lightweight stage on each match: intro call, event-day meeting, interview, closed. Not an ATS. |
| **Synthetic data only** | 13 fictional candidates, 8 employers, 15 roles, 10 assessment catalogue entries (2 playable), 6 live role cards. No real personal data. |

## Seed data

- 13 candidates, 8 employers, 15 roles.
- 10 assessment catalogue entries: 2 playable, 8 clearly labelled catalogue-only.
- 6 live role cards at Northwind Labs, Saari Systems, Polar Signal, Metsä Health and Common Ground.
- 9 seeded assessment attempts, including a cooldown fixture (Aino, 2h ago) and a retake-available fixture (Noor, 30h ago).
- 5 seeded matches at different stages; 3 invitations (2 pending, 1 declined); 1 seeded friendly outcome; 2 Priority intros.
- 195 local deterministic fit briefs from the earlier prototype remain for secondary context.

Fixtures are chosen to exercise the real rules: Aino meets the Backend bar but is cooling down on a retake; Noor can retake; Daniel and Nadia are below the bar; Priya, Tomas and Marcus have Algorithms evidence; Elias has no assessment yet.

## What is deliberately not finished

- **Organiser tooling** is a read-only health view at most. Organiser nudge powers and the full 7.3 flow are not built.
- **D1 human-review route** is a design proposal pending mentor confirmation. The below-bar view, owner label and review expectation are present; the formal alternative-evidence request flow is not claimed as sufficient.
- **D10**: Yath's sign-off on the pivot/PRD is external and not implied by this repository.
- No real authentication, payment, messaging transport, upload, deployment or external job-portal integration.
- No live NVIDIA or Gemini call is claimed. The existing AI surfaces remain optional and deterministic fallbacks are the default.
- No real assessment validation, proctoring, bias audit or legal-compliance certification.

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

- Unit tests: **112 passed** across 16 files.
- Typecheck: clean.
- ESLint: clean.
- Production build: passed.
- Browser smoke: passed (assessment, cooldown, profile, mixed feed, Like/Priority caps, invitation acceptance, outcomes, role-card form, discovery lane, match stage).
- Screenshots: **13 pivot screens** captured desktop + mobile, opened and inspected; one first-view warning remains for the tall employer review card.

Run `npm run audit:ai` as a regression check only if AI/tailoring files change. No live model call is needed or authorized. The project has no Python runtime or Python build step.

## Architecture

    src/app/                     landing, enter, discover, discovery, assessments, roles, invitations,
                                 updates, matches, priority-intros, profile, how-it-works
    src/app/api/                 decisions, assessments, invitations, roles, profile, matches, messages,
                                 evidence, feed, optional AI routes
    src/components/              assessment runner, candidate/employer feeds, role-card form, invitation list,
                                 discovery lane, priority intros, review/evidence, matches, profile
    src/lib/                     assessment rules, feed composition, matching, outcomes, stages,
                                 role-card templates, profile completeness, repository boundary
    prisma/                      SQLite schema, synthetic seed data and seed assertions
    scripts/                     smoke, screenshots, AI fallback audit, fit helpers
    audit/                       deterministic fallback evidence; future redacted live-capture rules

The repository boundary is still `src/lib/repo`. The runtime does not call Prisma directly from pages or components.

## Repository

- Public repository: [SimpsonLWH/rethink-recruitment](https://github.com/SimpsonLWH/rethink-recruitment)
- Branch: `main`
- The app lives in `recruitment-app/`.
- This is a public prototype snapshot. Nothing has been deployed.

## What is not claimed

- No live AI run or live model output.
- No model-vs-fallback superiority.
- No assessment validation, proctoring or legal-compliance claim.
- No bias-elimination guarantee; the design is an intent under review.
- No prize, placement or eligibility prediction.
- No real candidate, employer, verification, payment or messaging transport.