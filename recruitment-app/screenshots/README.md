# Screenshots — visual verification

These images were captured from the running Rivet prototype with **no AI keys** and a seeded synthetic database. They are committed as verification evidence, not marketing assets. No real people or employer data appear in them.

| File | Screen | Viewport |
| --- | --- | --- |
| landing-desktop.png | Landing page | 1440×900 |
| landing-mobile.png | Landing page | 390×844 (2x) |
| enter-candidate.png | Persona picker, candidate tab | 1440×900 |
| enter-mobile.png | Persona picker, mobile | 390×844 (2x) |
| discover-candidate.png | Candidate card stack, Aino | 1440×900 |
| discover-candidate-mobile.png | Candidate card stack, mobile floating controls | 390×844 (2x) |
| discover-employer.png | Employer card stack, Northwind Product Engineer | 1440×900 |
| profile-candidate.png | Candidate master record + evidence/link status | 1440×900 |
| candidate-profile-employer.png | Employer viewing a candidate profile | 1440×900 |
| candidate-ask.png | Ask this profile Q&A with sources | 1440×900 |
| matches-candidate.png | Mutual matches list | 1440×900 |
| match-thread.png | Seeded conversation thread + advisory fit brief | 1440×900 |
| rose-inbox.png | Rose inbox with match-back | 1440×900 |
| tailor-index.png | Tailoring role picker | 1440×900 |
| tailor-review.png | Source trace + approve/edit/reject | 1440×900 |
| tailor-preview.png | Approved employer preview | 1440×900 |
| about-ai.png | About the AI / exact model / status | 1440×900 |

## Regenerate

    npm run seed
    npm run dev          # separate terminal on http://localhost:3000
    npm run screenshots
    npm run seed         # leave the app in a clean demo state

The script uses the system Chrome through <code>playwright-core</code>. Override <code>CHROME_PATH</code> or <code>RIVET_BASE_URL</code> if needed. It mutates state (it generates a tailoring draft, approves lines, etc.) and then logs console/page errors and failed requests; it exits non-zero on browser errors.

See the main [README](../README.md) for the full demo and verification commands.
