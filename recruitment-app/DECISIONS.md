# Decision log — Rivet pivot

This file records the judgment calls made while turning the second-pass prototype into an assessment-backed matchmaking demo. It is not evidence that the PRD or pivot has been approved by Yath (D10), and it does not claim legal compliance.

## Baseline

- Canonical repository: `SimpsonLWH/rethink-recruitment`, branch `main`.
- App: `recruitment-app/`.
- The existing prototype already had mutual decisions, Priority intros, review cards, evidence sheets, matches, messages and optional AI/tailoring. The pivot extends that app; it does not re-architect it.
- All data, assessments, companies and outcomes are synthetic. No real personal data, keys or paid resources are used.
- The demo is deployed from the public snapshot to Vercel at <https://rethink-recruitment.vercel.app>. The deployment uses synthetic data only.

## Product decisions

- **Assessments are evidence, not a gatekeeper.** Two playable assessments (Backend design v1 Advanced, Algorithms v1 Medium) and eight catalogue-only entries. A result is tied to family + version + difficulty. Scores are never compared across versions or averaged into a person score.
- **Random pool and retake policy are demo defaults.** Four of eight questions per sitting; one retake after 24h; two attempts per cycle. The policy is not validated, and there is no proctoring, timer or identity check.
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
- **Candidates onboard through CV context.** Upload a CV or choose a synthetic sample profile. The demo stores file metadata and onboarding state only; there is no CV parser or automated screening.
- **Recruiters onboard through need capture.** New hiring accounts are routed to a role-card setup with one to three exact assessment requirements and scores before they browse.
- **Separate dashboards make the purpose explicit.** Candidate home centres evidence, CV status, assessments, invitations and updates. Hiring home centres role cards, bars, outreach and matches. Mobile navigation is trimmed to five core items; secondary links stay on the dashboard.
- **Multiple OA requirements per role.** `Role.requirementsJson` stores up to three assessment/score pairs. The primary requirement drives the existing feed evidence; all stated requirements are visible on role cards and evidence panels. Seed roles use one requirement each.
- **Rose editorial theme.** Warm paper, near-black text and a muted rose accent replace the indigo/pill-heavy treatment. Primary buttons stay rounded. The app UI uses the system sans stack; Fraunces is reserved for the public landing page.
- **Compact evidence status.** Feed cards show a small status badge instead of a large evidence panel. Green means met, amber means an assessment is not taken and rose/red means a score is below the stated bar. Hover or tap opens the exact requirements and assessment links.
- **Two-column decision card.** On desktop the role summary and signals sit beside the evidence status, with role details in a narrow right rail. The row is 920px wide and 466px tall at 1440px. On mobile the details collapse, skills hide and the read link moves into the header so the card clears the fixed decision bar.

## Gates and open decisions

- **D10:** Yath's sign-off on the pivot and PRD. External; not implied by this repository.
- **D1:** Who owns below-bar review, what "timely" means, and the alternative-evidence/accommodation route. The demo has a named owner label and a 48h expectation, but does not claim A9 is satisfied.
- **D9:** Organiser nudge/mutation powers remain open. No organiser persona or full 7.3 flow is built.
- **D8:** The catalogue is seeded as if organiser-curated. Real governance remains open.
- **D2–D6/D8 demo defaults** are recorded in the README and the PRD plan. They are not user-validated decisions.

## Data and seed decisions

- Event: Junction 2026 · Espoo Career Event, 14 November 2026.
- 13 candidates, 8 employers, 15 roles.
- 10 assessment catalogue entries, 2 playable.
- 6 live role cards; 9 draft roles.
- 9 assessment attempts with cooldown/retake fixtures.
- 5 matches at different stages; 3 invitations; 1 outcome; 2 Priority intros; 195 local fit briefs.
- Seed assertions fail the seed if a live role card uses a non-playable assessment, an allowance is exceeded, or the feed fixtures are missing.

## AI decisions

- Assessment scoring, thresholds, feed order, match rules and outcomes are deterministic and local. No model is used for them.
- Existing NVIDIA/Gemini surfaces remain optional and secondary. No live run or captured output exists in this checkout.
- No new Gemma claim is made. No live model call is required for the demo.
- The AI audit remains generated from actual state, not hand-written badges.

## Verification

- `npm test`: 113 tests across 17 files.
- `npm run typecheck`: clean.
- `npm run lint`: clean.
- `npm run build`: passed.
- `RIVET_BASE_URL=... npm run smoke`: passed candidate and employer flows.
- `npm run screenshots`: 20 UX/pivot screens captured desktop and mobile.
- Seed is the reset command; run it after smoke/screenshots.

## Delivery status

- Public Vercel deployment is live from `main`; this repository is the canonical source.
- Candidate and employer decision bars are fixed within the first viewport; the screenshot script checks this.
- Remaining risk: D1/D10 are unresolved; assessment policy and Like caps are unvalidated.