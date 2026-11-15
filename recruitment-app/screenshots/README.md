# Screenshots — UX and pivot visual verification

The suite was regenerated on 15 November 2026 in the assessment-platform theme, after the interviewer pre-screen pass. The six quant/Prepare captures come from a separate Playwright pass at 1366px. These images were captured from the running Rivet demo with **no AI keys** and a freshly seeded synthetic database. They are verification evidence, not marketing assets. No real people, employers, evidence or confirmations appear in them. The evidence-reading screens show the deterministic demo-mode state, not a live model output; the pre-screen screens are deterministic and contain no model output.

| File | Screen | Viewport |
| --- | --- | --- |
| landing-desktop.png | Public landing page: the AI-CV problem, the pre-screen claim, and the evidence packet preview | 1440×full page |
| landing-mobile.png | Public landing page, mobile | 390×844 (2x) |
| how-it-works.png | The long version: the pre-screen, assessments, claims, human decisions and the honest AI audit | 1440×full page |
| quant-lockdown-preflight-desktop.png | Lockdown preflight: timer, fullscreen and clipboard rules, and what is (and is not) recorded | 1366×900 |
| quant-runner-choice-desktop.png | Full-screen test workspace: question navigator, warnings counter, timer, multiple-choice answer | 1366×900 |
| quant-lockdown-warning-desktop.png | Lockdown warning after leaving fullscreen (warning 1 of 3) | 1366×900 |
| prepare-hub-desktop.png | Prepare: four tracks with browser-only progress | 1366×full page |
| prepare-practice-desktop.png | Practice numeric question checked, with explanation shown after a correct answer | 1366×full page |
| quant-employer-review-desktop.png | Kallio Capital reviewing quant candidates against two stated bars | 1366×full page |
| login-entry-desktop.png | Separate candidate and hiring doors, sample accounts and temporary-account sign-in | 1440×full page |
| signup-candidate-desktop.png | Candidate account creation | 1440×full page |
| candidate-cv-onboarding-desktop.png | Optional evidence profile setup: CV as context, sample record, or skip | 1440×full page |
| candidate-dashboard-desktop.png | Candidate home: CV status, profile completeness, evidence, invitations, matches, updates | 1440×full page |
| candidate-evidence-record-desktop.png | Candidate evidence record: work samples, claims, linked artifacts and how an interviewer reads them | 1440×full page |
| candidate-evidence-record-mobile.png | Candidate evidence record, mobile | 390×844 (2x) |
| recruiter-dashboard-desktop.png | Hiring home: role cards, assessment bars, outreach, matches | 1440×full page |
| recruiter-onboarding-desktop.png | Hiring setup with multiple assessment requirements and scores | 1440×full page |
| prescreen-desk-desktop.png | Pre-screen desk: role queues, evidence counts, recent decisions and the AI-CV explainer | 1440×1000 |
| prescreen-queue-desktop.png | Role queue: stated bar, screening plan, event-ordered candidates and filters | 1440×1000 |
| prescreen-decisions-desktop.png | Decision log: outcomes, reasons, basis, author, time-to-decision and export links | 1440×1000 |
| prescreen-plan-editor-desktop.png | Editable screening plan with must-have, nice-to-have and conversation criteria | 1440×1000 |
| prescreen-packet-desktop.png | Candidate packet: brief, criteria, claims, notes, audit trail, decision and conversation kit | 1440×full page |
| prescreen-decision-desktop.png | Recorded pre-screen decision: status, reason, basis, reviewer and reopen action | 1440×1000 |
| prescreen-decline-outcome-desktop.png | A declined packet with the explicit candidate outcome recorded | 1440×1000 |
| prescreen-frozen-plan-desktop.png | A decided packet keeping its frozen v1 plan after the role plan moved to v2 | 1440×1200 |
| prescreen-kit-desktop.png | Conversation kit: agenda, work-sample gap question, saved claim questions, listen-fors and timings | 1440×1000 |
| assessments-catalogue-desktop.png | Online assessment catalogue: twelve tests with track, difficulty, format and status filters | 1440×1000 |
| assessment-detail-desktop.png | Assessment detail: one sitting per cycle, final attempt rule and start action | 1440×full page |
| assessment-runner-desktop.png | OA runner: problem statement, public examples, Monaco JavaScript editor in Visual Studio Dark and public-example check | 1440×1000 |
| assessment-result-desktop.png | Final OA score, per-problem hidden-test counts and the no-retake notice | 1440×1000 |
| candidate-feed-desktop.png | Candidate mixed feed with compact evidence badge, Like and Priority-intro counts | 1440×1000 |
| candidate-evidence-detail-desktop.png | Evidence badge hover showing required assessment versions, scores and assessment links | 1440×1000 |
| candidate-profile-edit-desktop.png | Structured profile editor, no CV upload, discovery opt-in | 1440×full page |
| candidate-invitations-desktop.png | Candidate invitation inbox with message-only semantics | 1440×1000 |
| candidate-updates-desktop.png | Candidate interest and honest outcome wording | 1440×1000 |
| employer-feed-desktop.png | Employer mixed feed with stated bar, assessment evidence, below-bar and no-evidence views | 1440×1000 |
| employer-evidence-reading-desktop.png | Advisory evidence reading: deterministic label, covered requirements with citations, open questions and conversation questions | 1440×1000 |
| employer-role-card-desktop.png | Role-card form: need capture, multiple assessment requirements, structured signals | 1440×1000 |
| employer-discovery-desktop.png | Recruiter discovery lane with opted-in non-swipers and message-only invitations | 1440×1000 |
| employer-match-stage-desktop.png | Match stage strip and employer next-step control | 1440×1000 |
| prescreen-desk-mobile.png | Pre-screen desk, mobile, primary nav and role entry | 390×844 (2x) |
| prescreen-packet-mobile.png | Candidate packet, mobile, decision before the long record | 390×844 (2x) |
| candidate-feed-mobile.png | Candidate mixed feed, mobile, fixed decision bar | 390×844 (2x) |
| assessments-catalogue-mobile.png | Assessment catalogue, mobile | 390×844 (2x) |
| employer-feed-mobile.png | Employer mixed feed, mobile, fixed decision bar | 390×844 (2x) |
| employer-evidence-reading-mobile.png | Advisory evidence reading, mobile, scrollable body with fixed caveat footer | 390×844 (2x) |

The directory contains only the current suite and the six quant/Prepare captures from a separate Playwright pass; stale screenshots were removed after the pre-screen pass.

## Regenerate

```bash
npm run seed
npm run dev          # separate terminal on http://localhost:3000
RIVET_BASE_URL=http://localhost:3000 npm run screenshots
npm run seed         # leave the app in a clean demo state
```

The script uses system Chrome through `playwright-core`. Override `CHROME_PATH` or `RIVET_BASE_URL` if needed. It mutates state by creating one temporary candidate and taking one assessment; it reports console/page errors and failed requests, and exits non-zero on browser errors. It also warns if the desktop review actions extend past the first view. The pre-screen screens are captured from the seeded Northwind queue and the Aino packet.

See the main [README](../README.md) for the full demo and verification commands.
