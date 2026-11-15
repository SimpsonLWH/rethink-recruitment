---
version: alpha
name: Rivet
description: Interviewer-first pre-screening with an assessment-platform look (15 Nov 2026). Navy chrome, cool grey canvas, one green accent, Inter everywhere, small radii.
colors:
  paper: "#F3F6F8"
  surface: "#FFFFFF"
  navy: "#0E141E"
  navy-soft: "#1A2433"
  ink: "#0E141E"
  ink-soft: "#39424E"
  ink-muted: "#4F5D6B"
  ink-faint: "#5E6C79"
  line: "#DCE3E8"
  line-strong: "#C1CBD3"
  accent: "#16833F"
  accent-deep: "#0F6630"
  accent-bright: "#2EC866"
  accent-tint: "#EEF9F2"
  success: "#047857"
  warning: "#B45309"
  danger: "#BE123C"
typography:
  display:
    fontFamily: "Fraunces Variable, Iowan Old Style, Georgia, serif"
    usage: "Person and company names, pull quotes, empty-state headlines, public landing page"
  sans:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    usage: "All app UI headings, body, labels, buttons, stats, eyebrows/meta labels"
  scale:
    page-title: "clamp(1.55rem, 2.5vw, 2.1rem) / 1.12, weight 600"
    section-title: "18-22px / 1.2, weight 600"
    card-title: "16-18px / 1.25, weight 600"
    body: "13-15px / 1.55"
    meta: "11-12px / 1.5"
    label: "10-11px uppercase, tracking 0.14em, weight 600"
rounded:
  control: "9999px for pills and icon buttons"
  card: "12-20px"
  panel: "22-26px"
spacing:
  page-gutter: "16px mobile / 24px tablet / 40px desktop"
  content-column: "1120px app shell, 920px feed card, 3xl copy column"
components:
  - name: PageHeader
    note: "Title plus optional description and action. No eyebrow that restates the H1; context that matters belongs in the description or a plain meta line."
  - name: EvidenceStatus
    note: "Click/keyboard-triggered popover with collision-aware placement (fixed, portal), solid surface, focus moved into it, Escape and outside click close, focus returns to trigger. Inline expansion below 640px."
  - name: EvidenceReading
    note: "Advisory dialog opened from the employer review card. Neutral surface, engine label (Nemotron live/cached or deterministic demo mode), cited facts in a details block, open questions and conversation questions. Never a score or recommendation. Scrollable body with a fixed caveat footer."
  - name: Note
    note: "Neutral information callout: border-line, paper background, no rose tint."
  - name: DecisionActions
    note: "Fixed action bar. Like is the only primary maroon action; pass and Priority intro are secondary. Keyboard hints use kbd styling with readable contrast."
  - name: EmptyState
    note: "Dashed neutral frame, serif headline allowed as an editorial moment."
  - name: ScreeningQueue
    note: "Event-ordered list, never score-ordered. Each row shows the record's evidence state, run status, must-have coverage, open checks and waiting time. Open packets past the role's reply target show an amber marker. Filters are All / Needs checking / Ready to discuss / Decided."
  - name: ClaimCheck
    note: "A claim card with provenance, artifact status and four explicit checks: checked, artifact only, for conversation, not checkable. A note field records what was opened. Preference and availability facts are context, not checks."
  - name: DecisionLog
    note: "Filterable by outcome. Each row shows the candidate, role, outcome, reason, basis, author, time-to-decision and export. It is an audit surface, never a leaderboard; no candidate ranking or score."
  - name: DecisionPanel
    note: "Sticky/sidebar panel, first in the mobile reading order. Open state: one primary 'Record a decision'. Decided state: reason, basis, reviewer, time, outcome status, reopen. The dialog has a criterion scorecard, three outcomes, a required reason, an optional 'send a short outcome' tick on decline, and a confirmation checkbox."
  - name: PlanEditor
    note: "Dialog over the role queue. Criteria can be relabelled, re-kinded, re-scoped or added up to seven. Changing the plan affects future pre-screens; recorded decisions keep their written basis."
  - name: ConversationKit
    note: "Time-boxed agenda plus numbered questions, listen-fors and follow-ups generated deterministically from open criteria and unchecked claims. Copyable. No model decision."
  - name: WorkSampleBreakdown
    note: "Assessment score plus per-question passed/total checks. Full pass is green, partial amber, zero rose. Never exposes hidden test data. The seeded per-question marks are labelled synthetic."
  - name: PlanVersion
    note: "Plan vN is shown on the role queue and the packet. A decided packet uses its frozen plan snapshot and warns when the role plan has moved to a newer version."
---

# Design System

> **15 November 2026 update — assessment-platform look.** The app now follows the visual language of coding-assessment platforms: a navy (`#0E141E`) top navigation bar with a green underline on the active item, a cool grey canvas, white cards with 8–12px radii, square-cornered (6px) buttons, Inter for every heading and body, and one green accent. `#16833F` carries white text at 4.8:1; the brighter `#2EC866` is for fills, bars and highlights on navy only. Difficulty is shown as text colour (Easy emerald, Medium amber, Hard rose). The OA runner is a full-screen split workspace with a navy header (question navigator, timer, **Submit test**). Where the sections below mention the maroon accent, Fraunces or 20–26px panels, the tokens above supersede them; the content rules (no restating eyebrows, neutral callouts, semantic evidence colours) still apply. This borrows the genre's look only, never another product's name, logo or assets.

## Theme

Warm paper and near-black ink with a single maroon accent. No gradients, no glass, no decorative glow. The public landing page may use larger serif display type; the app stays quiet and legible.

## Color

- `accent` (#A64056) and `accent-deep` (#7C2C3F): primary buttons, active nav, current selection, genuine highlights, and the Priority intro signal.
- `accent-tint` / `accent-soft`: only for the Priority intro action and brand-marked moments, never for generic information or warnings.
- Neutral callouts: `surface` or `paper` with a `line` border. If something needs attention, use the semantic success/warning/danger text colours, not a pink surface.
- Evidence status keeps its semantic colours: emerald met, amber not taken, rose below bar, neutral no requirement.

## Typography

One rule everywhere: **sans for the interface, serif for human voices.**

- Sans: all H1/H2/H3 on app pages, page titles, section headings, stat values, labels, buttons, form text, empty-state body.
- Serif: candidate and company names, pull quotes, empty-state headlines, the public landing page.
- Stats are sans and use tabular numerals where alignment matters.
- Labels are small, uppercase and tracked consistently (10-11px, 0.14em), and must not repeat the heading they sit above.

## Layout

- Content max width: app shell 1120px; feed card 920px (candidate) / 860px (recruiter); prose 65-75ch.
- Single-item pages get a constrained column, a deliberate header area and a section heading above the content so the item is anchored rather than floating.
- Grids stretch rows to equal height; avoid a lone orphan card.
- No nested card inside a card. Use dividers, spacing or a single surface.

## Components

- Buttons: pill radius, one primary per view.
- Cards: 1px line border, no heavy shadow; shadow only on floating layers and dialogs.
- Popovers: portal + fixed positioning, solid background, z-index above the fixed action bar (40) and below modals (50).
- Focus: one visible ring (`2px accent/60` with a 2px paper offset) from the global `focus-visible` rule. No component redefines a second ring.
- Motion: 150-250ms state transitions only. Respect `prefers-reduced-motion`.

## Content

Short, specific copy. Say each thing once. Human labels for statuses and enum values. No database, implementation or internal-tool language. Keep the consent and ranking promises intact wherever a duplicate is removed.

The evidence reading says "reading", "record", "covered", "open questions" and "questions for the conversation". It never says "analysis", "insight", "verdict", "best", "ranked" or "recommend".


## Pre-screen surface (15 November 2026)

The pre-screen is the primary product surface. It adds three screens and a small set of shared components without new colour or type tokens.

- **Desk (`/prescreen`)**: navy three-step explainer, four evidence counts, one card per live role, recent decisions. No candidate ranking or leaderboard.
- **Queue (`/prescreen/[roleId]`)**: role header with the stated bar, the screening plan with an Edit action, and an event-ordered screening queue. Below-bar candidates stay in the queue with a neutral explanation.
- **Packet (`/prescreen/[roleId]/[candidateId]`)**: candidate header, work-sample strip, brief, criterion rows, claim ledger, notes, audit trail, decision panel and conversation kit. On desktop the decision and kit sit in a 350px right rail; on mobile the decision comes first, then the record, then the kit.

Component rules:

- **Evidence state** uses semantic colour: green `Evidenced` / `Checked`, amber `Partly` / `Artifact only` / `For conversation`, rose `Below bar`, neutral `Still prose` / `Context` / `Not assessed`. Rose is never used for generic information.
- **Claim rows** keep provenance, link reachability and the human check separate. A failing link is a fact about the link, not the person; the UI says so in the check note.
- **Decision dialog** is a form, not a wizard. It shows every criterion with its evidence line, four ratings, three outcomes with their consequences, a reason and a human confirmation. Save is disabled only by busy/validation, never by a model.
- **Plan editor** is a single scrollable dialog; criteria keep their order and kind. The copy says the plan affects future pre-screens and recorded decisions keep their written basis.
- **Mobile order** is deliberate: header, decision, brief, criteria, claims, notes, audit, kit. A fixed bottom nav must never cover the decision action.
- **Print/copy/export**: the kit is copyable, the packet has a print action, and the record exports as JSON. Print removes navigation, action bars and interactive controls.

Copy vocabulary for this surface: claim, check, artifact, record, open item, must-have, nice-to-have, conversation, decision, basis, audit event. Avoid: AI-written, detected, verdict, recommendation, suitability, match percentage, rank, top candidate.
