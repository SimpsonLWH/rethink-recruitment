# Product

## Register

product

Rivet is primarily an authenticated product UI for interviewers. The public landing page and `/how-it-works` set the voice and explain the CV problem; the pre-screen desk is where the work happens. The candidate side exists to produce the evidence the interviewer checks.

## Users

Two sides of one hiring event, with the interviewer as the primary user.

- **Interviewers and hiring teams**, usually small public-sector, civic and product teams, who have a stated bar, a short window and no appetite for reading AI-polished CVs or trusting an AI score.
- **Candidates at Junction 2026 in Espoo**: early-career and career-changing people who can do the work but do not want to win a CV-writing contest.

The interviewer is in a task when using the product: read one record, check the claims, ask the open questions, and record a decision with a reason. The candidate is in a task too: find a role whose bar fits, take one work sample, and keep the artifacts that show what they did.

## Product Purpose

Remove the AI-versus-AI loop from early hiring. A CV is now written with AI and read with AI, so it rewards fluency and vocabulary rather than work. Rivet replaces the CV scan with a short, checkable record:

1. A role card states the assessment bar, the signals that matter and one conversation criterion.
2. A candidate takes one versioned work sample and keeps structured claims with artifacts.
3. The interviewer sees the work sample question by question, checks each claim against its artifact, leaves the rest for the conversation, and gets a time-boxed question kit.
4. The interviewer rates the stated criteria, writes why, and records the decision. The audit trail keeps who, when and the basis.

The product never guesses whether a document was written by AI, never keyword-scores a CV, never produces a person score, never ranks candidates and never auto-rejects. A below-bar score stays visible as context, not a verdict.

## Product Promises

- **The bar comes before the people.** The screening plan is set from the role card before anyone is reviewed, and the reviewer can edit it. Every save creates a new plan version.
- **Prose is not evidence.** A claim is labelled checked, artifact-only, for conversation, still prose, or context. A working link proves a link worked, not that the claim is true.
- **The work sample is exact.** One versioned assessment, one stated bar, one sitting per cycle. A result is never averaged with another version.
- **The decision belongs to a person.** Rating the criteria, writing a reason and confirming the decision are all required. No model records the decision.
- **A conversation, not an interrogation.** The kit asks about the work behind the score and the claims without an artifact. It includes a listen-for and a follow-up so two interviewers can compare notes.
- **No silent bin and no automatic rejection.** Candidates below the bar stay in the queue with their evidence. Open packets past the role's reply target stay visible with a warning. A decline is internal by default; the reviewer can explicitly send one short, honest candidate outcome, and only then is a message recorded.
- **The record is auditable.** Every claim check, note, decision and reopen appends an event with an author and a time. A recorded decision freezes the criteria it was made against, and the packet can be exported as a JSON audit record.
- **The candidate can see what is checked.** A candidate evidence record shows the work samples, claims, artifacts and the context/claim distinction. It does not expose internal reviewer notes or decisions.
- **More than one reviewer can share the record.** The demo has two Northwind accounts. A packet can be assigned to one reviewer, but either can still act. Notes, claim checks and decisions keep the reviewer name, so a second reader can add evidence without erasing the first.

## Brand Personality

Civic restraint. Specific, calm, honest. Editorial where a human voice belongs, plain where the tool belongs. Confident enough to leave things out. The Junction/Espoo setting is real context, not decoration.

Voice rules:
- Short, concrete sentences. Name the thing. No hedging stacked on hedging.
- Say each thing once, closest to where it matters.
- Call it a claim, a check, a record, an artifact, a conversation kit or a decision. Never a verdict, a suitability score, a ranking or a recommendation.
- Keep the product promises exact: no AI detector, no CV keyword scan, no person score, no auto-reject.
- No dev jargon, database terms or enum tokens in user-facing copy.

## Anti-references

- Generic SaaS dashboard: uniform white cards, pill buttons everywhere, an uppercase eyebrow above every heading, stacked disclaimers.
- AI-slop styling: gradient text, glassmorphism, purple, decorative motion, fake-precise metrics.
- CV-screening theatre: a "match percentage", a keyword heat map, an "AI-written" probability, a candidate score out of 100.
- An AI panel that implies a verdict or a recommendation. The kit prepares the conversation; a human decides.
- Ranking, score dashboards, leaderboards and "top candidate" language.
- Detection as discipline: punishing a candidate for using a writing tool instead of checking the work.

## Design Principles

1. **One accent.** Green is for primary actions, current selection, true highlights and a verified state. Everything else is neutral paper, ink and line. Amber means open or for conversation; rose means below the stated bar.
2. **Type does the hierarchy.** One sans for UI headings, labels, stats and tool content. Serif only for person and company names, pull quotes, empty-state headlines and the public landing surface.
3. **Say it once.** Remove copy that restates the heading or repeats a promise already nearby. Keep the meaning, cut the echo.
4. **Cards earn their chrome.** Prefer spacing, dividers and one surface over nested boxes and chip soup.
5. **The decision is visible.** On mobile, the decision panel appears before the long record. On desktop, it sits beside it. The reviewer should never hunt for the action.
6. **Keep the promises visible.** Trimming copy must never remove consent, interest, non-ranking or the human-decision semantics.

## Accessibility & Inclusion

WCAG 2.1 AA baseline: body text at least 4.5:1 against its background, visible focus rings for every interactive control, keyboard access to all actions, dialogs that manage focus and close on Escape, and reduced-motion support. Small-screen layouts must not clip content or hide actions behind fixed bars. Touch targets stay at least 40px on small screens.

The pre-screen also follows a fairness baseline:
- no name, photo, location, nationality, language, education or inferred protected trait in the screening plan or evidence evaluation;
- no AI text detection, since it is unreliable and easy to weaponise;
- no automatic rejection, and a visible below-bar path with a named review owner;
- no single person score, so a reviewer cannot sort by a number that hides its basis.
