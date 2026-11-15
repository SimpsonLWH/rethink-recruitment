# Rivet — exact Junction form values

Snapshot: 2026-11-15 09:18 EET. Form: Junction 2026 — Project Submission. Track: **Rethinking Recruitment**.

| Field | Value | Limit |
|---|---|---|
| Project Name * | Rivet | 5 / 30 |
| Punchline * | (see below) | 185 / 200 |
| Description * | (see below) | 3937 / 5000 |
| Challenge Picker * | Rethinking Recruitment | required |
| Project Demo | https://rethink-recruitment.vercel.app/enter | optional |
| Source Code | https://github.com/SimpsonLWH/rethink-recruitment | optional |
| Video | leave blank, or add the recorded demo link | optional |
| Other Link | https://rethink-recruitment.vercel.app/how-it-works | optional |
| Presentation | upload `submission-draft/rivet/rivet-deck.pdf` | PDF, max 20 MB; 320 KB |
| Tech Challenge Participation | leave unselected — no live Nemotron capture exists | optional |
| Status | Save Draft, verify, Submit Final before 10:00 | required by deadline |

## Punchline (185/200)

Evidence first, then decide: a two-sided hiring loop where candidates prove capability against a role's exact bar, teams see that evidence before they swipe, and two yeses make a match.

## Description (3937/5000, markdown supported)

**Rivet makes the role's bar the contract.** It is a two-sided recruitment-event prototype for Junction 2026 and the City of Espoo "Rethinking Recruitment" challenge. Candidates show recorded, role-relevant evidence; hiring teams state the bar before they browse; a match needs two explicit yeses. The demo is synthetic and needs no keys.

## The problem

Recruitment events optimise for volume. Candidates arrive with polished CVs. Hiring teams arrive with vague or late requirements. The result is a pile of profiles, not a shared definition of evidence.

## What Rivet does

**Candidates.** Separate onboarding for candidates and hiring teams. A candidate can upload a CV as context (never parsed or auto-screened), then see roles that state the exact assessment versions and scores they ask for. The demo has 12 playable assessments and 47 questions across JavaScript, Algorithms and Quant: coding, multiple-choice and numeric questions, marked on the server against hidden tests and answer keys. A candidate gets one sitting per assessment per recruiting cycle; the final score is not averaged. Prepare is practice and never counts as evidence. A below-bar result stays visible in a secondary view.

**Hiring teams.** The employer states the role and one to three exact assessment requirements, each with its own score, plus structured signals, before the feed exists. The mixed feed shows the bar, the assessment evidence and the signal evidence; below-bar and no-evidence candidates remain visible with a named review owner. There is no ranking, no match percentage and no auto-rejection. Discovery invitations go only to opted-in candidates and are messages, not applications. A match requires two explicit yeses.

## The evidence reading

The employer review card offers **Read the evidence**: an advisory reading of the record against the stated bar, with source citations, open questions and suggested conversation questions. It cannot change the bar, feed order, decision, match or outcome, and ranking/decision language is rejected by the validator. With no key the app shows a deterministic reading labelled "demo mode". With NVIDIA_API_KEY configured it can use Nemotron 3.5 Super VL and is labelled live or cached. No live model call, capture or quality claim exists in this checkout.

## What is built

Separate candidate and hiring flows; temporary accounts and three sample logins; CV onboarding; 12 assessments and 47 questions; timers and two integrity modes (proctored and browser lockdown) that record browser events without camera or keystrokes; a Prepare hub; role cards with multiple assessment bars; a mixed feed with evidence badges and below-bar views; Like and Priority limits; opt-in discovery; message-only invitations; match stages and state-derived outcomes; an advisory evidence reading with a deterministic fallback.

## Verification

148 unit tests across 21 files; typecheck, lint and production build clean; browser smoke passed; 32 UI assertions at 1440, 390 and 320px; 29 screens captured; deployed UI and reading checks passed; /api/health ok. The synthetic seed has 21 candidates, 12 employers, 21 roles, 12 assessments, 47 questions and 3 sample accounts.

## Limits

Everything is synthetic. The assessments are illustrative, not validated instruments. Proctoring is a browser-event deterrent, not a secure exam browser or identity check. This is not legal or EU AI Act compliance advice. It is a demo, not production infrastructure: demo auth, per-instance writes on Vercel and no real messaging, payment or file storage. No bias-elimination guarantee; the design is an intent under review. No live model output or model-quality claim exists here.

**Try it:** https://rethink-recruitment.vercel.app/enter — candidate and hiring demo buttons, no account needed.
**Code:** https://github.com/SimpsonLWH/rethink-recruitment
**How it works:** https://rethink-recruitment.vercel.app/how-it-works

## Presentation upload

Use the 10-slide PDF: `submission-draft/rivet/rivet-deck.pdf` (320 KB, under the 20 MB limit). The PPTX is the editable source and is also under the limit if the form prefers PowerPoint.

## Do not claim

Do not select NVIDIA Tech Challenge Participation unless a real, authorised live capture is registered in `LIVE_EVIDENCE`. The reading in this checkout is the deterministic fallback, labelled demo mode.
