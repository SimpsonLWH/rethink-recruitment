# NVIDIA submission notes — DRAFT (live capture pending)

**Status:** The evidence-reading surface is implemented, tested and exercised with its deterministic fallback. **No real NVIDIA call has been made in this checkout**, so this file is not a live-usage claim. Do not select the NVIDIA Tech Challenge or describe the reading as a live use of Nemotron until a real capture is registered in `LIVE_EVIDENCE`. This draft is for Lewis to review; it is not a prize, placement or eligibility claim.

## Challenge

Best Use of **NVIDIA Nemotron** — using **Nemotron 3.5 Super VL** in a way that contributes directly to a working product, with a short explanation of the model, its role, why it matters and how outputs improved.

Rivet is a two-sided recruitment-event prototype for Junction 2026 · City of Espoo. The employer review card is the place where a hiring team reads a candidate's sourced record against the exact assessment bar and signals it stated. The evidence reading is the model-assisted layer on that card.

## Model and endpoint

- Model: `nvidia/nemotron-3.5-super-vl-120b-a12b`
- API: NVIDIA Build's hosted OpenAI-compatible endpoint at `https://integrate.api.nvidia.com/v1`
- Key: `process.env.NVIDIA_API_KEY` (server-side only; not required for the demo, not committed)
- No self-hosting or alternate provider is claimed.

## What the model does in Rivet

1. The employer opens a live role card and a candidate review card. The card shows the candidate's recorded assessment result against the stated bar, the structured signal evidence, and the source facts.
2. The employer chooses **Read the evidence**. The app sends one request to `POST /api/ai/reading`.
3. The server loads the role and candidate through the repository, builds a minimal input, and calls Nemotron 3.5 Super VL with strict JSON instructions.
4. The model returns a **reading**: a short summary, the requirements covered by the record with citations, the open questions, and 2–3 questions for the human conversation.
5. The server validates the JSON, every requirement id, every cited fact id and every quote before the dialog shows it. Invalid output gets one repair attempt, then a deterministic fallback.
6. The employer reads the evidence and decides. The reading cannot change the bar, the feed, a decision, a match or an outcome.

**Input minimisation.** The prompt contains the role title, summary, live problem, first-90-day context and skills; the stated assessment bars and evidence signals with their fixed statuses; and the candidate facts shown on the review card. It does **not** contain the candidate's name, location, tags, bio, CV, assessment history beyond the stated requirements, or any protected trait.

**Output contract.**

```json
{
  "summary": "2-3 plain sentences about what the record shows against this bar.",
  "covered": [
    { "requirementId": "assessment:...", "note": "Recorded 70 against a stated bar of 70.", "factIds": [], "quote": null }
  ],
  "gaps": [
    { "requirementId": "signal:...", "note": "Not evidenced in the record. Ask for a concrete example." }
  ],
  "questions": ["One concrete question for the conversation."],
  "caveats": ["One short limit of this reading."]
}
```

**Validation rules.** Every supplied requirement appears exactly once. `covered` is allowed only for evidence the app already marks as met or related; everything else is a gap. A covered signal must cite a real supplied fact. Every fact id must exist on the card. Every quote must be a literal substring of a cited claim. Ranking and decision language (`best candidate`, `ranked`, `match percentage`, `suitability`, `should hire`, `recommend`, `auto-reject`) is rejected.

**Why this is core, not a bolt-on.** The review card is the product's decision surface. The reading turns the card's fixed bar and sourced facts into an explanation and a set of questions the employer can actually use. It does not invent evidence and it does not decide. The deterministic bar stays visible above the reading.

## Status, stated plainly

- `AI_SURFACES` in `src/lib/ai/inventory.ts` records the reading as **implemented, not run live**.
- `LIVE_EVIDENCE` in `src/lib/ai/live-evidence.ts` is empty. The UI therefore shows **Deterministic reading · demo mode**.
- `audit/fallback-samples.json` contains deterministic fallback output only. It is not model output.
- No claim about Nemotron quality, latency, accuracy or superiority is made. There is no captured model output to support one.
- The deployed demo works with no key. With a key configured, the same dialog shows **Nemotron · live** or **Nemotron · cached**.

## How a live claim would be made

Only someone authorised to use the NVIDIA account and quota should run this. It makes real calls.

```bash
cd recruitment-app
# Put NVIDIA_API_KEY in .env.local or the shell. Never commit it.
npm run seed
npm run audit:live -- --confirm-live
npm run eval:reading -- --confirm-live
```

- `audit:live` calls the same `readEvidence` path as the app, with the cache bypassed. It refuses to write a capture if the call falls back or fails grounding. It writes `audit/live/nemotron-reading-<timestamp>.json` and prints a `LIVE_EVIDENCE` entry with SHA-256.
- `eval:reading` runs three synthetic pairs (meets the bar, below the bar, no assessment) and writes `audit/live/reading-eval.json`. A human reviewer fills the rubric; the script does not invent ratings.
- After reviewing the capture, add the entry to `LIVE_EVIDENCE`, run `npm test` and `npm run build`, and let `getAiStatusState()` derive `live-with-evidence`. Do not hand-edit a live badge.

## How outputs improved (fill after a real capture)

Do not fill this section from the fallback. The honest comparison is:

| Measure | Live reading | Deterministic reading | How it is measured |
| --- | --- | --- | --- |
| Schema and requirement coverage |  |  | `reading-eval.json` checks every requirement once |
| Citation grounding |  |  | cited fact ids and literal quotes checked in validation |
| Ranking-language rejection |  |  | validator + eval check |
| Questions and specificity |  |  | count, plus a single reviewer rating (1–5) |
| Latency |  |  | `latencyMs` from the live response |

What can be said once a capture exists: "On three synthetic pairs, the live reading validated, represented every requirement once, cited only real facts and produced N questions; a single reviewer rated live X/5 vs fallback Y/5 for usefulness. This is directional, not a benchmark. The bar statuses, feed order and decisions were unchanged." Until then, say only that the surface is implemented and the fallback is exercised.

## Demo path for judges

Keyless path:

1. `/enter` → **Open recruiter demo** → Northwind Labs.
2. Review candidates → open the first review card.
3. Choose **Read the evidence**. The dialog shows **Deterministic reading · demo mode**, the covered requirements with source facts, the open questions and the conversation questions.
4. Close the dialog. The fixed bar and the decision actions are unchanged.

With a configured key, the same path shows **Nemotron · live** on the first call, then **Nemotron · cached** for the same pair. The exact model id is visible in the dialog.

The live capture and evaluation are separate, under `audit/live/`, so a judge can check the artifact against the shipped code.

## Other integrations

- **Google Gemini:** still an optional profile Q&A and feed-preference path. It is not part of this NVIDIA submission.
- **Extraction and tailoring:** still optional, secondary NVIDIA surfaces. They share the client and fallback discipline; they are not used for assessment scoring, matching or outcomes.
- **Gemma:** not implemented. There is no Gemma model ID, client, route, prompt, schema or validation.
- **Modal:** not used. The OA marker remains a Node `vm` demo marker, not a production code sandbox.

## Submission evidence

- [AI-AUDIT.md](AI-AUDIT.md) — actual inventory, fallback-only measurement and live-evidence rules.
- [audit/live/README.md](audit/live/README.md) — capture rules and the empty current state.
- [audit/fallback-samples.json](audit/fallback-samples.json) — deterministic fallback artifact, generated by `scripts/ai-audit.ts`.
- [README.md](README.md) and [HANDOFF.md](HANDOFF.md) — verification and limitations.
- [screenshots/](screenshots/) — UI screens.

## Before submitting

1. Confirm the NVIDIA Tech Challenge can still be selected on the project, and confirm the current card's minimum and prize details.
2. Run `audit:live` with an authorised key; inspect the capture; add the printed `LIVE_EVIDENCE` entry; run the tests and build.
3. Run `eval:reading`; fill the rubric honestly; update the "How outputs improved" section with the actual numbers and limits.
4. Record the 2-minute video from the live path if possible; otherwise do not describe the fallback as a live run.
5. Confirm no key, token, cookie, real candidate data or external media is in the repo, captures, screenshots or submission.
6. Do not claim a prize, placement, eligibility, model superiority or hiring validity.
