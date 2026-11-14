import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, CircleHelp, Link2, ShieldCheck, Sparkles } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Logo } from "@/components/brand/logo";
import { PAGE_STEPS } from "@/lib/how-it-works-copy";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { AI_SURFACES, type AiSurface } from "@/lib/ai/inventory";
import { getAiStatusState, type AiSurfaceState } from "@/lib/ai/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How Rivet works",
  description: "The interaction model, the evidence rules, the customise-feed semantics and the honest AI audit.",
};

function surfaceStatus(surface: AiSurface, state: AiSurfaceState | undefined): string {
  if (!surface.implemented) return "Not implemented";
  if (surface.id === "modal-fit") return "Not deployed; local fallback only";
  if (!surface.liveCapable) return "Deterministic default; exercised";
  if (!state) return "Implemented; no live run recorded";
  if (state.status === "live-with-evidence") return "Live with captured evidence";
  if (state.hasLiveRun) return "Live run recorded; no captured evidence";
  return "Implemented; not run live";
}

export default async function HowItWorksPage() {
  const aiState = await getAiStatusState();
  const surfaceById = new Map(aiState.surfaces.map((surface) => [surface.id, surface]));

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/enter?side=employer" className="text-[13px] font-medium text-accent transition hover:text-accent-deep">
            Review candidates <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 lg:px-8 lg:pt-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the concept
        </Link>
        <h1 className="mt-7 max-w-3xl font-display text-[clamp(3rem,6vw,5rem)] leading-[0.94] tracking-[-0.05em]">
          How Rivet works.
          <br />
          <span className="italic">Including what it does not do.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink-muted">
          Rivet is a two-sided recruitment-event prototype. It uses prompt profiles, mutual interest, a small free
          priority-intro allowance, and one factual master record that a candidate can tailor for one role. This page
          is the long version of every rule that appears only as a one-line note in the product.
        </p>

        <section id="loop" className="mt-14 border-t border-line pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The loop</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Both sides are legible.</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-3">
            {PAGE_STEPS.map((step) => (
              <div key={step.title} className="border-t border-line pt-4">
                <p className="font-display text-[28px] leading-none text-ink-faint">{step.n}</p>
                <p className="mt-3 text-[15px] font-semibold text-ink">{step.title}</p>
                <p className="mt-2 text-[13px] leading-6 text-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="interest" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <PriorityIntroIcon className="h-4 w-4" /> {PRIORITY_INTRO.plural}
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Interest, never an assessment of suitability.</h2>
          <div className="mt-5 grid gap-6 text-[14px] leading-7 text-ink-muted md:grid-cols-2">
            <div>
              <p>
                Every participant gets three free {PRIORITY_INTRO.plural.toLowerCase()} for the event. A{" "}
                {PRIORITY_INTRO.name.toLowerCase()} requires a one-line reason, counts as a yes on the sender&apos;s side,
                and appears in the recipient&apos;s inbox. Saying yes back creates a match.
              </p>
              <p className="mt-3">
                There is no score, no ranking, no purchase and no hidden penalty. The allowance is equal for
                candidates and employers. The reason is the point: it says “I would especially like to meet you”, not
                “you are suitable”.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[13px] font-medium text-ink">{PRIORITY_INTRO.explainer}</p>
              <p className="mt-3 text-[12px] leading-5 text-ink-muted">
                A priority intro cannot be bought. It never changes discovery order. Like and priority intro both
                count as a yes; pass never creates a match.
              </p>
            </div>
          </div>
        </section>

        <section id="evidence" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <Link2 className="h-4 w-4" /> Evidence
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Reachability is not truth. Provenance is separate.</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">Link status</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                A mechanical HEAD request asks whether the URL answers. The only labels are “Link works” and “Link
                unreachable”. A working link never means the claim is true, and an unreachable link says nothing about
                the person.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">Provenance</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                “Self-claimed” means the candidate supplied it. “Employer-confirmed” exists only as simulated seed
                data in this prototype. The AI schema has no provenance field, and extracted highlights are forced to
                Self-claimed at the write path.
              </p>
            </div>
          </div>
        </section>

        <section id="feed" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <CircleHelp className="h-4 w-4" /> Customise feed
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">A discovery filter, not a judgement.</h2>
          <div className="mt-5 space-y-3 text-[14px] leading-7 text-ink-muted">
            <p>
              A recruiter describes the people they want to see. The request becomes visible, editable criteria before
              anything is applied. The rules parser is the default; an optional Gemini path exists behind an explicit
              environment flag and has never run live in this checkout.
            </p>
            <p>
              Matching uses only the facts on the candidate&apos;s profile — never the name, avatar, location or protected
              traits. A skill that is not stated is <strong className="font-medium text-ink">unknown</strong>, not a
              failure: those profiles stay visible in the Not stated section. A profile that states otherwise goes to
              Outside your criteria, still visible, with a one-tap broaden and reset. Related skills are labelled
              “related”, never counted as an exact match.
            </p>
            <p>
              Experience durations count only dated roles and projects that explicitly list the skill, merge
              overlapping periods, and never infer a skill&apos;s duration from the length of a role that merely mentions
              it. Self-described years are shown separately and are not added to dated evidence.
            </p>
            <p>
              The human makes every decision. The feed never evaluates a person&apos;s worth and never auto-rejects.
              Criteria are not stored in the database; reloading or reseeding resets them.
            </p>
          </div>
        </section>

        <section id="ai" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="h-4 w-4" /> AI in this flow
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">The model is a tool. The record is the source.</h2>
          <p className="mt-4 max-w-3xl text-[14px] leading-7 text-ink-muted">
            This table is generated from the code inventory plus actual state: recent AiRun rows and the committed
            live-evidence manifest. In this checkout there are no keys and no captured live output, so every live-capable
            surface is <strong className="font-medium text-ink">implemented, not run live</strong>, and the runtime uses
            deterministic fallbacks. No model-vs-fallback superiority is claimed without captured output.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                  <th className="px-5 py-3 font-semibold">Surface</th>
                  <th className="px-4 py-3 font-semibold">Provider / exact model</th>
                  <th className="px-4 py-3 font-semibold">Status in this checkout</th>
                  <th className="px-4 py-3 pr-5 font-semibold">Fallback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-[12px] leading-5 text-ink-muted">
                {AI_SURFACES.map((surface) => (
                  <tr key={surface.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{surface.name}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-ink-faint">{surface.callPath}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{surface.provider}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-ink-faint">{surface.model}</p>
                    </td>
                    <td className="px-4 py-4">{surfaceStatus(surface, surfaceById.get(surface.id))}</td>
                    <td className="px-4 py-4 pr-5">{surface.fallback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> What AI is not allowed to touch
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-ink-muted">
                <li>No likes, passes, priority intros, matches, rejections or ranking.</li>
                <li>No provenance upgrade. Extracted facts are Self-claimed.</li>
                <li>No invented experience, employer, metric or URL in tailoring.</li>
                <li>No decision about a person; a human approves every shared line.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <BadgeCheck className="h-4 w-4 text-accent" /> Gemma: not implemented
              </p>
              <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                Gemini and Gemma are different Google model families. No Gemma model ID, client, route, prompt or
                validation exists in this repository. Adding one would be a new integration surface with no
                demonstrated task gain; the existing live-capable surfaces still have no captured live output. It is
                not added just to tick a box. The full inventory is in AI-AUDIT.md.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[12px] leading-5 text-ink-faint">
            The optional live paths read NVIDIA_API_KEY or GEMINI_API_KEY only on the server. No key is required for
            this demo, no key is committed, and no paid call is made. The customise-feed live parser is opt-in with
            RIVET_FEED_PARSER=gemini; the rules parser is the default.
          </p>
        </section>

        <section id="limits" className="mt-14 border-t border-line pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Honest limits</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">What is simulated and what is out of scope.</h2>
          <div className="mt-5 grid gap-4 text-[13px] leading-6 text-ink-muted sm:grid-cols-2">
            <p>
              All candidates, employers, evidence artifacts, confirmations and messages are fictional seed data. No
              real verification is performed. Photos of people are not used; the project images are generated locally
              and labelled synthetic.
            </p>
            <p>
              There is no real authentication, messaging transport, payment, file upload or deployment. The session is
              a demo cookie. The link checker uses external placeholder URLs and can legitimately show “Link
              unreachable” offline.
            </p>
            <p>
              No live NVIDIA, Gemini or Modal call has been executed in this checkout. The live code paths are
              implemented, validated with mocked HTTP tests and left optional. The audit measures deterministic
              fallback output only.
            </p>
            <p>
              The feed is intentionally soft: unknown stays visible, related is labelled and explicit under-bar
              evidence is visible outside. The full profile is only reachable after the employer expresses interest.
              The one-screen no-scroll goal is aspirational; readable type and complete facts take priority.
            </p>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Link href="/enter?side=employer" className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white">
            Review candidates <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/enter?side=candidate" className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-ink">
            Browse roles
          </Link>
        </div>

        <div className="mt-8">
          <AiStatusLine showLink={false} />
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-6 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Synthetic demo data. No real people, employers, evidence or confirmations.</p>
          <div className="flex gap-4">
            <Link href="/" className="transition hover:text-ink">Concept</Link>
            <Link href="/enter" className="transition hover:text-ink">Open the demo</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
