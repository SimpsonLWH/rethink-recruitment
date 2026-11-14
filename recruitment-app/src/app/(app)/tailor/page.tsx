import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { buttonVariants } from "@/components/ui/button";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tailor a profile",
  description: "One profile record. One approved version per role.",
};

export default async function TailorIndexPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") redirect("/matches");
  const repo = getRepository();
  const options = await repo.getTailorableRoles(session.candidate.id);
  const candidate = session.candidate;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        title="One record. One audience."
        description="Choose a team you already liked or matched with. The app suggests which existing facts to foreground and how to reword them — you approve every line before anyone else sees it."
      />

      {options.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No roles to tailor for yet"
          body="Tailoring is available for a role you liked or matched with. Go back to discovery and say yes to a team that feels worth a closer look."
          action={
            <Link href="/discover" className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2")}>
              Go to discovery <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {options.map((option) => {
              const role = option.role;
              const approved = option.draftStatus === "APPROVED";
              return (
                <article
                  key={role.id}
                  className="rounded-xl border border-line bg-surface p-6"
                  data-testid="tailor-option"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-paper font-display text-[14px] font-semibold text-ink-soft">
                        {role.employer.logoMark}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h2 className="text-[20px] font-semibold leading-tight">{role.title}</h2>
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                            {approved
                              ? "Approved"
                              : option.state === "MATCHED"
                                ? "Matched · you said yes"
                                : "You said yes"}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {role.employer.name} · {role.employmentType} · {role.workMode}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {option.draftStatus === "APPROVED" || option.draftStatus === "DRAFT" ? (
                        <Link
                          href={"/tailor/" + role.id + (approved ? "/preview" : "")}
                          className={cn(
                            buttonVariants({ variant: approved ? "secondary" : "primary", size: "sm" }),
                            "gap-1.5",
                          )}
                        >
                          {approved ? "View approved preview" : "Continue review"} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <StartTailoringButton roleId={role.id} />
                      )}
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-[14px] leading-6 text-ink-muted">{role.problemNow}</p>
                  <p className="mt-4 border-t border-line pt-4 text-[12px] text-ink-faint">
                    Existing facts only · {candidate.facts.length} profile facts · you approve every line
                  </p>
                </article>
              );
            })}
          </div>

          <p className="mt-6 text-[12px] leading-6 text-ink-muted">
            No live model key: local template suggestions run this flow with the same guardrails.{" "}
            <Link
              href="/profile"
              className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
            >
              Your profile record
            </Link>{" "}
            ·{" "}
            <Link
              href="/how-it-works#ai"
              className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
            >
              How AI is used
            </Link>
          </p>
        </>
      )}
    </div>
  );
}