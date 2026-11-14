# Screenshots — visual verification

These images were captured from the running Rivet prototype with **no AI keys** and a freshly seeded synthetic database. They are committed as verification evidence, not marketing assets. No real people, employers, evidence or confirmations appear in them.

Every image in this directory was opened and inspected after capture. Spacing, overflow, contrast, alignment, action visibility and mobile action-bar overlap were checked, and the screens were re-captured after fixes. The committed files are the verified-final versions.

| File | Screen | Viewport |
| --- | --- | --- |
| landing-desktop.png | Product-led landing page with the Noor Salmi review-card preview | 1440×900 |
| landing-mobile.png | Landing page, mobile | 390×844 (2x) |
| enter-employer.png | Persona picker, recruiter-first employer tab | 1440×900 |
| enter-candidate.png | Persona picker, candidate tab | 1440×900 |
| enter-mobile.png | Persona picker, mobile | 390×844 (2x) |
| review-portfolio-desktop.png | Primary recruiter review: Noor Salmi's rich portfolio card, actions visible in the first view | 1440×900 |
| review-evidence-desktop.png | Progressive disclosure: source fact, provenance and link status for the project module | 1440×900 |
| review-nonportfolio-desktop.png | Non-portfolio review: Elias Nieminen's skills, result, responsibility and availability modules; no forced imagery | 1440×900 |
| review-mobile.png | Recruiter review, mobile first view with the fixed decision bar | 390×844 (2x) |
| feed-parsed-desktop.png | Customise feed: the required "React, at least 2 years, finance background" request parsed into editable criteria before applying | 1440×1035 (full page) |
| feed-applied-desktop.png | Feed applied: one in feed, eight not stated, one outside; why line and one-tap broaden/reset | 1440×1946 (full page) |
| feed-why-desktop.png | "Why you're seeing this": each criterion, matched facts and the dated-duration explanation | 1440×900 |
| feed-mobile.png | Customise feed applied on mobile, after the review card | 390×844 (2x) |
| priority-intro-dialog.png | Required-reason priority intro dialog with the count next to the action | 1440×900 |
| priority-intro-inbox.png | Priority intro inbox with the reason and match-back action | 1440×900 |
| how-it-works.png | The single long-form page: loop, interest, evidence, feed, AI audit, limits | 1440×4494 (full page) |
| ai-audit.png | The AI audit table generated from actual state; no live claim | 1440×900 |
| matches-employer.png | Employer match list | 1440×900 |
| matches-candidate.png | Candidate match list | 1440×900 |
| match-thread.png | Mutual-match conversation and advisory fit brief | 1440×900 |
| candidate-profile-employer.png | Full candidate record after employer interest; the gate is passed by the seeded match | 1440×900 |
| candidate-ask.png | Employer Q&A with cited source facts | 1440×900 |
| discover-candidate.png | Candidate role deck | 1440×900 |
| discover-candidate-mobile.png | Candidate role deck, mobile | 390×844 (2x) |
| profile-candidate.png | Candidate master record with the highlight studio below | 1440×900 |
| profile-candidate-mobile.png | Candidate master record, mobile | 390×844 (2x) |
| tailor-index.png | Tailoring role picker | 1440×900 |
| tailor-review.png | Tailoring review: visibly rewritten line, source trace, draft note, human approval | 1440×900 |
| tailor-preview.png | Candidate-approved employer preview with provenance carried through | 1440×900 |

## Regenerate

```bash
npm run seed
npm run dev          # separate terminal on http://localhost:3000
npm run screenshots
npm run seed         # leave the app in a clean demo state
```

The script uses the system Chrome through `playwright-core`. Override `CHROME_PATH` or `RIVET_BASE_URL` if needed. It mutates state (passes a candidate, generates and approves a tailoring draft, asks one Q&A question) and then reports console/page errors and failed requests; it exits non-zero on browser errors. It also warns if the desktop review actions extend past the 900px first view.

See the main [README](../README.md) for the full demo and verification commands.
