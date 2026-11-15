# Rivet — pitch notes for City of Espoo

**Synthetic demo. Not a legal-compliance claim. D10 and D1 remain open.**

## The problem

A candidate uses AI to make a CV sound right. A hiring team uses AI to guess whether it is. Both sides are optimising the same document, and the person who can do the work disappears from it. Keyword filters reward vocabulary. Polished prose compresses the differences between people. A score with no artifact, author or reason is impossible to review.

## The product

Rivet is the interviewer's pre-screen for the AI-CV era.

1. **A stated bar becomes a screening plan.** The role card names one to three exact assessment bars and the signals that matter. The plan adds must-haves, nice-to-haves and one conversation criterion. The plan is visible before anyone is reviewed and can be edited.
2. **A versioned work sample replaces the CV scan.** Candidates take one short assessment: coding problems marked against hidden tests, or choice/numeric questions marked against hidden answer keys. One sitting per cycle. The result is tied to the exact family, version and difficulty.
3. **Claims carry their evidence.** The candidate record keeps artifacts and dates. Each claim is *checked*, *artifact only*, *for conversation*, *still prose* or *context*. Preference and availability facts are not treated as claims. A working link proves a link worked, not that the claim is true.
4. **The interviewer gets a kit.** The conversation kit is built from open criteria and unchecked claims, with a listen-for and follow-up, inside a time box.
5. **A human decides.** The interviewer rates the stated criteria, writes a reason, confirms the decision, and the audit trail keeps who, when and why. No model records the decision. No automatic rejection.
6. **No detection theatre.** Rivet does not guess whether a document was written by AI. It removes the need for the guess by putting verified work and checkable claims in front of the reviewer.

## The demo in six minutes

1. Open `/enter`. Start with the **pre-screen demo**.
2. `/prescreen` → Northwind Labs has two role queues and recent decisions with authors and reasons.
3. Open **Product Engineer** → show the stated bar, the screening plan, and the event-ordered queue. Point out that below-bar candidates remain in the queue. Open **Edit plan** to show the plan is owned by the interviewer.
4. Open **Aino Vikström** → show the work sample (80/100 vs bar 70), the brief, the criterion rows, the claim ledger, notes and audit trail. Mark one claim **Checked**. Add a note.
5. Open **Record a decision** → rate the criteria, choose *Move to interview*, write a reason, confirm. Show the decision now says *Moved to interview*, with the basis, reviewer and time.
6. Open the **conversation kit** → show the agenda, the question about the claim without an artifact, the listen-for and follow-up. Copy it.
7. Switch to the candidate side → show that a CV is optional, open **Your evidence record**, and point to the work samples, claims and artifacts rather than a CV score.
8. Close on the promise: no CV keyword scan, no AI detector, no person score, no ranking, no auto-reject. A decision with a name and a reason.

## Why it maps to the judging criteria

### Impact & Relevance (45%)

- Removes the AI-versus-AI loop at the earliest, highest-volume stage: the pre-screen.
- Every candidate is reviewed against a bar that was stated before the review, not a generic CV pile.
- Below-bar candidates stay visible with a named review owner and a 48h expectation.
- The artifact and decision trail makes the process reviewable and improvable. Silence and fake "reviewed" language are designed out.
- Works for public-sector and civic teams: short, auditable, no enterprise sales motion.

### Innovation & UX (35%)

- The key move is refusing the detector and the CV score. The product replaces them with a checkable record, not a better scanner.
- The claim ledger turns prose into a reviewer task with a clear state. "Artifact only" is a first-class state.
- The conversation kit is generated from what is still open, so the interview starts where the record stops.
- The plan editor makes the criteria an object the team owns, not a hidden model.
- The decision screen is a scorecard plus a reason, not a thumbs up or down. No training required.

### Responsible & Feasible Execution (20%)

- No automatic rejection; no single person score; no score-based ranking.
- No AI text detection, no protected-characteristic inference, no CV parser, no keyword filter.
- Claims, provenance and link reachability are kept separate. A failing link is a fact about the link, not the person.
- Synthetic data only; deterministic assessment scoring; deterministic kit; the existing AI reading remains advisory and separate.
- Feasibility: one Next.js app, no new platform, no keys, no paid resources.

## Honest limits

- Assessment validation, legal compliance and bias elimination are not claimed. The problems are illustrative and unvalidated.
- Proctoring is browser-event logging; lockdown is a fullscreen/clipboard deterrent, not a secure exam browser.
- Employer confirmations are simulated seed data, not real employment verification.
- The pre-screen decision is internal. It does not create a match or send an outcome automatically.
- The deployed demo uses an ephemeral SQLite store. It is a synthetic demo, not production infrastructure.
- D1 (human-review route) and D10 (Yath sign-off) remain external.

## One-line close

**A model writes the CV. Another model reads it. Rivet puts the work in front of a person instead.**
