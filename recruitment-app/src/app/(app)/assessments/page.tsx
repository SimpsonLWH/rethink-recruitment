import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, CircleDashed, Info, ListChecks, Timer } from "lucide-react";
import { Note } from "@/components/brand/note";
import { ProctoringChip } from "@/components/assessments/integrity-badge";
import { getRepository, type AssessmentResultView, type AssessmentSummary } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { assessmentTitle } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessments",
  description: "Coding, quant and aptitude assessments marked against hidden tests. One attempt per recruiting cycle.",
};

type Filters = { track?: string; difficulty?: string; status?: string; format?: string };

const DIFFICULTIES = [
  { value: "EASY", label: "Easy", tone: "text-emerald-700" },
  { value: "MEDIUM", label: "Medium", tone: "text-amber-700" },
  { value: "ADVANCED", label: "Hard", tone: "text-rose-700" },
];

const FORMATS = [
  { value: "untimed", label: "Untimed" },
  { value: "timed", label: "Timed" },
  { value: "proctored", label: "Proctored" },
  { value: "lockdown", label: "Browser lockdown" },
];

const STATUSES = [
  { value: "todo", label: "Not started" },
  { value: "open", label: "In progress" },
  { value: "done", label: "Completed" },
];

function difficultyMeta(value: string) {
  return DIFFICULTIES.find((entry) => entry.value === value) ?? DIFFICULTIES[1];
}

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function statusOf(result: AssessmentResultView | undefined): "todo" | "open" | "done" {
  if (result?.score !== null && result?.score !== undefined) return "done";
  if (result?.openAttemptId) return "open";
  return "todo";
}

function matchesFormat(assessment: AssessmentSummary, format: string | undefined) {
  if (!format) return true;
  if (format === "untimed") return assessment.durationMinutes === 0;
  if (format === "timed") return assessment.durationMinutes > 0;
  if (format === "proctored") return assessment.proctoring === "PROCTORED";
  if (format === "lockdown") return assessment.proctoring === "LOCKDOWN";
  return true;
}

function hrefWith(filters: Filters, key: keyof Filters, value: string | undefined) {
  const next: Filters = { ...filters, [key]: value };
  const params = new URLSearchParams();
  for (const [name, entry] of Object.entries(next)) if (entry) params.set(name, entry);
  const query = params.toString();
  return "/assessments" + (query ? "?" + query : "");
}

function FilterGroup({
  title,
  filters,
  name,
  options,
}: {
  title: string;
  filters: Filters;
  name: keyof Filters;
  options: Array<{ value: string; label: string; count?: number }>;
}) {
  const current = filters[name];
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{title}</p>
      <ul className="mt-2 space-y-0.5">
        {options.map((option) => {
          const active = current === option.value;
          return (
            <li key={option.value}>
              <Link
                href={hrefWith(filters, name, active ? undefined : option.value)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px] transition",
                  active ? "bg-accent-tint font-medium text-accent-deep" : "text-ink-soft hover:bg-paper",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      active ? "border-accent bg-accent text-white" : "border-line-strong bg-surface",
                    )}
                    aria-hidden
                  >
                    {active ? <CheckCircle2 className="h-3 w-3" /> : null}
                  </span>
                  {option.label}
                </span>
                {typeof option.count === "number" ? <span className="text-[12px] tabular-nums text-ink-faint">{option.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const session = await getSession();
  if (!session) return null;
  const filters = await searchParams;
  const candidate = session.side === "candidate";

  const repo = getRepository();
  const [catalog, results] = await Promise.all([
    repo.getAssessmentCatalog(),
    candidate ? repo.getAssessmentResults(session.candidate.id) : Promise.resolve([] as AssessmentResultView[]),
  ]);
  const resultByAssessment = new Map(results.map((result) => [result.assessment.id, result] as const));
  const playable = catalog.filter((assessment) => assessment.playable);
  const tracks = Array.from(new Set(playable.map((assessment) => assessment.family)));

  const visible = playable.filter((assessment) => {
    if (filters.track && assessment.family !== filters.track) return false;
    if (filters.difficulty && assessment.difficulty !== filters.difficulty) return false;
    if (!matchesFormat(assessment, filters.format)) return false;
    if (candidate && filters.status && statusOf(resultByAssessment.get(assessment.id)) !== filters.status) return false;
    return true;
  });

  const completed = playable.filter((assessment) => statusOf(resultByAssessment.get(assessment.id)) === "done").length;
  const inProgress = playable.filter((assessment) => statusOf(resultByAssessment.get(assessment.id)) === "open").length;
  const anyFilter = Boolean(filters.track || filters.difficulty || filters.status || filters.format);

  return (
    <div className="animate-fade-up" data-testid="assessments-page">
      <div className="overflow-hidden rounded-xl bg-navy text-white">
        <div className="flex flex-wrap items-end justify-between gap-6 px-6 py-7 sm:px-8">
          <div className="max-w-xl">
            <h1 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em]">
              {candidate ? "Assessments" : "Test library"}
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-white/75">
              {candidate
                ? "Coding, quant and aptitude tests marked against hidden tests and answer keys. One sitting each per recruiting cycle, so practise first."
                : "Every test a role card can require. Candidates sit each once per cycle; you see the exact version, score, timing and proctoring record."}
            </p>
          </div>
          {candidate ? (
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white/10 text-center">
              {[
                { label: "Available", value: playable.length },
                { label: "In progress", value: inProgress },
                { label: "Completed", value: completed },
              ].map((stat) => (
                <div key={stat.label} className="bg-navy-soft px-4 py-3">
                  <dd className="text-[22px] font-semibold tabular-nums">{stat.value}</dd>
                  <dt className="text-[11px] text-white/65">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : (
            <Link href="/roles" className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent-bright px-4 text-[13px] font-semibold text-navy hover:bg-white">
              Use one in a role card <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-20 lg:self-start" aria-label="Filters">
          {candidate ? (
            <FilterGroup
              title="Status"
              filters={filters}
              name="status"
              options={STATUSES.map((status) => ({
                ...status,
                count: playable.filter((assessment) => statusOf(resultByAssessment.get(assessment.id)) === status.value).length,
              }))}
            />
          ) : null}
          <FilterGroup
            title="Track"
            filters={filters}
            name="track"
            options={tracks.map((track) => ({ value: track, label: track, count: playable.filter((assessment) => assessment.family === track).length }))}
          />
          <FilterGroup
            title="Difficulty"
            filters={filters}
            name="difficulty"
            options={DIFFICULTIES.map((difficulty) => ({
              value: difficulty.value,
              label: difficulty.label,
              count: playable.filter((assessment) => assessment.difficulty === difficulty.value).length,
            }))}
          />
          <FilterGroup
            title="Format"
            filters={filters}
            name="format"
            options={FORMATS.map((format) => ({ ...format, count: playable.filter((assessment) => matchesFormat(assessment, format.value)).length }))}
          />
          {anyFilter ? (
            <Link href="/assessments" className="block text-[13px] font-medium text-accent hover:text-accent-deep">
              Clear filters
            </Link>
          ) : null}
        </aside>

        <section aria-labelledby="assessment-list">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="assessment-list" className="text-[15px] font-semibold text-ink">
              {visible.length} {visible.length === 1 ? "test" : "tests"}
              {anyFilter ? " match your filters" : ""}
            </h2>
            {candidate ? (
              <Link href="/learn" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-deep">
                <BookOpen className="h-3.5 w-3.5" /> Practise before you sit one
              </Link>
            ) : null}
          </div>

          <div className="mt-3 space-y-3">
            {visible.map((assessment) => {
              const result = resultByAssessment.get(assessment.id);
              const status = statusOf(result);
              const difficulty = difficultyMeta(assessment.difficulty);
              const detailHref = "/assessments/" + assessment.id;
              return (
                <article
                  key={assessment.id}
                  className="group flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card sm:flex-row sm:items-center"
                  data-testid={"assessment-row-" + assessment.slug}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold leading-snug text-ink">
                      <Link href={detailHref} className="hover:text-accent">
                        {assessmentTitle(assessment.title)}
                      </Link>
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-muted">
                      <span className={cn("font-semibold", difficulty.tone)}>{difficulty.label}</span>
                      <span aria-hidden>·</span>
                      <span>{assessment.family}</span>
                      <span aria-hidden>·</span>
                      <span>
                        {assessment.problemCount} {assessment.problemCount === 1 ? "question" : "questions"}
                      </span>
                      <span aria-hidden>·</span>
                      <span>Version {assessment.version}</span>
                    </p>
                    <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-soft">{assessment.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <ProctoringChip mode={assessment.proctoring} durationMinutes={assessment.durationMinutes} />
                      {assessment.topics.map((topic) => (
                        <span key={topic} className="rounded-md bg-paper px-2 py-0.5 text-[11px] text-ink-muted">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 border-t border-line pt-3 sm:w-[190px] sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    {candidate ? (
                      status === "done" ? (
                        <div className="text-right">
                          <p className="flex items-center justify-end gap-1.5 text-[12px] font-semibold text-accent">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Final score
                          </p>
                          <p className="text-[22px] font-semibold tabular-nums text-ink">
                            {result?.score}
                            <span className="text-[13px] font-medium text-ink-faint">/100</span>
                          </p>
                          {result?.lastSubmittedAt ? (
                            <p className="text-[11px] text-ink-faint">Submitted {dateLabel(result.lastSubmittedAt)}</p>
                          ) : null}
                        </div>
                      ) : status === "open" ? (
                        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700">
                          <Timer className="h-3.5 w-3.5" /> In progress
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
                          <CircleDashed className="h-3.5 w-3.5" /> Not started
                        </p>
                      )
                    ) : (
                      <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted">
                        <ListChecks className="h-3.5 w-3.5" /> {assessment.roleFamily}
                      </p>
                    )}
                    <Link
                      href={status === "done" && result?.attemptId ? "/assessments/attempts/" + result.attemptId : detailHref}
                      className={cn(
                        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition sm:w-full",
                        !candidate || status === "done"
                          ? "border border-line text-ink hover:bg-paper"
                          : "bg-accent text-white hover:bg-accent-deep",
                      )}
                    >
                      {!candidate ? "View details" : status === "done" ? "View result" : status === "open" ? "Continue" : "Start test"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
            {visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
                <p className="text-[14px] font-medium text-ink">No tests match these filters.</p>
                <Link href="/assessments" className="mt-2 inline-block text-[13px] font-medium text-accent">
                  Clear filters
                </Link>
              </div>
            ) : null}
          </div>

          {candidate ? (
            <Note className="mt-6">
              <span className="font-medium text-ink">One shot per test.</span> Run the sample cases as often as you like,
              then submit once. Timed tests keep running if you leave. Lockdown tests need fullscreen and block copy and
              paste; nothing uses your camera.
            </Note>
          ) : null}

          <p className="mt-4 flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Scores are not interchangeable across families, versions or difficulties. There is no universal person
            score, percentile or match percentage.
          </p>
        </section>
      </div>
    </div>
  );
}
