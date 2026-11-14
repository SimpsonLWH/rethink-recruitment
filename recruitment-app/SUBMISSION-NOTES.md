# NVIDIA submission notes — DRAFT

**Draft for Lewis to review before any hackathon submission. Not submitted. This is not a prize claim, eligibility statement, or a claim that a live model was used.**

> Historical second-pass notes. The current **Rethinking Recruitment** pivot is not an NVIDIA submission and does not use these AI surfaces for assessment scoring, thresholds, feed order or outcomes. Keep this file only as the optional AI audit context.

## Challenge

Best Use of **NVIDIA Nemotron** — using **Nemotron 3.5 Super VL** in a way that contributes visibly to a working product.

Rivet is a two-sided recruitment-event prototype. The NVIDIA surface is implemented in the app and has a deterministic no-key fallback; **no live NVIDIA request has been made in this checkout**, so this draft must not be read as a live-usage claim.

## Model and endpoint

- Model: nvidia/nemotron-3.5-super-vl-120b-a12b
- API: NVIDIA Build's hosted OpenAI-compatible endpoint at https://integrate.api.nvidia.com/v1
- Key: process.env.NVIDIA_API_KEY (server-side only; not required for the demo, not committed)
- Self-hosting on Modal: not attempted. The hosted model is the intended path.

## Status, stated plainly

- AI_SURFACES in src/lib/ai/inventory.ts records the NVIDIA surfaces as **implemented, not run live**.
- LIVE_EVIDENCE in src/lib/ai/live-evidence.ts is empty. The UI therefore shows **demo fallback**, not live.
- audit/fallback-samples.json contains actual deterministic fallback output only. It is not model output.
- No claim about Nemotron quality, latency, throughput or superiority is made. There is no captured model output to support one.
- To make a real live claim, someone with authorised access must set the key, make one real call, capture and redact the response, add a matching LIVE_EVIDENCE entry, and let the status layer derive the label. See audit/live/README.md. Do not add a live badge before that.

## What the model does in Rivet

Both NVIDIA surfaces use strict JSON and validation. Both fall back to deterministic local logic if no key exists or a call fails. Neither path is required for the core demo.

### 1. Grounded highlight extraction

A candidate pastes a longer prompt answer. The model returns:

    { "highlights": [ { "skill": string, "claim": string, "evidenceUrl": string | null, "sourceQuote": string } ] }

The server validates that the source quote is literally present, only accepts an evidence URL that literally appears in the input, and never asks the model for provenance. Accepted highlights are saved as **Self-claimed** facts. The candidate sees and chooses which highlights to add; AI never edits the master record automatically.

Visible at: candidate /profile → AI highlight studio.

### 2. Role-specific tailoring suggestions

Given a candidate's existing master-record facts and one employer's role, the model returns:

    { "suggestions": [ { "kind": "FOREGROUND" | "REWORD", "sourceFactIds": string[], "proposedText": string, "rationale": string } ] }

The prompt is constrained to select, reorder and reword existing facts only. The server requires at least one known source fact ID per suggestion, rejects invented URLs, and applies provenance from the source records — not from model text. The candidate can edit, reject or approve each line. Only approved lines appear in the employer preview.

Visible at: /tailor → role → review → /preview.

## Why the integration is not a bolt-on

- **No model-only path:** every NVIDIA surface has a deterministic fallback and a visible engine label. The app works with no key.
- **Provenance is server-owned:** the model never returns a provenance field, and model text cannot change the labels.
- **Human approval:** tailoring is candidate-reviewed line by line; extraction is opt-in by the candidate.
- **No ranking:** AI output is not used to order discovery or to auto-reject anyone.
- **Honest evidence:** the status table is generated from recent AiRun rows plus the live-evidence manifest, not from a hand-written badge.

## Other integrations

- **Google Gemini:** an implemented Q&A fallback path and an optional live feed-preference parser (gemini-2.5-flash by default, GEMINI_MODEL override). Neither has run live here. The feed parser is rules-v1 by default; the Gemini path exists only behind RIVET_FEED_PARSER=gemini plus a locally supplied key.
- **Gemma:** not implemented. There is no Gemma model ID, client, route, prompt, schema, or validation. Gemini and Gemma are different model families. Adding a Gemma surface would create a new evidence obligation without improving a demonstrated surface; it is not added just to tick a box.
- **Modal:** optional advisory fit-brief batch only; undeployed, no tokens, no spend. The runtime uses local TypeScript fit briefs and never depends on Modal.

## Demo path for judges/reviewers

    cd recruitment-app
    npm install
    npm run seed
    npm run dev

Open http://localhost:3000. No key is needed.

1. /enter → Northwind Labs → Review candidates. Noor Salmi's rich review card is the primary path.
2. Tap the project module to see the source fact, provenance and link status.
3. Customise feed: "React, at least 2 years, finance background" → inspect the editable criteria → apply → 1 in feed / 8 not stated / 1 outside → Why / Broaden / Reset.
4. Pass Noor; review Elias's non-portfolio card; send a Priority intro with a required reason; see the full profile unlock.
5. Priority intros → match back → message.
6. Candidate side: Aino → /tailor → generate the fallback, compare source and suggestion, approve, preview.
7. /how-it-works → the generated AI inventory/status table and the honest limits.

## Submission evidence

- Full audit: AI-AUDIT.md
- Fallback evidence: audit/fallback-samples.json
- Live evidence rules: audit/live/README.md
- Screenshots: screenshots/README.md
- Verification: README.md and HANDOFF.md

## Before submitting

1. Read AI-AUDIT.md and this file together. Do not remove the "not run live" wording unless a real captured run exists.
2. Decide whether the challenge submission is about the implemented integration (honest, no live claim) or about a live demo. If live, get explicit approval for quota/spend, run the call, capture evidence, and update LIVE_EVIDENCE first.
3. Confirm no key, secret, real candidate data, or external media is in the submission.
4. Confirm the PR is merged only if Lewis explicitly decides to merge; this draft does not authorise a merge, deployment, or public visibility change.
5. Do not add a prize, placement, or eligibility claim that has not been confirmed by the organisers.
