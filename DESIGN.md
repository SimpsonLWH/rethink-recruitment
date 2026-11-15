---
version: alpha
name: Rivet
description: Evidence-first, two-sided hiring for a civic career event. Warm paper, one maroon accent, editorial serif for human moments and a single sans for the tool.
colors:
  paper: "#F7F5F0"
  surface: "#FFFFFF"
  chrome: "#1C1719"
  chrome-soft: "#2A2023"
  ink: "#171717"
  ink-soft: "#3D3D3D"
  ink-muted: "#5E5E5E"
  ink-faint: "#6B6B6B"
  line: "#E4E0D8"
  line-strong: "#CFC9BD"
  accent: "#A64056"
  accent-deep: "#7C2C3F"
  accent-bright: "#E9B4C0"
  accent-soft: "#F6E2E7"
  accent-tint: "#FDF1F4"
  success: "#047857"
  warning: "#B45309"
  danger: "#BE123C"
typography:
  display:
    fontFamily: "Fraunces Variable, Iowan Old Style, Georgia, serif"
    usage: "Public landing page, candidate and company names, pull quotes, empty-state headlines"
  sans:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif"
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
  panel: "24-28px"
spacing:
  page-gutter: "20px mobile / 32px tablet / 40px desktop"
  control-gap: "8px compact / 12px standard / 16px section actions"
  section: "80px mobile / 112px desktop"
components:
  - name: LandingHero
    note: "Two-column editorial hero. Fraunces headline, two equal pill CTAs, and a synthetic evidence record with an 80/100 score against a visible bar of 70. Motion is one-time entrance only."
  - name: LandingSideSwitcher
    note: "Candidate / Hiring team segmented control. A springing active pill and a short crossfade; both panels are real product fragments, not marketing cards. No fake actions."
  - name: LandingQuestions
    note: "One-open accordion for the short interview with the idea. Every answer is a product rule or an honest limit. Height/opacity animation; inactive content is inert."
  - name: PageHeader
    note: "Title plus optional description and action. No eyebrow that restates the H1; context that matters belongs in the description or a plain meta line."
  - name: EvidenceStatus
    note: "Click/keyboard-triggered popover with collision-aware placement (fixed, portal), solid surface, focus moved into it, Escape and outside click close, focus returns to trigger. Inline expansion below 640px."
  - name: EvidenceReading
    note: "Advisory dialog opened from the employer review card. Neutral surface, engine label (Nemotron live/cached or deterministic demo mode), cited facts in a details block, open questions and conversation questions. Never a score or recommendation. Scrollable body with a fixed caveat footer."
  - name: Note
    note: "Neutral information callout: border-line, paper background, no rose tint."
  - name: DecisionActions
    note: "Fixed action bar. Like is the only primary maroon action; pass and Priority intro are secondary pills. Keyboard hints use kbd styling with readable contrast."
  - name: EmptyState
    note: "Dashed neutral frame, serif headline allowed as an editorial moment."
---

# Design System

> **15 November 2026 warm-brand reinstatement.** The assessment-platform work stays: the top-nav app shell, Prepare, quant tests, timers, proctoring and the OA runner are product surfaces. Its HackerRank-adjacent palette does not. The brand is warm paper, one maroon accent, Fraunces for human moments, Inter for the tool, pill controls and 12-28px cards. The visual language now borrows the rhythm of good editorial product sites, not their content, claims or past performance.

## Theme

Warm paper and near-black ink with a single maroon accent. No gradients, no glass, no decorative glow. The public landing page may use larger serif display type; the app stays quiet and legible. The app chrome is warm ink, not navy.

## Color

- `paper` (#F7F5F0) and `surface` (#FFFFFF) are the only large surfaces. Use `paper` for the page and `surface` for cards and raised bands.
- `chrome` (#1C1719) is the app bar and dark product chrome. `accent-bright` (#E9B4C0) is for highlights on chrome only; never use it for text on paper.
- `accent` (#A64056) and `accent-deep` (#7C2C3F) are primary buttons, active nav, current selection, links that need emphasis and the Priority intro signal.
- `accent-tint` / `accent-soft` are only for the Priority intro action and brand-marked moments, never for generic information or warnings.
- Neutral callouts: `surface` or `paper` with a `line` border. If something needs attention, use the semantic success/warning/danger text colours, not a pink surface.
- Evidence status keeps its semantic colours: emerald met, amber not taken, rose below bar, neutral no requirement. These are status semantics, not brand green.
- The public landing page uses no green. The app may show semantic evidence green only where it means “met”.

## Typography

One rule everywhere: **sans for the interface, serif for human voices.**

- Sans (Inter): all app H1/H2/H3, page titles, section headings, stat values, labels, buttons, form text, empty-state body.
- Serif (Fraunces): the public landing page headline and editorial moments, candidate and company names, pull quotes, empty-state headlines.
- Stats are sans and use tabular numerals where alignment matters, except deliberate serif hero/name moments.
- Labels are small, uppercase and tracked consistently (10-11px, 0.14em), and must not repeat the heading they sit above.

## Layout

- Content max width: app shell 1180px; landing 1152px; feed card 920px (candidate) / 860px (recruiter); prose 65-75ch.
- Page gutters: 20px mobile, 32px tablet, 40px desktop. Public headers are 64px tall and align to the same gutters.
- Single-item pages get a constrained column, a deliberate header area and a section heading above the content so the item is anchored rather than floating.
- Grids stretch rows to equal height; avoid a lone orphan card.
- No nested card inside a card. Use dividers, spacing or a single surface.
- Section rhythm on the landing page: 80px on mobile, 112px on desktop. Keep one loud idea per section.

## Components

- Buttons: pill radius. Three heights: 40px compact, 44px standard, 48px large. Touch targets are at least 40px. One primary action per view.
- Inline links: 40px minimum hit area only where they are navigation or a CTA; prose links may stay inline.
- Cards: 1px line border, no heavy shadow; shadow only on floating layers and dialogs. Radius 12-20px for cards, 24-28px for panels and the landing evidence card.
- Inputs: 12px radius, 44px height. Dialog: 28px radius.
- Popovers: portal + fixed positioning, solid background, z-index above the fixed action bar (40) and below modals (50).
- Focus: one visible ring (`2px accent/60` with a 2px paper offset) from the global `focus-visible` rule. No component redefines a second ring.
- Decision bar: three pills at 40px; Like is the only primary. Do not mix square and pill controls in one action row.

## Motion

- App: 150-250ms state transitions only. Respect `prefers-reduced-motion`.
- Public landing: Motion (`motion/react`) is allowed for one-time entrance, in-view reveals, the side-switcher pill and the question accordion. Springs 130-320 stiffness, damping 20-30; stagger at most 70ms. Never loop, auto-play or track the pointer.
- Use transform and opacity only. The accordion may animate height because its content is short.
- `MotionConfig reducedMotion="user"` is required. Every animated block also checks `useReducedMotion` and uses a zero-duration transition. A `<noscript>` fallback must keep Motion-initial content visible.
- Motion is never the only signal. The 80/100 score and 70 bar are readable as text.

## Content

Short, specific copy. Say each thing once. Human labels for statuses and enum values. No database, implementation or internal-tool language. Keep the consent and ranking promises intact wherever a duplicate is removed.

The public landing includes **A short interview with the idea**: the obvious objections, answered by the product rules rather than a pitch. Keep those answers honest. If an answer is wrong, the product should change.

The evidence reading says “reading”, “record”, “covered”, “open questions” and “questions for the conversation”. It never says “analysis”, “insight”, “verdict”, “best”, “ranked” or “recommend”.

## Accessibility

- WCAG 2.1 AA baseline: body text at least 4.5:1 against its background.
- Visible focus rings for every interactive control; no custom second ring.
- Keyboard access to every landing control: segmented buttons use `aria-pressed`, accordion buttons use `aria-expanded` and `aria-controls`, inactive panels are `inert`.
- Reduced-motion and no-JS fallbacks keep all copy visible.
- Small-screen layouts must not clip content or hide actions behind fixed bars. Test 320, 360, 390, 1024 and 1440px.
