# Rivet submission pack — City of Espoo · Rethinking Recruitment

Prepared 2026-11-15 02:50 EET. Source snapshot: app commit `773da7b`, docs commit `004f7eb`, deployed at https://rethink-recruitment.vercel.app. Everything shown is synthetic; no keys are required.

This folder is the pack for **Rivet**, the two-sided recruitment prototype in this workspace. It sits inside `submission-draft/` (the isolated draft area created earlier) and touches no project code or app state.

## Files

| File | Purpose |
|---|---|
| [rivet-deck.pptx](rivet-deck.pptx) | 10-slide submission deck, editable in PowerPoint / Keynote. Pink editorial theme; evidence on every claim; speaker notes included. |
| [rivet-deck.pdf](rivet-deck.pdf) | Fixed PDF of the same deck, for upload or sharing. |
| [RIVET-VIDEO-DEMO-PLAN.md](RIVET-VIDEO-DEMO-PLAN.md) | Recording and edit plan for a 2-minute demo using Recordly + Remotion. |

## Paste-ready Junction fields

- **Project name:** Rivet — evidence first, then decide
- **Challenge:** City of Espoo — Rethinking Recruitment (confirm the exact platform label)
- **Source code:** https://github.com/SimpsonLWH/rethink-recruitment
- **Demo:** https://rethink-recruitment.vercel.app
- **How it works:** https://rethink-recruitment.vercel.app/how-it-works
- **Video:** [to be filled after the Remotion export]
- **Presentation:** the deck PDF or a platform link; check whether the form takes an upload or a URL.

### Punchline

Rivet makes the role's bar the contract: candidates show a recorded assessment against it, hiring teams see evidence before they swipe, and a match still needs two explicit yeses.

### Description (paste-ready; under 3000 characters)

Rivet makes the role's bar the contract. Candidates show a recorded, role-relevant assessment against the exact bar an employer stated; hiring teams see evidence before they browse; below-bar candidates stay visible; a match needs two explicit yeses.

The demo has two separate flows. Candidates can onboard with a CV (context only), practise in Prepare, take one sitting per assessment per cycle, and see the exact assessment versions and scores a role asks for. Hiring teams state one to three exact assessment requirements, each with its own score, plus structured signals, before the feed exists. The mixed feed shows evidence against that bar, not a ranking. Discovery invitations are opt-in and message-only. The employer review card offers an advisory evidence reading that cites source facts, names open questions and suggests conversation questions; it cannot change the bar, feed, decision, match or outcome.

The product has 12 playable assessments and 47 questions across JavaScript, Algorithms and Quant, 21 synthetic candidates, 12 synthetic employers and 21 roles. Verification: 148 unit tests across 21 files, typecheck, lint and production build clean, browser smoke passed, 32 UI assertions at 1440, 390 and 320px, 29 screens captured, deployed UI and reading checks passed. No keys are required; AI surfaces fall back to deterministic demo mode.

Limits: everything is synthetic. Assessments are illustrative, not validated; proctoring is a browser-event deterrent, not a secure exam browser; the demo is not production infrastructure and makes no legal-compliance or bias-elimination claim. No live model output or model-quality claim exists in this checkout.

## What the deck claims (and where it comes from)

| Claim | Source |
|---|---|
| 148 unit tests across 21 files; typecheck, lint and build pass; browser smoke passes; 32 UI assertions at three widths; 29 screens | `recruitment-app/README.md`, `recruitment-app/HANDOFF.md`, 15 Nov 2026 |
| 12 playable assessments and 47 questions; 21 candidates, 12 employers, 21 roles | `README.md` seed section; `prisma/` |
| Separate flows; role card before feed; 1–3 exact assessment requirements; below-bar visible; no ranking; mutual match; 5/10 Like caps; one Priority intro; discovery opt-in; honest outcomes | `README.md` product rules; `src/lib` |
| Advisory evidence reading with citations, open questions and deterministic fallback; no live capture | `SUBMISSION-NOTES.md`, `README.md`, 15 Nov 2026 |
| Deployed demo and `/api/health` ok; deployed UI and reading checks passed | Live check and `README.md`, 15 Nov 2026 |

## Gaps to close before submitting

- [ ] Confirm the exact challenge option label on the Junction platform (signed-in form).
- [ ] Confirm where the deck/video goes on the form (upload vs link).
- [ ] Fill the video link after the Remotion export.
- [ ] Decide whether to enter the NVIDIA side challenge. Do not describe the reading as a live Nemotron run unless a real capture is registered in `LIVE_EVIDENCE`.
- [ ] Re-check that the demo and repo links open logged out.

The deck contains no email addresses, phone numbers, keys or real candidate data. Speaker notes are in the PPTX; the PDF is a fixed rendering.
