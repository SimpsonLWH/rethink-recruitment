# Live evidence — rules and current state

**Current state: empty.** No live model capture has been made in this checkout. `LIVE_EVIDENCE` in [`src/lib/ai/live-evidence.ts`](../../src/lib/ai/live-evidence.ts) is `[]` and must stay empty until a real, authorised live run is captured and redacted.

## Purpose

This folder is where a future, genuinely executed live-model response would be stored so that a live claim can be checked against an artifact. A capture proves only what the specified model returned at the specified time, under the specified input. It does not prove correctness, quality, safety, speed, cost, or superiority.

There is no live evidence today:

- no live NVIDIA/Nemotron run,
- no live Google/Gemini run,
- no live feed-parser run,

## Required entry fields

Every committed capture must be indexed by one entry in `LIVE_EVIDENCE`:

| Field | Meaning |
| --- | --- |
| `surface` | Surface id from `AI_SURFACES` in [`../../src/lib/ai/inventory.ts`](../../src/lib/ai/inventory.ts): `extract`, `tailor`, `ask`, `feed-parse-live`. |
| `provider` | Provider that served the call (e.g. `NVIDIA`, `Google`). |
| `model` | Exact model ID used (e.g. `nvidia/nemotron-3.5-super-vl-120b-a12b`, `gemini-2.5-flash`). |
| `capturedAt` | ISO-8601 timestamp of the real capture. |
| `file` | Redacted capture file, relative to the repository root. |
| `sha256` | SHA-256 of the redacted file's bytes. |
| `redactions` | Explicit list of what was removed before committing. |

## Capture rules (all must hold)

1. The call was really executed against the provider, by someone authorised to use that account and quota. Do not fabricate, simulate, or backfill a capture.
2. A matching `LIVE` `AiRun` row must exist for the same surface, or the capture must state how it was recorded outside the app. A capture without a run row, or a run row without a capture, is not enough to claim live.
3. The exact model ID and provider are recorded; "the model answered" without an ID is not evidence.
4. **Redact before saving:** remove "Authorization" / "x-api-key" style headers, API keys and tokens (`NVIDIA_API_KEY`, `GEMINI_API_KEY`, `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`), cookies, session identifiers, and every environment value. Never commit raw HTTP transcripts with request headers.
5. Keep the request body/parameters and the response body that are needed to audit the output; strip response headers that carry secrets.
6. Hash the final redacted file (`sha256`) and add that hash to `LIVE_EVIDENCE`. Do not edit the file after hashing.
7. Record failed validation or a fallback honestly. A failed live attempt that fell back is not evidence of a successful live output.
8. Never commit `.env`, key files, or generated datasets with credentials. No secrets in screenshots, JSON, or markdown.
9. Do not add an evidence entry for a surface that was not actually run. Empty is the honest default.
10. Only after the capture and the `LIVE` run row both exist may the status layer report `live-with-evidence` for that surface (see [`../../src/lib/ai/status.ts`](../../src/lib/ai/status.ts)).

## Template (not evidence)

The following is only the shape of an entry. Do not copy it into `LIVE_EVIDENCE` until a real capture exists:

```ts
{
  surface: "extract",
  provider: "NVIDIA",
  model: "nvidia/nemotron-3.5-super-vl-120b-a12b",
  capturedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
  file: "audit/live/<opaque-capture-id>.json",
  sha256: "<sha256 of the redacted file>",
  redactions: ["Authorization header", "request/response headers", "API key"],
}
```

## How status uses this folder

- `deriveSurfaceStatus()` returns `live-with-evidence` only when a `LIVE` run exists **and** a matching evidence entry exists. A live run alone stays `implemented-not-run`.
- With no entries here, the overall runtime mode is `demo-fallback`: deterministic local output on every surface.
- The rules are covered by pure tests in [`../../src/lib/ai/status.test.ts`](../../src/lib/ai/status.test.ts).
