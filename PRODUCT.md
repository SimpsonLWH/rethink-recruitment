# Product

## Register

product

Rivet is primarily an authenticated product UI. The public landing page and `/how-it-works` are a small brand surface that sets the voice; the app is where the work happens.

## Users

Two sides of one hiring event.

- Candidates at Junction 2026 in Espoo: early-career and career-changing people who can provide concrete evidence, not a polished CV.
- Hiring teams, mostly small public-sector, civic and product teams, who state one exact assessment bar and the signals they care about.

They are in a task when they use the app: review a role, sit an assessment, respond to an invitation, open a match conversation, or write a role card. The interface should disappear into that task.

## Product Purpose

Make evidence-first, two-sided matching legible. A candidate sees the exact assessment version and score a team asks for; a hiring team sees evidence against its stated bar. A match requires both sides to say yes. Nothing is ranked, auto-rejected or reduced to a match percentage. Discovery invitations are messages, not applications. Outcomes reflect what actually happened.

The demo is synthetic and honest about it. Success means a first-time visitor can complete either side's core path without explanation and without seeing a promise contradicted by the UI.

## Brand Personality

Civic restraint. Specific, calm, honest. Editorial where a human voice belongs, plain where the tool belongs. Confident enough to leave things out. The Junction/Espoo setting is real context, not decoration.

Voice rules:
- Short, concrete sentences. Name the thing. No hedging stacked on hedging.
- Say each thing once, closest to where it matters.
- Keep the product promises exactly: interest, never a suitability score; no ranking; no auto-reject; accepting records your yes.
- No dev jargon, database terms or enum tokens in user-facing copy.

## Anti-references

- Generic SaaS dashboard: uniform white cards, pill buttons everywhere, an uppercase eyebrow above every heading, stacked disclaimers.
- AI-slop styling: gradient text, glassmorphism, purple, decorative motion, fake-precise metrics.
- Pink/rose-tinted callouts used for neutral information. Rose is the brand and primary-action colour, not a warning surface.
- A type lottery: serif and sans headings mixed page to page, serif stat values beside sans ones.
- Ranking, score dashboards and match percentages. The product explicitly rejects them.

## Design Principles

1. One accent. The maroon is for primary actions, current selection and true highlights. Everything else is neutral paper, ink and line.
2. Type does the hierarchy. One sans for UI headings, labels and stats. Serif only for person and company names, pull quotes, empty-state headlines and the public landing surface.
3. Say it once. Remove copy that restates the heading or repeats a promise already nearby. Keep the meaning, cut the echo.
4. Cards earn their chrome. Prefer spacing, dividers and one surface over nested boxes and chip soup.
5. Keep the promises visible. Trimming copy must never remove consent, interest or ranking semantics.

## Accessibility & Inclusion

WCAG 2.1 AA baseline: body text at least 4.5:1 against its background, visible focus rings for every interactive control, keyboard access to all actions, popovers that manage focus and close on Escape, and reduced-motion support. Small-screen layouts must not clip content or hide actions behind fixed bars. Touch targets stay at least 40px.
