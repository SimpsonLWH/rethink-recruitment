# Handoff — Rivet second pass

**Status:** Second pass complete in the working tree, verified locally, and ready for review. The branch is recruitment-prototype; PR #3 is open. Nothing has been merged, deployed, or made public.

All data is synthetic. No real people, employers, evidence, confirmations, messages, or contact details are used. No AI key or paid resource was used.

## At a glance

- App: recruitment-app/
- Branch: recruitment-prototype (from main @ 88d8525)
- Issue: [#2](https://github.com/SimpsonLWH/rethink-recruitment/issues/2) — assigned to SimpsonLWH
- PR: [#3](https://github.com/SimpsonLWH/rethink-recruitment/pull/3) — main ← recruitment-prototype, assigned to SimpsonLWH
- Repo visibility: unchanged (private)
- Deployment: none
- Keys available: none for NVIDIA, Gemini, or Modal. The core demo requires none.
- Unit tests: **89 passed** across 10 files.
- Lint: clean. Typecheck: clean. Production build: passed. Python modal tests: 4 passed.
- Browser smoke: **passed** on a freshly seeded database.
- Screenshots: **29 final images** captured desktop + mobile, opened and inspected, fixes applied, then re-captured. See screenshots/.
- AI fallback audit: passed; actual deterministic output written to audit/fallback-samples.json.
- Live AI evidence: **none**. No live run was made and no live claim is present.

## Run it in the morning

From the repository root after cloning:

    cd recruitment-app
    npm install
    npm run seed
    npm run dev

Open <http://localhost:3000>. No .env or keys are needed. If smoke or screenshots changed state, run npm run seed again.

Primary review path: <http://localhost:3000/enter> → Northwind Labs (Start here) → Review candidates → Noor Salmi. The recruiter-first path covers the new review, feed, Priority intro, inbox, evidence, Q&A and the AI audit page. Switch to Aino for the candidate role deck and tailoring.

## What changed in this pass

- Priority intro is now the single limited interest signal. Name, spotlight icon, count label and explainer live in src/lib/brand.ts. The count appears once, next to the action; the old allowance card, nav chip and repeated labels are gone.
- New professional-minimal editorial system: warm off-white paper, near-black ink, one indigo accent, Fraunces display headlines only, Inter everywhere else, thin dividers, one muted status line per surface.
- Recruiter review is the primary path: one candidate per screen, 3–4 rich modules, source-backed evidence on tap, gated full profile, mobile card-first layout.
- Customise feed: request → editable criteria → facts-only matching; exact/related/unknown/under-bar; dated overlap merge; related labels; protected refusal; no ranking; Broaden/Reset; Why this? sheet.
- AI audit: exact model IDs and call sites, derived statuses, no live claim, fallback artifact, Gemma not implemented, Modal not deployed.
- Tailoring fallback fixed: visibly rewritten line, source trace, draft note for unchangeable claims, human approval before preview.
- Seed refreshed: 13 candidates, Noor Salmi and the finance/React path, rich portfolio and non-portfolio metadata, local synthetic project images, fixed Priority-intro budget distribution.
- Docs and screenshots fully refreshed; old stale images removed.

## What works

- **Landing and entry:** product-led landing preview, no-key persona picker, recruiter tab default, Start here Northwind, switch persona.
- **Recruiter review:** Noor's rich portfolio card; Elias's non-portfolio card; module evidence sheet; "Why you're seeing this" line; full-profile gate; mobile action bar.
- **Customise feed:** parse the required example; edit/remove/add criteria; apply; counts; not-stated and outside sections; Why sheet with dated months; Broaden; Reset.
- **Priority intros:** required reason, disabled send until valid, count update, inbox, match-back, mutual match, message; all 3 per participant enforced server-side.
- **Evidence:** link status separate from provenance; simulated employer confirmation clearly labelled; highlight extraction and add as Self-claimed.
- **Matching and messaging:** mutual-only matches, seeded threads, human messages, advisory fit brief.
- **Candidate side:** role deck with Pass/Like/Priority intro; matches; master record; grounded highlight studio; tailoring; approved preview.
- **Employer Q&A:** grounded answers from the record with sources; gate requires employer interest.
- **How it works:** one long-form page with the loop, interest, evidence, feed, AI inventory/status and honest limits; /about-ai redirects there.
- **Design:** responsive desktop/mobile layouts, 11px minimum text, no external media, no photos of people.

## Verification evidence

Run from recruitment-app/:

    npm run lint
    npm run typecheck
    npm test
    npm run build
    python3 -m unittest discover -s modal -p 'test_*.py'
    npm run seed
    npm run dev          # separate terminal
    npm run smoke
    npm run screenshots
    npm run audit:ai
    npm run seed         # clean final demo

Results in this pass:

- npm run lint: no ESLint warnings or errors.
- npm run typecheck: clean.
- npm test: 89/89 tests in 10 files.
- npm run build: production build completed; all routes compiled; no type errors.
- Python modal tests: 4/4 passed.
- npm run smoke: passed candidate and employer flows. Coverage includes pass, required-reason Priority intro and count, link status, highlight extraction/add, Priority-intro inbox match-back and message, visibly changed tailoring with source trace, human approval and preview, rich portfolio review and evidence sheet, feed parse/edit/apply/why/broaden/reset, rich non-portfolio review, employer Priority intro with required reason and full-profile unlock, employer inbox match-back and message, and employer Q&A with citations.
- npm run screenshots: 29 images captured with no browser errors and no failed requests; desktop action bar warning absent; all images opened and inspected; changed screens re-captured.
- npm run audit:ai: deterministic fallback audit passed; no model/network imports; actual output committed in audit/fallback-samples.json.
- No live AI request, live model output, live badge or model-quality claim exists.

## AI integration status

| Surface | Exact model / parser | Status here |
| --- | --- | --- |
| Highlight extraction | NVIDIA nvidia/nemotron-3.5-super-vl-120b-a12b | Implemented; not run live; deterministic fallback |
| Tailoring suggestions | NVIDIA nvidia/nemotron-3.5-super-vl-120b-a12b | Implemented; not run live; deterministic fallback |
| Profile Q&A | Google gemini-2.5-flash (GEMINI_MODEL override) | Implemented; not run live; deterministic fallback |
| Feed parse (optional live) | Google gemini-2.5-flash | Implemented behind RIVET_FEED_PARSER=gemini; never run live |
| Feed parse (default) | Local rules-v1 | Exercised; the default and fallback |
| Advisory fit brief | Local TypeScript; optional Modal batch | Local fallback only; Modal not deployed |
| Gemma | None | Not implemented |

The status layer derives labels from recent AiRun rows plus the committed live-evidence manifest. The manifest is empty; live-with-evidence is therefore impossible in this checkout. The full audit is AI-AUDIT.md; the fallback artifact and live-capture rules are under audit/.

## Deliberately not done

- No live NVIDIA, Gemini, or feed-parser call. No key and no budget.
- No Modal deployment, account signup, or remote run.
- No Gemma implementation or claim.
- No merge, deployment, public visibility change, or paid resource.
- No real authentication, payment, upload, messaging transport, or employment verification.
- No external media or real candidate data.
- No change outside recruitment-app/.

## Known limitations

- Live model quality, latency and accuracy are unmeasured. The honest status is implemented, not run live.
- The fallback is deterministic and intentionally conservative; it can omit a claim rather than force a weak rewrite.
- The feed is a soft filter, not a ranking. Unknowns and explicit contradictions stay visible; criteria are not persisted.
- Link checks use external placeholder hosts; offline they can honestly show "Link unreachable".
- The one-screen goal is aspirational; readable type and complete facts win. The review action bar fits 1440×900; the mobile bar is fixed above the bottom nav.
- The app is a single-event prototype; the schema has event IDs but the UI is not multi-event.
- The employer-approved preview is the shared artefact; there is no separate employer inbox for tailored versions beyond it.

## Reviewer checklist for Lewis

1. Run the quick start and confirm landing, /enter, /discover, /how-it-works and /priority-intros load with no keys.
2. Confirm the sidebar shows one status line "Demo data · AI: demo fallback" and no repeated AI/allowance chips.
3. Confirm Priority intro name, spotlight icon and count appear next to the action; no old branding in any screen or screenshot.
4. Walk the recruiter path: Noor review → project evidence → feed parse/apply/broaden/reset → Elias non-portfolio → Priority intro with required reason → full-profile unlock → inbox match-back → message → Q&A with sources.
5. Walk the candidate path: role deck → priority intro with required reason → profile extract/add → tailoring source-vs-output → approve → preview.
6. Open /how-it-works and confirm the AI table says implemented, not run live; Gemma not implemented; no fabricated model output.
7. Run the verification commands above and compare counts.
8. If you want a live claim, make one authorised call, capture and redact the output, add a LIVE_EVIDENCE entry, then let the status layer derive the label. Do not hand-edit a live claim into docs first.

## Links

- Branch: recruitment-prototype
- Issue: [#2](https://github.com/SimpsonLWH/rethink-recruitment/issues/2)
- PR: [#3](https://github.com/SimpsonLWH/rethink-recruitment/pull/3)
- Full app README: recruitment-app/README.md
- AI audit: recruitment-app/AI-AUDIT.md
- Screenshots: recruitment-app/screenshots/README.md
