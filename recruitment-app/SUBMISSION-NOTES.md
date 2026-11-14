# NVIDIA submission notes — DRAFT

**Draft for Lewis to review before any hackathon submission. Not submitted. Do not treat this as a prize claim or eligibility statement.**

## Challenge

Best Use of **NVIDIA Nemotron** — using **Nemotron 3.5 Super VL** in a way that contributes visibly to the working product.

## Model and endpoint

- Model: <code>nvidia/nemotron-3.5-super-vl-120b-a12b</code>
- API: NVIDIA Build's hosted OpenAI-compatible endpoint at <code>https://integrate.api.nvidia.com/v1</code>
- Key: <code>process.env.NVIDIA_API_KEY</code> (server-side only; not required for the demo)
- Self-hosting on Modal: not attempted. The hosted model is the intended path.

## What the model does in Rivet

Rivet is a two-sided recruitment-event prototype with Hinge-style prompt profiles, mutual matching, free roses, and evidence/provenance transparency. Nemotron was chosen for the two highest-value language jobs:

### 1. Grounded highlight extraction

A candidate pastes a longer prompt answer. The model returns strict JSON:

<code>{ "highlights": [ { "skill": string, "claim": string, "evidenceUrl": string | null, "sourceQuote": string } ] }</code>

The server validates that the source quote is literally present, only accepts an evidence URL that literally appears in the input, and never asks the model for provenance. Accepted highlights are saved as **Self-claimed** facts. The candidate sees and chooses which highlights to add; the AI never edits the master record automatically.

Visible at: candidate <code>/profile</code> → **AI highlight studio**.

### 2. Role-specific tailoring suggestions

Given a candidate's existing master-record facts and one employer's role, the model returns:

<code>{ "suggestions": [ { "kind": "FOREGROUND" | "REWORD", "sourceFactIds": string[], "proposedText": string, "rationale": string } ] }</code>

The system prompt is hard-constrained to select, reorder, and reword existing facts only. The server requires at least one known source fact ID per suggestion, rejects any invented URL, and applies provenance from the source records — not from model text. The candidate can edit, reject, or approve each line. Only approved lines appear in the employer preview.

Visible at: <code>/tailor</code> → role → review → <code>/preview</code>.

## Why this matters

A recruiting product should not let a language model quietly invent experience or upgrade a trust label. Rivet's use of Nemotron is deliberately bounded: it makes the writing and selection faster while the source record, provenance labels, and human approval stay authoritative. "A link works" is displayed as a separate mechanical fact, never as truth. This is the difference between an AI writing assistant and an automated screening tool.

## How output quality was improved

Implemented in this checkout:
- **Small, task-specific prompts** with the relevant facts only (max 6 tailoring facts; max 1,600 source characters).
- **Strict Zod schemas** with no provenance field; extra/malformed shapes fail validation.
- **Grounded evidence:** source quotes must be substrings of the input; evidence URLs must appear verbatim; tailoring source IDs must exist in the master record; URLs not present in source facts are rejected.
- **One repair attempt** when the first JSON/schema fails, with a concise error and the same schema instruction.
- **Retries:** up to 3 attempts on 429/5xx/network failures, exponential backoff + full jitter, capped Retry-After, 20s timeout per attempt.
- **Cache:** SHA-256 response cache in SQLite for 24h to keep prompts/quota reasonable.
- **Deterministic fallback** of the same shape on missing key, timeout, HTTP failure, or invalid output. The UI shows an honest **demo fallback** label; no key is exposed to the browser.
- **Human approval gate:** no tailored line is shareable until the candidate approves it; no AI output changes provenance.

## Status in this build — honest

- Code path: **implemented**.
- Live hosted Nemotron call: **not tested**; no <code>NVIDIA_API_KEY</code> was present in the environment.
- Mocked HTTP tests: **passed** (429 retry, retry exhaustion, schema/validation behavior).
- Keyless fallback: **exercised** by unit tests, the browser smoke test, and screenshots.
- If a key is added, re-run the highlight and tailoring flows and verify the About page shows a successful live run before claiming live use.

## Where to look

- Route handlers: <code>src/app/api/ai/extract/route.ts</code>, <code>src/app/api/ai/tailor/route.ts</code>.
- Model client: <code>src/lib/ai/nemotron.ts</code>.
- Prompts/schemas/validation: <code>src/lib/ai/prompts.ts</code>, <code>schemas.ts</code>, <code>validation.ts</code>, <code>orchestrator.ts</code>.
- Guardrail-enforcing UI: <code>src/components/profile/highlight-studio.tsx</code>, <code>tailoring-review.tsx</code>, <code>tailor/[roleId]/preview/page.tsx</code>.
- About the AI: <code>src/app/about-ai/page.tsx</code>.

## Judge demo path

1. <code>npm run seed</code>, <code>npm run dev</code>, open <http://localhost:3000/enter>.
2. Choose Aino Vikström → Profile → AI highlight studio → extract → add a highlight (Self-claimed).
3. Choose Tailor a profile → Product Engineer at Northwind Labs → generate → open the source facts next to each suggestion → approve lines → What they see.
4. About the AI → check the exact model name and current live/fallback status.

## What is not being claimed

- No live Nemotron request has been made in this checkout.
- No prize, score, placement, or eligibility is promised or predicted.
- No self-hosted 120B deployment exists.
- No AI is used for ranking, auto-rejection, provenance, or real verification.

## Manual checklist for Lewis

- [ ] Review that the implemented claims above match the code.
- [ ] Add <code>NVIDIA_API_KEY</code> only if you are authorised and accept any free-tier usage; restart the app.
- [ ] Run highlight extraction and tailoring, confirm the About page records a live run.
- [ ] Re-run <code>npm run smoke</code> and <code>npm run screenshots</code> if live output changes the screens.
- [ ] Decide whether to submit; complete any external submission/forms yourself. Do not upload keys or private material.
