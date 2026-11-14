import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { EmptyState } from "@/components/brand/empty-state";
import { CloseRoleButton } from "@/components/roles/close-role-button";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Role cards",
  description: "Capture the need before the feed: role family, assessment bar and the signals that matter.",
};

export default async function RolesPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") {
    const employer = await getRepository().getEmployerById(session.employer.id);
    const roles = employer?.roles ?? [];
    return (
      <div className="animate-fade-up" data-testid="roles-page">
        <PageHeader
          eyebrow="Your roles · need capture"
          title="Say what you need before you swipe."
          description="Each live role card states one exact assessment bar and the experience signals you care about. The feed filters and presents; a human decides."
          action={
            <Link href="/roles/new" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              <Plus className="h-3.5 w-3.5" /> New role card
            </Link>
          }
        />
        {roles.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No roles yet"
            body="Create a role card with a playable assessment and a score you consider sufficient."
            action={<Link href="/roles/new" className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white">Create role card</Link>}
          />
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {roles.map((role, index) => (
              <div key={role.id} className={"flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6 " + (index > 0 ? "border-t border-line" : "")}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-semibold text-ink">{role.title}</p>
                    <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-muted">
                      {role.configStatus.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {role.roleFamily} · {role.employmentType} · {role.workMode}
                  </p>
                  <div className="mt-2 space-y-0.5 text-[12px] leading-5 text-ink-soft">
                    {role.requirements.length ? (
                      role.requirements.map((requirement) => (
                        <p key={requirement.assessmentId}>
                          {requirement.assessment?.family ?? "Assessment"} {requirement.assessment?.version ?? ""} · bar {requirement.requiredScore}
                        </p>
                      ))
                    ) : (
                      <p>No assessment bar yet</p>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {role.evidenceSignals.length} signals · review owner {role.reviewOwnerName ?? role.employer.contactName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {role.configStatus !== "CLOSED" ? (
                    <>
                      <Link href={"/roles/" + role.id + "/edit"} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
                        Edit role card <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <CloseRoleButton roleId={role.id} />
                    </>
                  ) : (
                    <span className="text-[11px] text-ink-faint">Closed for this cycle</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="mx-auto max-w-3xl"><p className="text-[14px] text-ink-muted">Only a recruiter can configure role cards.</p></div>;
}
