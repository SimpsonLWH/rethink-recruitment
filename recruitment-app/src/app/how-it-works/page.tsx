import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, CircleHelp, ClipboardCheck, Link2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { AiStatusLine } from "@/components/brand/ai-status-line";
import { Logo } from "@/components/brand/logo";
import { PAGE_STEPS } from "@/lib/how-it-works-copy";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { AI_SURFACES, type AiSurface } from "@/lib/ai/inventory";
import { getAiStatusState, type AiSurfaceState } from "@/lib/ai/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How Rivet works",
  description: "Pre-screening, verified work samples, checkable claims, human decisions and the honest AI audit.",
};

function surfaceStatus(surface: AiSurface, state: AiSurfaceState | undefined): string {
  if (!surface.implemented) return "Not implemented";
  if (!surface.liveCapable) return "Deterministic default; exercised";
  if (!state) return "Implemented; no live run recorded";
  if (state.status === "live-with-evidence") return "Live with captured evidence";
  if (state.hasLiveRun) return "Live run recorded; no captured evidence";
  return "Implemented; not run live";
}

export default async function HowItWorksPage() {
  const aiState = await getAiStatusState();
  const surfaceById = new Map(aiState.surfaces.map((surface) => [surface.id, surface]));
  const liveSurfaces = aiState.surfaces.filter((surface) => surface.status === "live-with-evidence");
  const liveSummary =
    liveSurfaces.length > 0
      ? liveSurfaces.length +
        " surface" +
        (liveSurfaces.length === 1 ? "" : "s") +
        " has a live run with captured evidence (" +
        liveSurfaces.map((surface) => surface.name).join(", ") +
        "); every other live-capable surface is implemented with a deterministic fallback."
      : "In this checkout there are no captured live outputs, so every live-capable surface is implemented, not run live, and the runtime uses deterministic fallbacks.";
  const liveLimitCopy =
    liveSurfaces.length > 0
      ? "Live model calls are claimed only where the status table above says live with captured evidence. A configured key alone is not a live claim; the remaining paths stay deterministic."
      : "No live NVIDIA or Gemini call has been executed in this checkout. The live code paths are implemented, validated with mocked HTTP tests and left optional.";

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 lg:px-8">
        <Link href="/" aria-label="Rivet home">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/enter" className="text-[13px] font-medium text-accent transition hover:text-accent-deep">
            Sign in <ArrowRight className="inline h-3.5 w-3.5" />
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
          Rivet is an interviewer&apos;s pre-screening tool built for the AI-CV era. A role card states the bar; a short
          work sample and a checkable record show what a person can do; the reviewer gets a conversation kit and records a
          decision with a reason. The two-sided event flow still exists, but the pre-screen is where the work happens.
          This page is the long version of every rule that appears only as a one-line note in the product.
        </p>

        <section id="accounts" className="mt-14 border-t border-line pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Two flows</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Pick a side. The product changes with you.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">Candidate</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                Create an account, start from a sample record, then land on a dashboard built around evidence. A CV is optional context.
                Browse roles, take assessments, respond to invitations and read honest outcomes.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">Hiring team</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                Create an account, state the assessments and scores you accept, then land on a dashboard built around
                the role. Review evidence, discover opted-in non-swipers and move matches through simple stages.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-ink-faint">
            Both sides can use a sample account without creating one. Temporary accounts are demo-only.
          </p>
        </section>

        <section id="loop" className="mt-14 border-t border-line pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The loop</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Both sides are legible.</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                Every participant gets one free {PRIORITY_INTRO.name} for the event. It requires a
                one-line reason, counts as a yes on the sender&apos;s side, and appears in the recipient&apos;s inbox.
                Saying yes back creates a match. Ordinary Likes are limited too: five for a candidate and ten for an
                employer in this demo.
              </p>
              <p className="mt-3">
                A reply to a Priority intro, an accepted invitation, or a review response does not consume a Like. There
                is no purchase and no hidden penalty. The reason is the point: it says “I would especially like to meet
                you”, not “you are suitable”.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[13px] font-medium text-ink">{PRIORITY_INTRO.explainer}</p>
              <p className="mt-3 text-[12px] leading-5 text-ink-muted">
                A Priority intro cannot be bought. It never changes discovery order. Like and Priority intro both
                count as a yes; pass never creates a match.
              </p>
            </div>
          </div>
        </section>

        <section id="prescreen" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <ShieldCheck className="h-4 w-4" /> The pre-screen
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">The CV is AI-written and AI-read. Remove it from the loop.</h2>
          <div className="mt-5 grid gap-6 text-[14px] leading-7 text-ink-muted md:grid-cols-2">
            <div>
              <p>
                Rivet does not try to guess whether a CV was written by a model. AI-text detection is unreliable, and
                penalising someone for using a writing tool is not a hiring signal. It also does not scan CV prose for
                keywords: that is a mirror of the job description, not evidence of work.
              </p>
              <p className="mt-3">
                Instead, the reviewer sees a short record: an exact work-sample result against the stated bar, claims with
                their artifacts and link status, and any employer confirmation that exists. Every claim is labelled
                checked, artifact-only, for conversation, or still prose. Nothing is silently promoted to evidence.
              </p>
              <p className="mt-3">
                The pack prepares a time-boxed conversation kit and a criterion scorecard. It never recommends an outcome
                and never changes a match. A human rates the criteria, writes a reason, and records the decision. The
                audit trail keeps the author, the time and the basis.
              </p>
            </div>
            <div className="space-y-3">
              {[
                ["No AI detector", "No document is classified as AI-written. The product has no detector surface."],
                ["No keyword filter", "A claim is not matched to a job description by vocabulary. It is checked against an artifact or left open."],
                ["No person score", "There is no single number for a candidate. Evidence coverage is a property of the record, not of the person."],
                ["No automatic rejection", "Closing a pre-screen requires a reason and a confirmation. A below-bar score stays visible and is context, not a verdict."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-[13px] font-semibold text-ink">{title}</p>
                  <p className="mt-1.5 text-[12px] leading-5 text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="assessments" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <ClipboardCheck className="h-4 w-4" /> Assessments and role cards
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">One exact assessment. One stated bar. A human decision.</h2>
          <div className="mt-5 grid gap-6 text-[14px] leading-7 text-ink-muted md:grid-cols-2">
            <div>
              <p>
                Candidates take a short online assessment: a small set of coding problems marked against hidden tests
                by the server. The result is recorded against the exact family, version and difficulty. A score from
                JavaScript v1 Medium is never compared with Algorithms v1 Advanced, or with a different version.
              </p>
              <p className="mt-3">
                One attempt per recruiting cycle. There is no retake, no cooldown and no second sitting. Submission is
                final for that assessment. The rule is a demo default, not a validated instrument. The problems are not
                proctored, the marker is not a production code sandbox, and a score is not treated as proof of future
                performance.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[13px] font-medium text-ink">What the employer states</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                A role card names one playable assessment version, a required score, and up to four structured
                experience signals. The feed shows the candidate&apos;s final score against that bar and the matching
                evidence. A below-bar result goes to a visible secondary view, not a silent reject pile, and the
                assessment itself stays closed for the cycle.
              </p>
              <p className="mt-3 text-[12px] leading-5 text-ink-faint">
                The score is never averaged across assessments, turned into a match percentage, or used to rank people.
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
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="text-[14px] font-semibold text-ink">Link status</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                A mechanical HEAD request asks whether the URL answers. The only labels are “Link works” and “Link
                unreachable”. A working link never means the claim is true, and an unreachable link says nothing about
                the person.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
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
            <CircleHelp className="h-4 w-4" /> Mixed feed and discovery
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">Present the evidence. Let the human decide.</h2>
          <div className="mt-5 space-y-3 text-[14px] leading-7 text-ink-muted">
            <p>
              Each side&apos;s feed mixes two cohorts internally: people who already expressed interest and people who did
              not. The mix is fixed at one-to-one for the demo and shuffled deterministically. The cohort is never
              labelled and is not sent to the client. A card appears because of its evidence, not because someone liked
              you.
            </p>
            <p>
              Candidates who meet the stated assessment bar appear in the main feed. Candidates with no assessment yet
              stay visible in a no-evidence section. Candidates below the bar stay in a labelled secondary view with
              their evidence. None of these are auto-rejections.
            </p>
            <p>
              Experience signals use the structured facts only — never a name, avatar, location, nationality, language,
              education or inferred protected trait. A signal that is not stated is unknown, not a failure. A related
              skill is labelled related and never counted as exact.
            </p>
            <p>
              Recruiter discovery is separate: it lists opted-in candidates who have not swiped on the role and who meet
              the assessment bar. An invitation is a message; it does not create an application, booking or match.
            </p>
          </div>
        </section>

        <section id="outcomes" className="mt-14 border-t border-line pt-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            <Mail className="h-4 w-4" /> Invitations, outcomes and next steps
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-tight">A message is not a match. An outcome is not a review claim.</h2>
          <div className="mt-5 space-y-3 text-[14px] leading-7 text-ink-muted">
            <p>
              Accepting an invitation records the candidate&apos;s interest. It is a yes, but it is not a match. A match
              needs the recruiter&apos;s explicit yes too; if the recruiter had already said yes, acceptance can complete
              the match. Declining or ignoring the invitation never creates an application.
            </p>
            <p>
              When a recruiter passes on a candidate who expressed interest, the candidate receives a short update. A
              role close and a match close use different wording. Only a closed conversation may say “after your
              conversation”; no message claims a review that did not happen.
            </p>
            <p>
              Matches move through a lightweight stage list: intro call, event-day meeting, interview, closed. Closing a
              match sends the after-conversation update. This is not an ATS and does not book meetings automatically.
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
            live-evidence manifest. {liveSummary} No model-vs-fallback superiority is claimed without captured output.
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
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
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> What AI is not allowed to touch
              </p>
              <ul className="mt-3 space-y-2 text-[13px] leading-6 text-ink-muted">
                <li>No assessment scoring, thresholds, feed order, likes, passes, Priority intros, matches, outcomes or ranking. The evidence reading is advisory and cannot change any of them.</li>
                <li>No provenance upgrade. Extracted facts are Self-claimed.</li>
                <li>No invented experience, employer, metric or URL in tailoring.</li>
                <li>No decision about a person; a human approves every shared line and makes the decision.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <BadgeCheck className="h-4 w-4 text-accent" /> Gemma: not implemented
              </p>
              <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                Gemini and Gemma are different Google model families. No Gemma model ID, client, route, prompt or
                validation exists in this repository. Adding one would be a new integration surface with no
                demonstrated task gain. It is not added just to tick a box. The full inventory is in AI-AUDIT.md.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[12px] leading-5 text-ink-faint">
            The live paths read NVIDIA_API_KEY or GEMINI_API_KEY only on the server. No key is required for this
            demo, no key is committed, and no paid call is made without one. The customise-feed live parser is
            opt-in with RIVET_FEED_PARSER=gemini; the rules parser is the default.
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
            <p>{liveLimitCopy}</p>
            <p>
              The feed is intentionally soft: unknown stays visible, related is labelled and below-bar evidence is
              visible in a secondary view. The full profile is only reachable after the employer expresses interest.
              The one-screen no-scroll goal is aspirational; readable type and complete facts take priority.
            </p>
            <p>
              Assessments are synthetic, unproctored and unvalidated. The one-attempt rule, the hidden-test marker and
              the Like caps are demo defaults. The marker executes submitted code in a Node vm, which is not a production
              code sandbox. No legal-compliance or bias-elimination claim is made. The human-review route for below-bar
              candidates is a design proposal under mentor review, not a settled answer.
            </p>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Link href="/enter" className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-white">
            Sign in to Rivet <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/signup?side=candidate" className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-5 text-sm font-medium text-ink">
            Create candidate account
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