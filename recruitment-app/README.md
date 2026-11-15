# Rivet — pre-screen the work, not the wording

An interviewer-first pre-screening app for **Junction 2026 · City of Espoo "Rethinking Recruitment"**. Candidates use AI to write CVs; employers use AI to scan them. Rivet removes that loop: a stated bar becomes a short screening plan, a versioned work sample and a checkable claim record take the place of CV prose, and the interviewer leaves with a conversation kit and a decision that has a reason.

**Everything in this demo is synthetic.** There are no real people, employers, assessments, artifacts, messages or contact details. The coding problems are illustrative and not validated. Nothing here is a claim of legal compliance or production readiness.

## Quick start — no keys

Requirements: **Node 20.9+** and npm. No API keys, database server or Docker are needed.

```bash
cd recruitment-app
npm install
npm run seed
npm run dev
```

Open <http://localhost:3000/enter>.

| Side | Email | Password | What it opens |
| --- | --- | --- | --- |
| Interviewer | `mikko@northwind.demo` | `demo-recruiter` | Northwind Labs pre-screen desk, two roles and a seeded queue |
| Interviewer (quant) | `lea@kallio.demo` | `demo-quant` | Kallio Capital quant roles and two-bar screening plans |
| Candidate | `aino@demo.rivet` | `demo-candidate` | Candidate dashboard, assessments, evidence profile |

Use the sample buttons or sign in with those credentials. You can also create a temporary account; no email is sent.

## The interviewer path

1. **Open the pre-screen.** `/prescreen` shows the live role queues, how many candidates need a check, how many are ready to discuss, and recent decisions with their authors and reasons.
2. **Open a role queue.** `/prescreen/[roleId]` shows the stated bar, the screening plan (must-have, nice-to-have and one conversation criterion), and every candidate in event order. There is no score order and no rank.
3. **Edit the plan if the bar is wrong.** The `Edit plan` dialog changes the criteria every reviewer sees. The plan is derived from the role card when it is first created.
4. **Open a packet.** `/prescreen/[roleId]/[candidateId]` is the whole record:
   - the exact work-sample result against the bar, with any advisory integrity note;
   - the brief: what the record supports, what is still open and what to close next;
   - criterion-by-criterion evidence and the question to ask;
   - the claim ledger: provenance, artifact link, link status and a human check;
   - reviewer notes and an append-only audit trail;
   - the conversation kit and the decision panel.
5. **Check a claim.** Mark it *Checked*, *Artifact only*, *For conversation* or *Not checkable*. A note records what you opened. Preference and availability facts are labelled *Context* and are not treated as claims.
6. **Record a decision.** Rate the stated criteria, choose *Move to interview*, *Hold for more evidence* or *Not moving forward*, write a reason, and confirm it is your decision. The record keeps the basis, author and time. A decision is internal; it does not create a match or send an automatic rejection.
7. **Copy the kit.** The conversation kit is built deterministically from the open criteria and unchecked claims. It is time-boxed and includes a listen-for and follow-up for each question.

## The candidate path

1. **Sign in or create an account.** A CV is optional context. The signup flow offers *Skip to dashboard*, and an existing account with no CV goes straight to the dashboard.
2. **Take one versioned work sample.** Twelve playable assessments across JavaScript, Algorithms and Quant. Coding questions are marked against hidden tests; multiple-choice and numeric questions against hidden answer keys. One sitting per assessment per recruiting cycle.
3. **Prepare first if you want.** `/learn` has lessons and unlimited practice that never counts as evidence.
4. **Keep a structured record.** Projects and roles carry artifacts, dates and skills. The record is what the interviewer checks.
5. **Browse roles and respond.** A role card states its exact bar. A match still needs two explicit yeses; a pre-screen decision is internal to the hiring team.

## What the pre-screen does and does not do

| Promise | Implementation |
| --- | --- |
| **No CV keyword scan** | There is no CV parser or keyword scorer. `completeCandidateCv` stores file metadata and onboarding state only. The pre-screen never reads the file. |
| **No AI detector** | There is no detector surface. Rivet does not classify a document as AI-written. The product removes the need to guess by checking artifacts instead. |
| **No person score** | The record has evidence states and coverage, never a single candidate score. The queue is event-ordered, not score-ordered. |
| **No automatic rejection** | A below-bar result stays in the queue. A decision requires a reason, a criterion rating and a human confirmation. |
| **A real human decision** | `POST /api/screening/[roleId]/[candidateId]` is employer-only and writes the reviewer, reason, basis and time. |
| **Auditable record** | `ScreeningRun` stores the checks, notes and decision. `ScreeningEvent` is an append-only trail of opens, checks, notes, decisions and reopens. |
| **An editable plan** | `Role.screeningPlanJson` stores the criteria. The plan editor saves one to seven criteria; the default is derived from the role card's assessment requirements and signals. |
| **A conversation kit** | `buildInterviewKit` is deterministic. It asks about open criteria and claims with no verified artifact, includes a listen-for and follow-up, and always leaves time for the candidate's questions. |
| **Exact work samples** | Assessments are versioned, timed or untimed and optionally proctored or in browser lockdown. Every question has equal weight. Hidden answer keys never reach the browser. |
| **Preference is not evidence** | Facts whose prompt or metadata mark them as preference or availability are `Context`, not claims to check. |

## The two-sided event flow

The original event loop remains available on `/discover`, `/discovery`, `/invitations`, `/matches` and `/priority-intros`. It is secondary to the pre-screen, and it keeps its existing rules:

- one to three exact assessment requirements per role, each with its own required score;
- 5 Likes per candidate and 10 per employer, one Priority intro per side;
- an invitation is a message, not an application or a match;
- below-bar and no-evidence candidates stay visible;
- a match needs two explicit yeses, and outcomes use honest wording.

## Seed data

- 21 candidates, 12 employers, 21 roles, 12 live role cards.
- 12 playable assessments, 47 questions: JavaScript (3), Algorithms (4), Quant (4) and one more; each problem has a public example, and every reference answer scores 100 at seed time.
- 34 assessment attempts, 7 matches, 6 invitations, 26 decisions, 1 outcome and 2 Priority intros.
- 7 seeded pre-screen runs at different stages: in review, hold, advance and decline, with notes, claim checks and audit events.
- Every live role card gets a derived screening plan stored in the seed.
- 3 sample accounts.

## Verification

Run from `recruitment-app/`:

```bash
npm run seed
npm test
npm run typecheck
npm run lint
npm run build
npm run dev          # separate terminal
RIVET_BASE_URL=http://localhost:3000 npm run smoke
RIVET_BASE_URL=http://localhost:3000 npm run screenshots
npm run seed         # leave a clean demo
```

Current local results:

- Unit tests: **173 passed** across 22 files, including 25 pre-screen domain tests.
- Typecheck and ESLint: clean.
- Production build: passed.
- Browser smoke: passed. It now covers the pre-screen desk, role queue, plan editor, packet, claim check, note, human decision, and the existing candidate/employer flows.
- Screenshots: regenerated, including the pre-screen desk, queue, plan editor, packet and mobile views.
- Accessibility checks in the smoke/Playwright pass: no horizontal overflow at 390px, the decision panel appears before the record on mobile, and every interactive control in the packet is keyboard reachable.

## Architecture

```
src/app/(app)/prescreen/              desk, role queue and candidate packet
src/app/api/screening/                claim, note, decision, reopen and plan routes
src/components/screening/             queue, packet controls, decision dialog, plan editor, badges
src/lib/screening.ts                  deterministic plan, evaluation, claims, kit, summary, decision guards
src/lib/repo/                         Prisma repository boundary; no page calls Prisma directly
prisma/schema.prisma                  Role.screeningPlanJson, ScreeningRun, ScreeningEvent
prisma/seed-data/screening.ts         synthetic pre-screen records
scripts/smoke.mjs                     browser coverage including the pre-screen
scripts/screenshots.mjs               visual suite
```

The AI reading from the earlier pass still exists on the employer review card (`/api/ai/reading`) with a deterministic fallback. It is advisory and separate from the pre-screen. No live model is used for the plan, claim checks, interview kit or decision.

## Deployment

The demo can be deployed to Vercel with **Root Directory** set to `recruitment-app` and the Next.js preset. `npm run build` pushes the SQLite schema, seeds synthetic data, then builds Next.

The SQLite file is a demo store. Vercel's serverless filesystem is ephemeral, so the deployment copies the seeded database to `/tmp` per instance and write flows may reset on a cold start. Sample accounts are always present; use them for a reliable demo. A production deployment needs a persistent database, real authentication and rate limits.

`/api/health` is the deployment smoke endpoint.

## What is not claimed

- No live AI run, model output or model-quality claim in this checkout.
- No claim that the pre-screen predicts job performance or removes bias. It is a structured human process with an auditable rationale.
- No assessment validation, legal-compliance claim or secure exam claim. Proctoring is browser-event logging; lockdown is a fullscreen/clipboard deterrent, not a secure exam browser.
- No real employment verification. Employer confirmations are simulated seed data.
- No production authentication, file storage, email or messaging transport. The public demo is synthetic.

## Links

- [Product brief](../PRODUCT.md)
- [Design system](../DESIGN.md)
- [How it works](/how-it-works)
- [Decision log](DECISIONS.md)
- [AI audit](AI-AUDIT.md)
- [Submission notes](SUBMISSION-NOTES.md)
- [Screenshots](screenshots/README.md)
