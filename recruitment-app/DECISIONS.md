# Decision log — Rivet

Second pass. The repository is private, all data is synthetic, and no key was used for spending, deployment, account creation, public visibility, or external uploads. This file records judgment calls, not marketing claims.

## Baseline and workflow

- Baseline: private repository <https://github.com/SimpsonLWH/rethink-recruitment>, branch recruitment-prototype, app under recruitment-app/. The second pass builds on the existing branch and updates issue #2 / PR #3; it does not create a new app, repository, or PR.
- Only recruitment-app/ is touched. The root README and root configuration are left alone. Nothing is merged, deployed, or made public.
- All changes were reviewed in the working tree and verified with lint, typecheck, unit tests, build, browser smoke, screenshot inspection, and the deterministic AI audit.
- The demo is keyless. Optional NVIDIA/Gemini/Modal paths exist but are not exercised, because no key and no budget were provided.

## Product decisions

- **Priority intro is the only limited interest signal.** It keeps the useful semantics of the earlier mechanic: 3 free per participant for the event, a required one-line reason, an inbox on the recipient side, and match-back. It means interest, never suitability.
- **Branding lives in one module.** Name, plural, nav label, action label, count label, icon and explainer are in src/lib/brand.ts. The UI imports the constants rather than re-typing the words. The icon is a small Spotlight. The count appears once, next to the action; no allowance card in the sidebar.
- **Professional-minimal editorial design.** Warm off-white paper, near-black ink, one indigo accent (#3D46C2), Fraunces for display headlines only, Inter for everything else, thin dividers, generous whitespace, no stacked badge clusters, and one muted status line per surface. The long explanations moved to one /how-it-works page; /about-ai redirects there.
- **Recruiter review is the primary demo path.** The review card leads with one person, a headline and 3–4 glanceable modules. Tapping a module reveals source facts and provenance. The full profile and Q&A are gated until the employer expresses interest. The candidate role-deck flow remains a first-class second path.
- **Rich modules are factual and optional.** The builder supports achievement, project, timeline, skills, responsibility, qualification, availability, result and generic fact modules. Projects use a local synthetic illustration and a real source-backed link. Non-portfolio profiles use responsibilities, qualifications, availability and results; they are not forced to show placeholder imagery.
- **Customise feed is a soft discovery filter, not a ranking.** The request becomes visible editable criteria before applying. Matching uses only profile facts. Exact and related skills are labelled; unknown / duration-uncertain stays visible in Not stated; explicit contradictions stay visible in Outside your criteria. Broaden and Reset are one tap. Protected or proxy criteria are refused individually. The feed never auto-rejects and never uses name, avatar, location, bio or tags.
- **No numeric score anywhere.** Pass, Like and Priority intro are the only decision language. Mutual matching requires both sides. Discovery is seeded event order; no interest or fit signal changes order.
- **One-screen is a goal, not a rule.** Readable type, complete facts and accessible controls take priority over forcing no scroll. The review action bar does fit the 1440×900 first view; the mobile action bar stays fixed above the bottom nav.
- **Honest evidence labels.** Link status is a mechanical reachability check; provenance is separate. Reachability is never presented as truth. The employer-confirmed facts are labelled Simulated and are not writable.

## Data and seed decisions

- **One fictional event:** Junction 2026 · Espoo Career Event, 14 November 2026. IDs are stable strings for deep links.
- **Seed counts:** 13 candidates, 8 employers, 15 roles, 47 facts, 13 seeded matches, 39 messages, 21 seeded Priority intros, 195 local fit briefs.
- **Noor Salmi** is the new fictional finance-frontend candidate. Her 2021–2024 role and 2023–2024 project exercise the finance-domain and dated-experience paths; the project image is a locally generated SVG. Noor is the first recruiter review card for Northwind Product Engineer.
- **Feed test profiles:** Nadia Petrescu has a dated Vue role (related to React); Mei Laine has an undated React QA fact (duration uncertain); Daniel Achebe has dated React project evidence below the two-year bar (Outside your criteria). These are seeded deliberately, not generated from the query.
- **Budget distribution:** Every candidate and employer has one inbound Priority intro, an existing match, and at least one thread. Northwind keeps one employer Priority intro available so the recruiter demo can send one; the candidate side keeps two. The event allowance remains 3 for each participant.
- **Synthetic assets:** Project images in public/demo/ are abstract SVGs generated for this prototype, labelled SYNTHETIC DEMO. No external media, real logos, photos of people, real candidate data, or real employment evidence is used.
- **No portfolio requirement:** Every seeded role has portfolioRequired = false. Several profiles have no evidence link. The profile, matching, messaging, extraction and tailoring paths never require a link.

## AI decisions

- **Exact model IDs:** NVIDIA nvidia/nemotron-3.5-super-vl-120b-a12b for extract and tailor; Google gemini-2.5-flash by default for ask and the optional live feed parser, overridable with GEMINI_MODEL. The feed default is rules-v1 in src/lib/feed.ts.
- **No live run:** No NVIDIA, Gemini or Modal key exists in the environment. No live request was made, no live output was captured, and no live integration is claimed. The status layer derives implemented-not-run / demo-fallback from recent AiRun rows plus the empty LIVE_EVIDENCE manifest.
- **No Gemma implementation:** There is no Gemma model ID, client, route, prompt, schema or validation. Gemini and Gemma are different model families. Adding a Gemma surface would create a new evidence obligation without improving a demonstrated surface; it is not added just to tick a box.
- **Modal is optional and undeployed:** The modal/ folder contains an advisory fit-brief batch, not a model integration. The runtime uses local TypeScript fit briefs and never depends on Modal. No Modal spend occurred.
- **Feed parser:** The deterministic rules parser is the default. An optional Gemini path exists behind RIVET_FEED_PARSER=gemini plus a locally supplied GEMINI_API_KEY; it has never run live and is not the fallback. The parser returns criteria, rejected/protected terms and unparsed text; validation rejects protected terms and dedupes.
- **Fallback audit is the measured evidence:** audit/fallback-samples.json is generated by scripts/ai-audit.ts with no model/network imports. It records actual deterministic fallback outputs, grounding checks, the tailor source-vs-output comparison, the Q&A sources, and the required + protected feed examples. It is not model output.
- **Tailoring fallback:** The local rewrite now does a real transformation (lead with the action, move the location out of the opening, tighten wording, change "went from" to "increased from") and preserves every fact. If a claim has no meaningful rewrite, it is omitted with a draft note instead of emitting a near-copy.
- **Claims discipline:** The UI labels are derived from actual state. No live badge is hand-written. No model-vs-fallback superiority is claimed. The full audit is in AI-AUDIT.md; the live-capture rules are in audit/live/README.md.

## Technical decisions

- **Stack:** Next.js 15.5 App Router, React 19, TypeScript strict, Tailwind 3, Prisma 6 + SQLite, Vitest 3, Playwright-core against system Chrome, Radix Dialog, Framer Motion, Zod.
- **No environment requirement:** SQLite URL is a literal file:./dev.db in prisma/schema.prisma. npm install runs prisma generate via postinstall; npm run seed runs prisma db push and reseeds. No DATABASE_URL, Docker, or account is needed.
- **Server-only AI:** Keys are read only in server route handlers and server-only libs; they are never exposed through NEXT_PUBLIC or client props.
- **Repository boundary:** Runtime data access is behind src/lib/repo. Seed and maintenance scripts are the only direct Prisma initialization points; batch export/import uses the repository.
- **Data-model changes:** priorityIntroAllowance on Candidate/Employer; Fact.metaJson for structured role/project/skill metadata; TailoringDraft.note for the honest no-rewrite note. The old signal name is removed from action values, routes, seed, tests, docs and screenshots.
- **One branding module:** src/lib/brand.ts is the single source for Priority intro copy and count labels. A separate unused AI status chip was removed.
- **Verification scripts:** scripts/smoke.mjs runs the keyless candidate + employer flows, including feed parse/apply/broaden/reset, rich portfolio and non-portfolio cards, required-reason Priority intro, match-back, tailoring source-vs-output, and Q&A citations. scripts/screenshots.mjs captures desktop + mobile, fails on browser errors, and warns if the first-view action bar overflows.

## Delivery status

- Branch recruitment-prototype; issue #2; PR #3. Not merged, not deployed, not public.
- Final checks: lint, typecheck, unit tests, build, Python modal tests, seed, browser smoke, screenshots, fallback audit. The commands and counts are in README.md and HANDOFF.md.
- Remaining risk: no live model evidence exists, so any statement about live model quality, latency or accuracy would be unsupported. The honest position is implemented, not run live.
