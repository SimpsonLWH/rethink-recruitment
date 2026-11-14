---
version: alpha
name: Rivet
description: Evidence-first, two-sided hiring for a civic career event. Warm paper, one maroon accent, editorial serif for human moments and a single sans for the tool.
colors:
  paper: "#F7F5F0"
  surface: "#FFFFFF"
  ink: "#171717"
  ink-soft: "#3D3D3D"
  ink-muted: "#5E5E5E"
  ink-faint: "#6B6B6B"
  line: "#E4E0D8"
  line-strong: "#CFC9BD"
  accent: "#A64056"
  accent-deep: "#7C2C3F"
  accent-tint: "#FDF1F4"
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
  - name: Note
    note: "Neutral information callout: border-line, paper background, no rose tint."
  - name: DecisionActions
    note: "Fixed action bar. Like is the only primary maroon action; pass and Priority intro are secondary. Keyboard hints use kbd styling with readable contrast."
  - name: EmptyState
    note: "Dashed neutral frame, serif headline allowed as an editorial moment."
---

# Design System

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
