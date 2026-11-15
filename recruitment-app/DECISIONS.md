# Decision log — Rivet pre-screen

This file records the judgment calls made while turning the prototype into an interviewer-first pre-screening tool. It is not evidence that the PRD or pivot has been approved by Yath (D10), and it does not claim legal compliance.

## Baseline

- Canonical repository: `SimpsonLWH/rethink-recruitment`, branch `main`.
- App: `recruitment-app/`.
- The existing prototype already had mutual decisions, Priority intros, review cards, evidence sheets, matches, messages and optional AI/tailoring. The pivot extends that app; it does not re-architect it.
- All data, assessments, companies and outcomes are synthetic. No real personal data, keys or paid resources are used.
- The demo is deployed from the public snapshot to Vercel at <https://rethink-recruitment.vercel.app>. The deployment uses synthetic data only.

## Product decisions

- **Assessments are evidence, not a gatekeeper.** Five playable JavaScript coding assessments: Algorithms Easy, Medium and Advanced, plus JavaScript Essentials and Data handling. Linux, infrastructure and design-only catalogue entries were removed because they did not produce meaningful JavaScript evidence. A result is tied to family + version + difficulty. Scores are never compared across versions or averaged into a person score.
- **One sitting, no retake is the demo default.** Each playable assessment is a small set of JavaScript problems marked against hidden tests on the server. A candidate gets one attempt per assessment per recruiting cycle. There is no cooldown and no retake; the attempt row and score are final. The policy is not validated, and there is no proctoring, timer or identity check.
- **Marking is deterministic and server-side.** The marker runs the submitted function in a fresh Node vm context per test case with a timeout. This is a demo marker, not a production code sandbox. Scores are the percentage of test cases passed, recorded against one assessment version.
- **Role cards capture need first.** A live role card names one playable assessment, a 0–100 bar and up to four structured signals. Only live role cards enter the feed.
- **Six live role cards** cover Northwind Product Engineer, Northwind ML Engineer, Saari Backend Engineer, Polar Data Analyst, Metsä QA Specialist and Common Ground Frontend Engineer. The other nine seeded roles remain profile/catalogue context.
- **Mixed feed, no cohort leak.** Interested and discovery cards are mixed 1:1 and deterministically shuffled. The cohort is internal; no label, count or client field.
- **No ranking or universal score.** Cards are not sorted by assessment score. No match percentage, percentile or person score exists.
- **Below-bar visibility.** Below-bar candidates stay in a secondary view with their evidence and a named review owner. No automatic rejection. Formal alternative-evidence/review route is D1-gated and not claimed as sufficient.
- **Like and Priority-intro limits.** Five Likes for a candidate, ten for an employer, one Priority intro per side in this demo. Replies, invitation acceptances and review responses do not consume Likes.
- **Priority intro remains the visible special signal.** One per side, with a required one-line reason. Ordinary Likes stay hidden until mutual.
- **Discovery is opt-in.** New candidates default to off; seeded demo candidates opt in. Turning it off hides them from both recruiter discovery surfaces and withdraws pending invitations. Existing matches remain.
- **Invitations are messages only.** A recruiter invites a candidate who has not swiped and meets the bar. Acceptance records candidate interest; it is not a match. A separate recruiter yes is required unless the recruiter already said yes.
- **Outcomes are state-derived.** Pass, role close and match close use different wording. "After your conversation" is only used for a closed match. No fabricated review claim.
- **Next steps are lightweight.** Match stage: intro call, event-day meeting, interview, closed. Closing sends the after-conversation outcome. Not an ATS.

## UX and account decisions

- **Two doors, not one persona picker.** `/enter` is a sign-in page with separate candidate and hiring panels, sample accounts and a shared temporary-account form.
- **Temporary accounts are demo-only.** `Account` stores scrypt password hashes and a person id. There is no email verification, reset, rate limit or real identity. Sample accounts sign in without creation; created accounts can sign in later.
- **A CV is optional context.** Candidate login no longer requires CV onboarding; the setup page offers *Skip to dashboard*. If a candidate adds one, the demo stores file metadata and onboarding state only. There is no parser, keyword scan, AI detector or automated screening.
- **Recruiters onboard through need capture.** New hiring accounts are routed to a role-card setup with one to three exact assessment requirements and scores before they browse.
- **Separate dashboards make the purpose explicit.** Candidate home centres evidence, CV status, assessments, invitations and updates. Hiring home centres role cards, bars, outreach and matches. Mobile navigation is trimmed to five core items; secondary links stay on the dashboard.
- **Multiple OA requirements per role.** `Role.requirementsJson` stores up to three assessment/score pairs. The primary requirement drives the existing feed evidence; all stated requirements are visible on role cards and evidence panels. Seed roles use one requirement each.
- **The editor is Monaco in Visual Studio Dark.** The OA runner lazy-loads Monaco from jsDelivr. This adds one runtime CDN request; the local marker, hidden tests, scores and one-attempt rule do not depend on it. The alternative, bundling Monaco into the Next client, adds substantial build and worker configuration for this demo.
- **The OA runner is a product surface, not a timer or proctor.** Candidates see the problem statement, public examples, a code editor, a public-example check and one final submission. Draft code is saved in the browser. Hidden tests are never sent to the browser.
- **Starting an OA does not navigate to a DB-backed page.** The start response renders in place so a serverless instance split cannot turn "start" into a 404. Submission can recreate a missing attempt row from the assessment id; direct attempt links show a recovery page rather than a raw 404.
- **Security headers are explicit.** `next.config.ts` sets Permissions-Policy, Referrer-Policy and X-Content-Type-Options. The Permissions-Policy uses only widely recognised features; browser extensions that inject `browsing-topics=()` can still produce a harmless Chrome console warning.
- **Rose editorial theme.** Warm paper, near-black text and a muted rose accent replace the indigo/pill-heavy treatment. Primary buttons stay rounded. The app UI uses the system sans stack; Fraunces is reserved for the public landing page.
- **Compact evidence status.** Feed cards show a small status badge instead of a large evidence panel. Green means met, amber means an assessment is not taken and rose/red means a score is below the stated bar. Hover or tap opens the exact requirements and assessment links.
- **Two-column decision card.** On desktop the role summary and signals sit beside the evidence status, with role details in a narrow right rail. The row is 920px wide and 466px tall at 1440px. On mobile the details collapse, skills hide and the read link moves into the header so the card clears the fixed decision bar.
- **A keyboard confirm should not need the mouse.** Left/Right/P open a confirm dialog; Enter or the same arrow key again records the decision. Presses in the first 250 ms are ignored and auto-repeat is dropped, so a held key or a mashed double tap cannot commit before the card is read. Escape, the close button, Cancel or a backdrop click cancels. The dialog is the shared Radix dialog, so focus is trapped and returned.

## Gates and open decisions

- **D10:** Yath's sign-off on the pivot and PRD. External; not implied by this repository.
- **D1:** Who owns below-bar review, what "timely" means, and the alternative-evidence/accommodation route. The demo has a named owner label and a 48h expectation, but does not claim A9 is satisfied.
- **D9:** Organiser nudge/mutation powers remain open. No organiser persona or full 7.3 flow is built.
- **D8:** The catalogue is seeded as if organiser-curated. Real governance remains open.
- **D2–D6/D8 demo defaults** are recorded in the README and the PRD plan. They are not user-validated decisions.

## Data and seed decisions

- Event: Junction 2026 · Espoo Career Event, 14 November 2026.
- 13 candidates, 8 employers, 15 roles.
- 5 assessment entries, all playable, 10 coding problems.
- 6 live role cards; 9 draft roles.
- 11 assessment attempts, one per candidate and assessment. No retake fixtures.
- 5 matches at different stages; 3 invitations; 1 outcome; 2 Priority intros; 195 local fit briefs.
- Seed assertions fail the seed if a live role card uses a non-playable assessment, a playable assessment has no problems, a problem has no public example, a reference solution does not score 100, an allowance is exceeded, or the feed fixtures are missing.

## Pre-screen decisions (15 November 2026)

- **The interviewer is the primary user.** The pre-screen desk, role queue and candidate packet are first-class routes. The event feed, invitations and matches remain available but are secondary.
- **The product refuses the detector and the CV score.** There is no AI-text detector and no CV keyword scanner. The replacement is a versioned work sample plus a claim ledger with artifacts and human checks.
- **A claim has a state.** `VERIFIED`, `LINK_ONLY`, `NEEDS_CONVERSATION`, `NOT_CHECKABLE` and `CONTEXT`. A working link is not proof of the claim; a failing link is a fact about the link, not the person.
- **Preference is not evidence.** Facts marked as preference or availability are classified as context and are excluded from open checks, the interview kit and the packet summary.
- **The plan is derived then owned.** A live role card derives a plan from its assessment bars and signals. The interviewer can edit one to seven criteria in `/prescreen/[roleId]`. The default is deterministic; no model invents criteria.
- **The decision is human and internal.** The reviewer rates the stated criteria, writes a reason and confirms. The server records the basis, author and time. The decision does not create a match or send an outcome.
- **No person score or ranking.** The queue is event-ordered. Evidence coverage and open checks are properties of the record, not of the person.
- **The kit is deterministic.** It is built from open must-haves and claims without a verified artifact. No model chooses the questions or the decision.
- **Mobile order is deliberate.** The decision panel comes before the long record on small screens so the action is never buried under the audit trail.
- **The record is append-only.** `ScreeningEvent` logs opens, claim checks, notes, decisions and reopens with an author and a time.
- **The plan is not versioned yet.** A recorded decision keeps its written basis, but the packet recomputes criteria from the current plan. This is a known limit, not a claim of full historical fidelity.

## AI decisions

- Assessment scoring, thresholds, feed order, match rules and outcomes are deterministic and local. No model is used for them.
- The employer review card has an advisory **evidence reading** (`reading`). It explains the fixed bar and the sourced facts with citations, gaps and conversation questions. It cannot change the bar, feed order, a decision, a match or an outcome.
- The reading receives the app's deterministic requirement statuses as fixed context; the model must not change or reinterpret them. Validation rejects a covered requirement that the app marks not met/unknown, unknown fact IDs, non-literal quotes and ranking/decision language.
- The reading prompt excludes the candidate's name, location, tags, bio, CV and protected traits. The deterministic fallback is the honest no-key state and is labelled as such.
- A live claim requires a real executed call, a `LIVE` `AiRun` row and a redacted `LIVE_EVIDENCE` entry. No live run or capture exists in this checkout. The NVIDIA challenge is a human submission decision, not implied by the code.
- The extraction, tailoring and Gemini surfaces remain optional and secondary. No live run or captured output exists in this checkout.
- No new Gemma claim is made. No live model call is required for the demo.
- The AI audit remains generated from actual state, not hand-written badges.

## Verification

- `npm test`: 173 tests across 22 files, including 25 pre-screen domain tests.
- `npm run typecheck`: clean.
- `npm run lint`: clean.
- `npm run build`: passed.
- `RIVET_BASE_URL=... npm run smoke`: passed candidate and employer flows, including the pre-screen desk, queue, plan editor, packet, claim check, note and decision.
- `npm run screenshots`: regenerated, including the pre-screen desktop and mobile screens.
- Seed is the reset command; run it after smoke/screenshots.

## Delivery status

- Public Vercel deployment is live from `main`; this repository is the canonical source.
- Candidate and employer decision bars are fixed within the first viewport; the screenshot script checks this.
- Remaining risk: D1/D10 are unresolved; the one-attempt policy, hidden-test marker and Like caps are unvalidated. The pre-screen is a structured human process, not a validated predictor, and plan versioning is not implemented.