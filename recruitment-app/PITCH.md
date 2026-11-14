# Rivet — pitch notes for City of Espoo

**Synthetic demo. Not a legal-compliance claim. D10 and D1 remain open.**

## The problem

Recruiters arrive with vague or late requirements. Candidates arrive with AI-polished CVs. Organisers get volume, not signal. Rivet puts two things before the swipe: a short role-relevant assessment from the candidate, and an explicit statement of need from the employer.

## The demo in one loop

1. **Employer states need.** A role card names one exact assessment version, a required score, and the experience signals that matter. This happens before the event feed.
2. **Candidate shows evidence.** Aino takes a random-pool assessment. Her result is recorded against Backend design v1 Advanced or Algorithms v1 Medium; it is not averaged with anything else.
3. **Both sides see evidence.** The mixed feed shows the score against the employer's bar and the matching experience. Below-bar candidates stay visible in a secondary view. There is no match percentage.
4. **Interest is limited and honest.** Five Likes for a candidate, ten for an employer, one Priority intro per side. A Priority intro has a reason; ordinary Likes stay hidden until mutual.
5. **Discovery is consented.** An employer can invite an opted-in non-swiper. The invitation cites the assessment they completed. It is a message, not an application, booking or match.
6. **A human decides.** A match needs two explicit yeses. Closing a match sends an after-conversation outcome; a pass never claims a review that did not happen.
7. **Next steps are simple.** Intro call → event-day meeting → interview → closed. Not an ATS.

## Why it maps to the judging criteria

### Impact & Relevance (45%)

- Every introduction is backed by visible evidence: exact assessment family, version, difficulty, score against the employer's own bar, plus relevant experience/projects.
- Employer need capture happens before the event, not after the first CV pile.
- Recruiter discovery finds strong-fit people who have not found the company yet.
- Candidate updates avoid silence and avoid fake "reviewed" language.

### Innovation & UX (35%)

- The familiar mutual-swipe loop is retained; no training is required to understand Pass, Like or a match.
- Role cards make the employer's threshold explicit and editable.
- Assessment evidence is glanceable, and the below-bar view keeps the human decision visible.
- A candidate can accept an invitation without being forced into an application or a meeting.

### Responsible & Feasible Execution (20%)

- The system filters and presents; humans decide. No automatic rejection, no universal person score, no score-based ranking.
- Below-bar candidates remain visible with a named review owner and a 48h expectation. The formal alternative-evidence route is D1-gated and not overclaimed.
- Discovery is opt-in. No CV parsing, no file upload, no protected-characteristic inference, no proctoring claim.
- Synthetic data only; deterministic assessment scoring; optional AI is not used for assessment, matching, thresholds or outcomes.
- Feasibility: built on the existing Rivet app, no new platform, no keys, no paid resources.

## Demo script for judges

1. Open `/enter`, choose Northwind Labs.
2. Role cards → show the exact bar and signals.
3. Review candidates → point out evidence, the mixed feed, and the below-bar/no-evidence sections.
4. Discovery lane → open an invitation; read the message-only line.
5. Switch to Aino → Assessments → show the cooldown and take Algorithms.
6. Discover → show evidence on every card and the Like/Priority counts.
7. Invitations → accept Saari's invitation; no automatic match.
8. Switch to Saari → say yes to match.
9. Matches → move the stage and close; show the outcome.
10. Updates → show the seeded pass outcome and the absence of a fabricated review.

## What we are not claiming

- The assessments are not validated instruments and are not proctored.
- The random pool, cooldown, Like caps and feed ratios are demo defaults, not calibrated policy.
- This is not legal advice or EU AI Act compliance.
- No real personal data, authentication, payments, messaging transport or deployment exists.
- The human-review route is a design proposal pending mentor confirmation (D1).
- Yath's sign-off on the pivot/PRD is still required (D10).
