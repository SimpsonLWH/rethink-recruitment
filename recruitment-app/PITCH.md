# Rivet — pitch notes for City of Espoo

**Synthetic demo. Not a legal-compliance claim. D10 and D1 remain open.**

## The problem

Recruiters arrive with vague or late requirements. Candidates arrive with AI-polished CVs. Organisers get volume, not signal. Rivet now opens with **two separate product flows** — one for candidates, one for hiring teams — and puts two things before the swipe: a short role-relevant assessment from the candidate, and an explicit statement of need from the employer.

## The demo in one loop

1. **Choose a side.** `/enter` has separate candidate and hiring doors, sample accounts, and temporary account creation.
2. **Candidate onboarding.** Upload a CV or choose a synthetic sample. The CV is context only; the demo does not screen it automatically. The candidate lands on a dashboard with evidence, invitations and updates.
3. **Employer states need.** A role card names one to three exact assessment versions, a score for each, and the experience signals that matter. This happens before the event feed.
4. **Candidate shows evidence.** Aino solves a short online assessment: a few JavaScript problems marked against hidden tests on the server. Her final score is recorded against JavaScript Data handling or Algorithms Advanced; it is not averaged with anything else, and she gets one sitting per recruiting cycle.
5. **Both sides see evidence.** The mixed feed shows the score against the employer's bar and the matching experience. Below-bar candidates stay visible in a secondary view. There is no match percentage. On the employer review card, **Read the evidence** opens an advisory reading that cites the record, names open questions and suggests conversation questions; it never scores or decides.
6. **Interest is limited and honest.** Five Likes for a candidate, ten for an employer, one Priority intro per side. A Priority intro has a reason; ordinary Likes stay hidden until mutual.
7. **Discovery is consented.** An employer can invite an opted-in non-swiper. The invitation cites the assessment they completed. It is a message, not an application, booking or match.
8. **A human decides.** A match needs two explicit yeses. Closing a match sends an after-conversation outcome; a pass never claims a review that did not happen.
9. **Next steps are simple.** Intro call → event-day meeting → interview → closed. Not an ATS.

## Clear flows reduce noise

- Candidates cannot accidentally wander into a hiring dashboard; each side has its own onboarding, home and navigation.
- A candidate's CV is not a screening input. The role card's assessment bar is the evidence contract.
- A recruiter must state the assessment and score before browsing; they cannot fall back to a generic CV pile.
- A hiring team can require more than one assessment, each with its own score, so the bar reflects the role rather than one generic test.
- Invitations and outcomes are explicit; silence and fake review language are designed out.

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
- Discovery is opt-in. The onboarding CV is stored as file metadata only; there is no CV parser or automated screening. No protected-characteristic inference and no proctoring claim.
- Synthetic data only; deterministic assessment scoring. The evidence reading is advisory: it cannot change the bar, feed order, decision, match or outcome, and it cites only source facts. It is not used for assessment, matching, thresholds or outcomes. The other AI surfaces remain optional.
- Feasibility: built on the existing Rivet app, no new platform, no keys, no paid resources.

## Demo script for judges

1. Open `/enter` and show the two separate doors: **candidate** and **hiring team**, plus sample accounts and temporary sign-up.
2. Use the candidate sample account → dashboard → show CV status, evidence, invitations and updates.
3. Create a temporary candidate account → upload a CV (or choose a sample) → dashboard.
4. Open assessments → show the final-score state on JavaScript Data handling and take Algorithms Problem solving.
5. Discover → show evidence on every card and the Like/Priority counts.
6. Invitations → accept Saari's invitation; no automatic match.
7. Return to `/enter` → use the recruiter sample account → dashboard.
8. Role cards / hiring setup → show multiple assessment requirements and scores.
9. Review candidates → point out evidence, the mixed feed, and the below-bar/no-evidence sections.
10. **Read the evidence** → show the deterministic reading, its citations and open questions; explain that the bar and decision are unchanged.
11. Discovery lane → open an invitation; read the message-only line.
12. Switch to Saari → say yes to match → move the stage and close; show the outcome.
13. Updates → show the seeded pass outcome and the absence of a fabricated review.

## What we are not claiming

- The assessments are not validated instruments and are not proctored.
- The one-attempt rule, hidden-test marker, Like caps and feed ratios are demo defaults, not calibrated policy. The marker is a Node vm, not a production code sandbox.
- This is not legal advice or EU AI Act compliance.
- No real personal data, authentication, payments or messaging transport exists. The public demo is synthetic and not production infrastructure.
- The human-review route is a design proposal pending mentor confirmation (D1).
- No live model output or model-quality claim is made. The reading has a deterministic fallback; a live Nemotron run requires a key and a captured artifact.
- Yath's sign-off on the pivot/PRD is still required (D10).
