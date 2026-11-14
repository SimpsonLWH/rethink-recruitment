import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Info } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessments",
  description: "Short role-relevant assessments, recorded against exact family, version and difficulty.",
};

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AssessmentsPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side === "employer") {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Assessments"
          title="Evidence, not a CV screen."
          description="Candidates complete short role-relevant assessments once per cycle. Recruiters see the exact family, version, difficulty and score against their own stated bar."
        />
        <Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
          Back to review <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const repo = getRepository();
  const [catalog, results] = await Promise.all([
    repo.getAssessmentCatalog(),
    repo.getAssessmentResults(session.candidate.id),
  ]);
  const resultByAssessment = new Map(results.map((result) => [result.assessment.id, result] as const));
  const families = Array.from(new Set(catalog.map((assessment) => assessment.family)));

  return (
    <div className="animate-fade-up" data-testid="assessments-page">
      <PageHeader
        eyebrow="Assessments"
        title="Assessments"
        description="Take a short role-relevant test. Results stay tied to one family, version and difficulty."
      />

      <div className="mx-auto max-w-4xl space-y-10">
        <div className="rounded-2xl border border-accent/25 bg-accent-tint px-4 py-3 text-[12px] leading-5 text-ink-soft">
          <span className="font-medium text-ink">Synthetic demo.</span> These assessments are illustrative, not proctored
          or validated. The two playable entries draw four questions from a small pool. Cooldown and retake rules are
          demo defaults, not a policy claim.
        </div>

        {families.map((family) => {
          const entries = catalog.filter((assessment) => assessment.family === family);
          return (
            <section key={family}>
              <div className="flex items-end justify-between gap-3 border-b border-line pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{family}</p>
                  <p className="mt-1 text-[12px] text-ink-faint">
                    {entries.length} catalogue {entries.length === 1 ? "entry" : "entries"} · versions are not interchangeable
                  </p>
                </div>
                <ClipboardCheck className="h-4 w-4 text-ink-faint" />
              </div>
              <div className="mt-3 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
                {entries.map((assessment) => {
                  const result = resultByAssessment.get(assessment.id);
                  return (
                    <div key={assessment.id} className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[16px] font-semibold leading-6 text-ink">{assessment.title}</p>
                            {assessment.playable ? (
                              <span className="rounded-full bg-accent-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                                Playable
                              </span>
                            ) : (
                              <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                                Catalogue only
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[12px] text-ink-muted">
                            {assessment.family} · {assessment.version} · {difficultyLabel(assessment.difficulty)}
                          </p>
                          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-muted">{assessment.description}</p>
                          {result ? (
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                              <span className="font-medium text-ink">Best score: {result.bestScore}/100</span>
                              <span className="text-ink-muted">{result.attemptCount} {result.attemptCount === 1 ? "attempt" : "attempts"} this cycle</span>
                              {result.canRetake ? (
                                <span className="text-accent">Retake available</span>
                              ) : result.cooldownUntil ? (
                                <span className="text-ink-faint">Retake after {dateLabel(result.cooldownUntil)}</span>
                              ) : (
                                <span className="text-ink-faint">No retake left this cycle</span>
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-[12px] text-ink-faint">Not attempted yet.</p>
                          )}
                        </div>
                        {assessment.playable ? (
                          <Link
                            href={"/assessments/" + assessment.id}
                            className={cn(
                              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[12px] font-medium",
                              result?.canRetake === false ? "border border-line text-ink-muted" : "bg-accent text-white",
                            )}
                          >
                            {result ? (result.canRetake ? "Retake" : "View") : "Open"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-ink-faint">Not in this demo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="flex items-start gap-2 text-[12px] leading-5 text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Scores are not interchangeable across families, versions or difficulties. There is no universal person
            score, percentile or match percentage.{" "}
            <Link href="/how-it-works" className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4">
              How this fits the demo
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
