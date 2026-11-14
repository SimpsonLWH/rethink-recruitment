import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Ban,
  Check,
  Database,
  EyeOff,
  Link2,
  ListChecks,
  Lock,
  MessageCircleQuestion,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { Card } from "@/components/ui/card";
import { getRepository, type AiRunView } from "@/lib/repo";
import {
  DEFAULT_GEMINI_MODEL,
  NEMOTRON_BASE_URL,
  NEMOTRON_MODEL,
  geminiModel,
  isGeminiConfigured,
  isModalConfigured,
  isNvidiaConfigured,
} from "@/lib/ai/config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About the AI",
  description: "Exactly where AI helps in Rivet, where it is forbidden, and how the demo behaves without keys.",
};

function formatRun(run: AiRunView) {
  return new Date(run.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AboutAiPage() {
  const nvidia = isNvidiaConfigured();
  const gemini = isGeminiConfigured();
  const modal = isModalConfigured();
  let runs: AiRunView[] = [];
  try {
    runs = await getRepository().getRecentAiRuns(8);
  } catch {
    runs = [];
  }
  const lastLive = runs.find((run) => run.mode === "LIVE");
  const liveMode = lastLive?.provider === "gemini" ? "Gemini" : lastLive ? "Nemotron" : null;
  const anyKey = nvidia || gemini;

  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" aria-label="Rivet home"><Logo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/enter" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[11px] font-semibold text-paper">Enter the demo <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-8 lg:px-8 lg:pt-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to the concept</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted"><span className="h-1.5 w-1.5 rounded-full bg-rose" /> About the AI</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(3rem,6vw,5.2rem)] leading-[0.95] tracking-[-0.05em]">The model is a tool.<br /><span className="italic text-rose">The record is the source.</span></h1>
            <p className="mt-5 max-w-xl text-[14px] leading-7 text-ink-muted">Rivet uses AI for two useful, bounded jobs: finding grounded highlights and suggesting how to present existing facts. It does not score people, decide matches, or verify claims. This page is the honest map.</p>
          </div>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Current AI mode</p>
              <AiStatusChip />
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-paper/60 p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Primary model</p>
              <p className="mt-1 break-all font-mono text-[11px] font-semibold text-ink">{NEMOTRON_MODEL}</p>
              <p className="mt-1 break-all text-[10px] text-ink-muted">{NEMOTRON_BASE_URL}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className={cn("rounded-full border px-2.5 py-1 text-[9px] font-semibold", nvidia ? "border-moss/25 bg-moss/10 text-moss" : "border-line bg-paper text-ink-muted")}>{nvidia ? "NVIDIA key configured" : "No NVIDIA key"}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-[9px] font-semibold", gemini ? "border-moss/25 bg-moss/10 text-moss" : "border-line bg-paper text-ink-muted")}>{gemini ? "Gemini key configured" : "No Gemini key"}</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-ink-muted">{liveMode ? "A live call has succeeded. The status chip reflects the most recent AI run; any failed call returns to the deterministic fallback." : anyKey ? "A key is present, but no live call has succeeded yet. The deterministic fallback remains active until one does." : "No AI keys are present. Every AI surface is running the deterministic local fallback, and the whole demo is still clickable."}</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "Highlight extraction", body: "Turns a longer free-text answer into a few structured highlights: skill, claim, and a link only if that URL is literally in the answer. You review before saving.", engine: "Nemotron 3.5 Super VL · fallback: local extraction" },
            { icon: ListChecks, title: "Tailoring suggestions", body: "Given your existing facts and one role, proposes what to foreground and how to reword it. Every suggestion must cite source fact IDs, and the UI shows them next to the line.", engine: "Nemotron 3.5 Super VL · fallback: local templates" },
            { icon: MessageCircleQuestion, title: "Profile Q&A", body: "An employer can ask a candidate's record a question. The answer must cite facts from that record, and an out-of-record question gets a refusal, not a guess.", engine: "Gemini · fallback: local sourced retrieval" },
          ].map((feature) => (
            <Card key={feature.title} className="p-5">
              <feature.icon className="h-5 w-5 text-rose" />
              <h2 className="mt-4 font-display text-[24px] leading-tight">{feature.title}</h2>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">{feature.body}</p>
              <p className="mt-4 border-t border-line pt-3 text-[9px] font-medium uppercase tracking-[0.06em] text-ink-faint">{feature.engine}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-paper/45">Hard constraints</p>
            <h2 className="mt-4 max-w-sm font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.02]">What AI is not allowed to touch.</h2>
            <p className="mt-5 max-w-sm text-[12px] leading-6 text-paper/55">These constraints are implemented in prompts, schemas, server validation, and the database write path — not just stated in a slide.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-paper/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.11em] text-paper/65"><Ban className="h-3.5 w-3.5 text-rose" /> No automation decides a person</div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-paper/10 bg-paper/10 sm:grid-cols-2">
            {[
              { icon: BadgeCheck, title: "Provenance", body: "The model schema has no provenance field, and the persistence layer forces AI-extracted facts to Self-claimed." },
              { icon: Link2, title: "Evidence URLs", body: "An extracted link must appear literally in the source answer. A tailored line may not introduce a URL that is not in its source facts." },
              { icon: ShieldCheck, title: "Decisions", body: "AI never likes, passes, roses, matches, rejects, or ranks a profile. Every decision is a human click recorded in the database." },
              { icon: EyeOff, title: "The master record", body: "Tailoring only selects and rewords existing facts. It cannot add experience, change employers, or upgrade a label." },
            ].map((item) => (
              <div key={item.title} className="bg-ink p-5">
                <item.icon className="h-4 w-4 text-rose" />
                <p className="mt-4 font-display text-[21px] leading-tight text-paper">{item.title}</p>
                <p className="mt-2 text-[11px] leading-5 text-paper/55">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">How the output is contained</p>
            <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.03]">Small prompts. Strict shapes. Human gates.</h2>
            <p className="mt-4 max-w-sm text-[12px] leading-6 text-ink-muted">The model gets only the facts needed for one task, returns JSON against a schema, and is validated again on the server. Failure is a fallback, not a crash.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Lock, title: "Zod-validated JSON", body: "Strict response schemas reject malformed output, unknown source IDs, invented links, and provenance fields." },
              { icon: RefreshCw, title: "Retries + repair", body: "429/5xx errors retry with exponential backoff and jitter. Invalid JSON gets one repair attempt, then a deterministic fallback." },
              { icon: Database, title: "Cache, not spam", body: "Responses are cached by SHA-256 for 24 hours, keeping prompts small and respecting the hosted free tier." },
              { icon: Server, title: "Server-only keys", body: "No AI key is exposed to the client. Missing or broken configuration never blocks the demo." },
              { icon: Check, title: "Approval gate", body: "A tailored version is not shareable until the candidate approves at least one line. Rejected lines disappear." },
              { icon: ShieldCheck, title: "No truth claims", body: "Reachability is a link check. It never becomes a truth score, a verification, or a hiring signal." },
            ].map((item) => (
              <div key={item.title} className="rounded-[20px] border border-line bg-surface p-4">
                <item.icon className="h-4 w-4 text-rose" />
                <p className="mt-3 text-[11px] font-semibold text-ink">{item.title}</p>
                <p className="mt-1.5 text-[10px] leading-5 text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 lg:px-8 lg:pb-20">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-[#F3EDE4] px-5 py-4 sm:px-7">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Integration status · this exact checkout</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-[8.5px] uppercase tracking-[0.1em] text-ink-faint">
                  <th className="px-5 py-3 font-semibold sm:px-7">Integration</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Live status now</th>
                  <th className="px-4 py-3 pr-7 font-semibold">Demo fallback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-[11px] text-ink-muted">
                <tr>
                  <td className="px-5 py-4 sm:px-7"><p className="font-semibold text-ink">NVIDIA Nemotron</p><p className="mt-0.5 text-[9.5px]">Model: nvidia/nemotron-3.5-super-vl-120b-a12b</p></td>
                  <td className="px-4 py-4">Implemented</td>
                  <td className="px-4 py-4">{nvidia ? "Key configured; verified calls appear in last runs" : "Not configured — live path cannot be tested"}</td>
                  <td className="px-4 py-4 pr-7">Deterministic extraction and tailoring templates; exercised in every no-key demo.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 sm:px-7"><p className="font-semibold text-ink">Google Gemini</p><p className="mt-0.5 text-[9.5px]">Default: {geminiModel() || DEFAULT_GEMINI_MODEL}</p></td>
                  <td className="px-4 py-4">Implemented</td>
                  <td className="px-4 py-4">{gemini ? "Key configured; verified calls appear in last runs" : "Not configured — live path cannot be tested"}</td>
                  <td className="px-4 py-4 pr-7">Local retrieval answers only from the record and cites facts.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 sm:px-7"><p className="font-semibold text-ink">Modal</p><p className="mt-0.5 text-[9.5px]">Python batch fit briefs</p></td>
                  <td className="px-4 py-4">Implemented</td>
                  <td className="px-4 py-4">{modal ? "Tokens configured; deploy/run is still a manual step" : "Not deployed — no Modal tokens"}</td>
                  <td className="px-4 py-4 pr-7">Local TS batch computes the advisory fit briefs shown after a match.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 sm:px-7"><p className="font-semibold text-ink">Everything else</p></td>
                  <td className="px-4 py-4">Skipped</td>
                  <td className="px-4 py-4">No forced bolt-ons</td>
                  <td className="px-4 py-4 pr-7">Aiven, Context.dev, CRACI, Cloudinary, ElevenLabs, Verda, Entire and Codex are documented as skipped in the repo README.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><Server className="h-3.5 w-3.5 text-rose" /> Optional environment</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">No environment variable is required. The app works with none of these set; they only enable live integrations.</p>
            <div className="mt-3 grid gap-1.5 font-mono text-[10px] text-ink-soft">
              {["NVIDIA_API_KEY", "GEMINI_API_KEY", "GEMINI_MODEL", "MODAL_TOKEN_ID", "MODAL_TOKEN_SECRET"].map((name) => (
                <p key={name} className="rounded-lg border border-line bg-paper/60 px-2.5 py-1.5">{name} <span className="font-sans text-ink-faint">— optional</span></p>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><Database className="h-3.5 w-3.5 text-rose" /> Last AI runs</p>
            {runs.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-4 text-[10.5px] text-ink-faint">No AI runs recorded in this reseed yet. Try highlight extraction or tailoring and return here.</p>
            ) : (
              <div className="mt-2.5 divide-y divide-line">
                {runs.slice(0, 5).map((run) => (
                  <div key={run.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[10.5px] font-semibold text-ink">{run.kind} · {run.provider}</p>
                      <p className="truncate text-[9px] text-ink-faint">{run.model} · {formatRun(run)}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-2 py-1 text-[8.5px] font-bold uppercase tracking-[0.08em]", run.mode === "LIVE" ? "border-moss/25 bg-moss/10 text-moss" : "border-line bg-paper text-ink-muted")}>{run.mode === "LIVE" ? "Live" : "Fallback"}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 border-t border-line pt-3 text-[9.5px] leading-4 text-ink-faint">Run logs record provider, mode, and result. They do not store prompts, keys, or profile text.</p>
          </Card>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Logo compact />
            <p className="text-[10px] leading-4 text-ink-muted">Synthetic demo data. No real people, employers, evidence, or confirmations.</p>
          </div>
          <div className="flex items-center gap-4 text-[10.5px] font-semibold text-ink-muted">
            <Link href="/" className="transition hover:text-ink">Concept</Link>
            <Link href="/enter" className="transition hover:text-ink">Enter demo</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
