# Screenshots — UX and pivot visual verification

These images were captured from the running Rivet demo with **no AI keys** and a freshly seeded synthetic database. They are verification evidence, not marketing assets. No real people, employers, evidence or confirmations appear in them.

| File | Screen | Viewport |
| --- | --- | --- |
| login-entry-desktop.png | Separate candidate and hiring doors, sample accounts and temporary-account sign-in | 1440×full page |
| signup-candidate-desktop.png | Candidate account creation | 1440×full page |
| candidate-cv-onboarding-desktop.png | Candidate CV upload or sample profile onboarding | 1440×full page |
| candidate-dashboard-desktop.png | Candidate home: CV status, profile completeness, evidence, invitations, matches, updates | 1440×full page |
| recruiter-dashboard-desktop.png | Hiring home: role cards, assessment bars, outreach, matches | 1440×full page |
| recruiter-onboarding-desktop.png | Hiring setup with multiple assessment requirements and scores | 1440×full page |
| assessments-catalogue-desktop.png | Assessment catalogue: playable and catalogue-only entries, exact family/version/difficulty, cooldown | 1440×1000 |
| assessment-result-desktop.png | Submitted assessment result with score and explanations | 1440×1000 |
| candidate-feed-desktop.png | Candidate mixed feed with compact evidence badge, Like and Priority-intro counts | 1440×1000 |
| candidate-evidence-detail-desktop.png | Evidence badge hover showing required assessment versions, scores and assessment links | 1440×1000 |
| candidate-profile-edit-desktop.png | Structured profile editor, no CV upload, discovery opt-in | 1440×full page |
| candidate-invitations-desktop.png | Candidate invitation inbox with message-only semantics | 1440×1000 |
| candidate-updates-desktop.png | Candidate interest and honest outcome wording | 1440×1000 |
| employer-feed-desktop.png | Employer mixed feed with stated bar, assessment evidence, below-bar and no-evidence views | 1440×1000 |
| employer-role-card-desktop.png | Role-card form: need capture, multiple assessment requirements, structured signals | 1440×1000 |
| employer-discovery-desktop.png | Recruiter discovery lane with opted-in non-swipers and message-only invitations | 1440×1000 |
| employer-match-stage-desktop.png | Match stage strip and employer next-step control | 1440×1000 |
| candidate-feed-mobile.png | Candidate mixed feed, mobile, fixed decision bar | 390×844 (2x) |
| assessments-catalogue-mobile.png | Assessment catalogue, mobile | 390×844 (2x) |
| employer-feed-mobile.png | Employer mixed feed, mobile, fixed decision bar | 390×844 (2x) |

Older second-pass screenshots remain in this directory as historical files. They are not evidence for the current demo.

## Regenerate

```bash
npm run seed
npm run dev          # separate terminal on http://localhost:3000
RIVET_BASE_URL=http://localhost:3000 npm run screenshots
npm run seed         # leave the app in a clean demo state
```

The script uses system Chrome through `playwright-core`. Override `CHROME_PATH` or `RIVET_BASE_URL` if needed. It mutates state by creating one temporary candidate and taking one assessment; it reports console/page errors and failed requests, and exits non-zero on browser errors. It also warns if the desktop review actions extend past the first view.

See the main [README](../README.md) for the full demo and verification commands.
