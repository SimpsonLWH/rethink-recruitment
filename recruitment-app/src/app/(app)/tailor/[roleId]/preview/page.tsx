import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { EvidenceLink } from "@/components/brand/evidence-link";
import { ProvenanceBadge } from "@/components/brand/evidence-badges";
import { PageHeader } from "@/components/brand/page-header";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { TailoringSteps } from "@/components/tailoring/tailoring-steps";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approved preview",
  description: "Exactly what the employer sees: approved lines only, with their source provenance.",
};

function engineLabel(engine: string) {
  if (engine.startsWith("nemotron")) return "Nemotron 3.5 Super VL";
  if (engine.startsWith("gemini")) return "Gemini";
  return "Demo fallback · local";
}

export default async function TailoringPreviewPage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") redirect("/matches");
  const { roleId } = await params;
  const repo = getRepository();
  const [role, draft] = await Promise.all([
    repo.getRoleById(roleId),
    repo.getTailoringDraft(session.candidate.id, roleId),
  ]);
  if (!role) notFound();

  if (!draft) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <Link
          href="/tailor"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Tailoring
        </Link>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-ink-muted" />
          <h1 className="mt-4 font-display text-[32px] leading-tight">No tailored version yet</h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-ink-muted">
            Generate suggestions first, then approve at least one line. The employer preview only exists after your
            approval.
          </p>
          <div className="mt-5 flex justify-center">
            <StartTailoringButton roleId={role.id} />
          </div>
        </div>
      </div>
    );
  }

  if (draft.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up">
        <Link
          href={"/tailor/" + role.id}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to review
        </Link>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-ink-muted" />
          <h1 className="mt-4 font-display text-[32px] leading-tight">Not approved yet</h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-ink-muted">
            The employer preview is locked until you approve at least one suggestion. Nothing from this draft is
            visible to the employer.
          </p>
          <Link
            href={"/tailor/" + role.id}
            className={cn(buttonVariants({ variant: "primary", size: "md" }), "mt-5 gap-2")}
          >
            Continue review <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const approved = draft.items.filter((item) => item.status === "APPROVED").sort((a, b) => a.order - b.order);
  const approvedDate = draft.approvedAt
    ? new Date(draft.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/tailor"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Tailoring
        </Link>
        <p className="text-[11px] text-ink-faint">{engineLabel(draft.engine)}</p>
      </div>

      <div className="mt-5">
        <PageHeader
          eyebrow="Approved preview · candidate-controlled"
          title="What they see."
          description="This is the exact approved version: only the lines you approved, in order, with provenance carried from their source facts. No new experience was added."
          action={approvedDate ? <span className="text-[12px] text-ink-muted">Approved {approvedDate}</span> : undefined}
        />
      </div>

      <div className="mb-5">
        <TailoringSteps current={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
          <div className="border-b border-line bg-paper/50 px-5 py-3 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Candidate-approved profile · shared for this role
            </p>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div className="flex items-start gap-4">
                <Avatar
                  name={session.candidate.name}
                  monogram={session.candidate.monogram}
                  palette={session.candidate.palette}
                  size="lg"
                />
                <div>
                  <h2 className="font-display text-[30px] leading-none tracking-[-0.03em]">
                    {session.candidate.name}
                  </h2>
                  <p className="mt-2 text-[14px] text-ink-muted">{session.candidate.headline}</p>
                  <p className="mt-1 text-[12px] text-ink-faint">
                    Tailored for {role.title} at {role.employer.name}
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-ink-faint">
                {approved.length} approved {approved.length === 1 ? "line" : "lines"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {approved.map((item, index) => {
                const text = item.editedText ?? item.suggestedText;
                const provenances = Array.from(new Set(item.sourceFacts.map((fact) => fact.provenance)));
                const linkedFacts = item.sourceFacts.filter((fact) => fact.evidenceUrl);
                return (
                  <article
                    key={item.id}
                    className="rounded-[20px] border border-line bg-paper/40 p-5 sm:p-6"
                    data-testid="preview-line"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Approved line {index + 1}
                    </p>
                    <p
                      className={cn(
                        "mt-3 leading-[1.6] text-ink",
                        index === 0 ? "text-[17px]" : "text-[16px]",
                      )}
                    >
                      {text}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      {provenances.map((provenance) => (
                        <ProvenanceBadge key={provenance} provenance={provenance} />
                      ))}
                      {item.editedText && <span className="text-ink-faint">Edited by you</span>}
                    </p>
                    {linkedFacts.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {linkedFacts.flatMap((fact) =>
                          fact.evidenceUrl
                            ? [
                                <EvidenceLink
                                  key={fact.id}
                                  factId={fact.id}
                                  evidenceUrl={fact.evidenceUrl}
                                  initialStatus={fact.linkStatus?.status ?? null}
                                  initialCheckedAt={fact.linkStatus?.checkedAt ?? null}
                                />,
                              ]
                            : [],
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <p className="mt-6 border-t border-line pt-4 text-[12px] leading-6 text-ink-muted">
              Every line traces to a fact in the candidate&apos;s single master record. Link status is a mechanical
              reachability check, not proof that a claim is true, and employer confirmation is simulated seed data.{" "}
              <Link
                href="/how-it-works#evidence"
                className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
              >
                How evidence works
              </Link>
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Approval audit</p>
            <dl className="mt-3 space-y-2 text-[12px] leading-5">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Approved by</dt>
                <dd className="text-right font-medium text-ink">{session.candidate.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Approved at</dt>
                <dd className="text-right font-medium text-ink">
                  {draft.approvedAt
                    ? new Date(draft.approvedAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Engine</dt>
                <dd className="text-right font-medium text-ink">{engineLabel(draft.engine)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Lines shared</dt>
                <dd className="text-right font-medium text-ink">{approved.length}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Master record is untouched
            </p>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              Tailoring created a separate per-role view. It did not add experience, remove facts, or change any
              provenance label.
            </p>
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-muted transition hover:text-ink"
            >
              Open the master record <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Want another version?
            </p>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              This version is approved and locked. Changing the underlying facts would need a new review.
            </p>
            <Link
              href="/tailor"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3 gap-1.5")}
            >
              Back to tailoring <ExternalLink className="h-3 w-3" />
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
