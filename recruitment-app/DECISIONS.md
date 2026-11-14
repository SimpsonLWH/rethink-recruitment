# Decision log — Rivet

Written during the overnight build. The repository is private and all data is synthetic. This file records judgment calls, not marketing claims.

## Baseline and workflow

- Started from an **empty local workspace**. Cloned <code>https://github.com/SimpsonLWH/rethink-recruitment</code> into it.
- Baseline inspected before branching: private repository, default branch <code>main</code> at <code>88d8525</code>, only the root <code>README.md</code> present. **No other teammate work or dirty changes were present**, so there was nothing unrelated to preserve.
- Created branch <code>recruitment-prototype</code> from <code>origin/main</code>. Every change lives under <code>recruitment-app/</code>. The root README and root configuration were not modified. The issue/PR links are added to HANDOFF after creation.
- The workspace path is named <code>rethink-recruitment</code>, not <code>junction2026</code>; this is only a local directory name. The README's clone instructions use the real repository name.
- Git credentials were available through the authenticated <code>gh</code> account (SimpsonLWH). They were used only for the explicitly requested private-repo branch, issue, and PR operations. No key found in the environment was used for spending, deployment, account creation, public visibility, or external uploads.

## Product decisions

- **Name:** Rivet. The two interlocking circles suggest a mutual join; the rose accent connects to the rose allowance without turning the whole product pink.
- **Tone and visual direction:** Warm light editorial, not a dark SaaS dashboard. Paper <code>#F8F4ED</code>, ink <code>#1B1714</code>, one brand accent rose <code>#C63F4A</code>, Fraunces Variable for display and Inter Variable for UI. Fonts are installed locally through Fontsource packages; there are no runtime Google Fonts requests. One accent colour is committed to; semantic labels are neutral/ink.
- **Hinge model, not a job-board clone:** Discovery is a deck of role cards for candidates and candidate cards for employers. Both sides can pass, like, or send a rose. A match is created only on mutual yes. No numeric score is displayed in discovery.
- **Demo auth:** A validated HttpOnly persona cookie (<code>rivet_persona</code>) chooses one seeded candidate or employer. This is explicitly not real auth. It avoids building login screens that would not be part of the judged concept.
- **Role-scoped employers:** Employer decisions belong to a specific open role (<code>rivet_employer_role</code> cookie), because a hiring decision is for a role, not an abstract company. The active role is switchable in the shell.
- **Two-sided richness:** Every employer has three prompts and 1–3 roles; every candidate has prompt answers, optional evidence facts, tags, and an ideal-team answer. The employer side has its own discovery, roses, matches, and full profile Q&A.

## Data and seed decisions

- **One event:** All data is scoped to a fictional Junction 2026 Espoo event. IDs are stable strings for deep links.
- **Synthetic content:** 12 candidates (7 technical, 5 non-technical), 8 employers, 15 roles (1–3 each), 40 facts, 12 seeded matches, 36 seeded messages, 20 seeded roses, 180 local fit briefs.
- **No portfolio requirement:** Every seeded role has <code>portfolioRequired = false</code>; several candidates (including all non-technical profiles) have facts with no evidence link. The profile, matching, messaging, extraction, and tailoring paths never require a link.
- **Evidence URLs:** Reachable placeholders use <code>https://example.com/?evidence=...</code>; one deliberately broken URL uses <code>https://evidence.invalid/...</code>. This avoids pointing at real people or real employment proof while still giving the mechanical checker something to fetch.
- **Employer-confirmed facts:** Two seed facts use <code>EMPLOYER_CONFIRMED</code> (Lumen Retail and Metsä Health). The UI labels the status "Simulated" and the profile explicitly says it is fictional seed data. These are the **only** source of employer confirmation; there is no write path that can produce it.
- **Roses:** Every candidate and every employer receives exactly one inbound rose and has at least one existing match/thread. The first seed design accidentally spent all 3 Northwind roses, making the employer demo unable to send one. Nadia's inbound rose was moved from Northwind to Common Ground so Northwind retains one rose. The total event budget remains 3 for each participant; the seed is intentionally distributed.
- **Matches:** Seeded matches have both-side decisions and a real <code>Match</code> row. Pending roses have one-side decisions only. This keeps the "mutual only" rule visible and testable.
- **Fit briefs:** Seeded by the local TypeScript batch with <code>generatedBy = "local-fallback"</code>. They are advisory text only, appear only after a mutual match, and are never used to order discovery. A Modal import can replace them with <code>generatedBy = "modal"</code>; the import validates source fact IDs.
- **No ranking / no penalties:** Card order is seeded event order. There is no query that sorts by rose, likes, fit, or AI output. Pass/like/rose decisions are final within the demo and never trigger automated rejection.

## Technical decisions

- **Stack versions:** Next.js 15.5.29, React 19.2.9, Tailwind 3.4.19, Prisma 6.19.3, TypeScript 5.9.3, Framer Motion 12.43.0, Zod 3.25.76, Sonner 2.0.8. Version choices were resolved from the npm registry during the build and pinned where it matters.
- **No env requirement:** The SQLite URL is a literal <code>file:./dev.db</code> in <code>prisma/schema.prisma</code>. There is no <code>DATABASE_URL</code> dependency. <code>postinstall</code> runs Prisma Client generation; <code>npm run seed</code> runs <code>prisma db push</code> and reseeds. This makes the exact clone/install/seed/dev contract possible with no keys.
- **Single repository interface:** Runtime data access is behind <code>src/lib/repo</code>. The seed and maintenance scripts are the only places that use Prisma directly for initialization; batch export/import scripts go back through the repository.
- **Server-only AI:** Keys are read only in server route handlers and server-only libs. They are never exposed through <code>NEXT_PUBLIC</code> or client props.
- **AI-first, local-always:** NVIDIA Nemotron is used for highlight extraction and tailoring. Gemini is used for employer Q&A. Modal is an optional batch. Every call has a deterministic fallback with the same response shape, and a distinct engine label. No AI path is required for the core demo.
- **Strict AI schemas:** Zod objects deliberately have no provenance field. Extraction requires sourceQuote containment and only accepts a URL if it literally appears in the source. Tailoring requires known source fact IDs and rejects invented URLs. Malformed output gets one repair attempt; failure returns a local result. No model output is persisted as a fact without explicit UI acceptance, and no tailored draft is shareable without human approval.
- **Retries and cache:** Three attempts on 429/5xx/network errors with exponential backoff plus jitter, capped Retry-After; 24h DB-backed SHA-256 cache for live outputs; tiny prompt payloads. Mocked unit tests cover 429 retry and retry exhaustion. The live hosted endpoints were not tested because no keys existed.
- **Model naming:** The exact requested model <code>nvidia/nemotron-3.5-super-vl-120b-a12b</code> and base URL are shown in About the AI and SUBMISSION-NOTES. No self-hosting was attempted; a 120B model on Modal overnight was explicitly out of scope.
- **Evidence checking is not AI:** Link status is a HEAD request route with timeout, redirects, and private-host blocking. It is cached separately from AI and never changes provenance. The UI uses exactly "Link works" / "Link unreachable"; a separate muted label shows the checked time. "Checking link…" is a loading state only.
- **Tailoring is a separate record:** Tailoring drafts point at source fact IDs; they do not mutate the master record. Approved previews render only approved items. The app does not expose unapproved drafts to an employer.
- **Employer-side Q&A scope:** It is visible on the employer candidate profile and answers only from that candidate's facts. It is not used for automated screening.
- **No external visual assets:** No photos of people or external images. Monogram avatars and CSS/SVG art only. This avoids synthetic-person imagery that could be mistaken for real candidates.

## Integrations considered and not built

- **Modal:** Code and pure tests shipped. Not deployed or run remotely (no tokens). No account was created. The app uses the local TS batch; the exact token-gated commands are in <code>modal/README.md</code>.
- **Gemini:** Code shipped for one visible employer Q&A use; no key, so only the local fallback was exercised. No Gemma integration was added.
- **Aiven:** Skipped. A hosted Postgres exists only if we deploy; adding one just for a logo would not be an honest core choice.
- **Context.dev:** Skipped. No key and no genuinely useful core enrichment will be invented for the demo.
- **CRACI:** Skipped. There is no CI in this repo and no authorization to move jobs.
- **Cloudinary:** Skipped. Profile media is not in scope, and generic image delivery would not meet the stated tool-specific requirement. Its optional survey was not attempted because the integration was not used.
- **ElevenLabs:** Skipped. It would be a tasteful extra, but not nearly free enough relative to the remaining verification work.
- **Entire, Verda, Codex, Solana, hardware challenges:** Skipped or not applicable. Codex was not used; no Codex claim. No public deployment was made.
- **Codex specifically:** The build was done with DeepSeek only; documenting Codex as used would be false.

## Visual verification and polish decisions

- Screenshots are generated by <code>scripts/screenshots.mjs</code> with system Chrome through <code>playwright-core</code> (no downloaded browser). The script logs console/page errors and failed requests and exits non-zero on browser errors.
- A desktop visual pass found that discovery cards were taller than the viewport and hid the mandatory action buttons. The cards were compacted: removed the duplicate "Why join us" block from the role card, placed candidate facts side-by-side on desktop, and added a mobile fixed decision bar with icon-only controls above the bottom nav. The bar was moved out of the page's transform-created containing block by removing the page animation from discover.
- The Next.js development indicator was disabled in <code>next.config.ts</code> because it appeared in otherwise production-like screenshots.
- The sidebar headline was wrapping mid-word after truncation; it is now two-line clamped.
- Link status labels originally included a visible "· checked" suffix inside the pill. The pill now contains only the required status text; the timestamp is separate metadata.
- The landing mock card originally had its quote partially hidden by the floating rose note. The rose note was moved down; the mock's decorative action row was removed so no functional content appears clipped.
- The About page, profile page, rose inbox, match thread, tailoring review, approved preview, employer discovery, and Ask profile screen were inspected after the fixes. Final images are in <code>screenshots/</code>.
- The screenshot script mutates demo state (match-back, generated tailoring) and is followed by a reseed for the final handoff state.
- The browser smoke test (<code>npm run smoke</code>) exercises the key interactions and passed on a fresh seeded database: pass, rose, link status, highlight extraction/add, rose match-back, messaging, tailoring approval/preview, employer decision, employer rose match-back, and messaging.

## Open limitations

- Live Nemotron and Gemini requests were never made; no key was available. They are implemented and validation-tested with mocked HTTP only. The live status is honest in the UI.
- Modal was never deployed or remotely tested. The local fallback was exercised.
- There is no real authentication, messaging infrastructure, payments, deployment, photo/video upload, or automated decisioning.
- The approved-preview screen demonstrates the employer-visible result; a full employer-side tailored-profile recipient screen is not separately built. No unapproved draft is exposed.
- Link checks use external placeholder hosts; offline behavior is an honest "Link unreachable".
- The demo is a single-event prototype; the schema carries event IDs but the UI is not multi-event.

## Delivery status

- Branch <code>recruitment-prototype</code> was pushed to the private repository.
- Issue [#2](https://github.com/SimpsonLWH/rethink-recruitment/issues/2) and PR [#3](https://github.com/SimpsonLWH/rethink-recruitment/pull/3) were opened and assigned to SimpsonLWH. Nothing was merged.
- Fresh-clone verification passed from the pushed branch: install → seed → build, then a no-key dev server returned 200 for landing, entry, About AI, and the status endpoint. No <code>.env</code> or AI key was present; the status was demo fallback.
- No repository visibility change, deployment, paid resource, account signup, or external upload was performed.
- Lewis may add optional keys and re-run the live checks after explicitly deciding that quota/spend is acceptable. The live Nemotron, Gemini, and Modal paths remain untested until then.
