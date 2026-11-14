import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { EmployerDiscovery } from "@/components/review/employer-discovery";
import { RoleDeck } from "@/components/discovery/role-deck";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  return {
    title: session?.side === "employer" ? "Review candidates" : "Discover roles",
    description: "Review one rich, source-backed candidate profile at a time, or browse roles as a candidate.",
  };
}

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
  const priorityIntroState = await repo.getPriorityIntroState(session.side, actorId);

  if (session.side === "candidate") {
    const roles = await repo.getDiscoveryRolesForCandidate(session.candidate.id);
    return (
      <div data-testid="discover-page">
        <PageHeader
          eyebrow="Discover · event order"
          title="Roles worth a second look."
          description="Curated in event order, not ranked by an algorithm. A yes is only half of a match."
        />
        <RoleDeck roles={roles} initialPriorityIntroState={priorityIntroState} personaName={session.candidate.name} />
      </div>
    );
  }

  const employer = session.employer;
  const activeRole = session.activeRole ? await repo.getRoleById(session.activeRole.id) : null;
  if (!activeRole) {
    return (
      <div data-testid="discover-page">
        <PageHeader
          eyebrow="Review"
          title="Choose a role first."
          description="This employer has no open roles in the seeded event. Switch persona to review with another team."
        />
        <EmptyState
          icon={Layers}
          title="No role selected"
          body="This fictional employer has no open roles in the seeded event. Switch employer persona to explore another team."
          action={
            <Link href="/enter?side=employer" className="inline-flex h-10 items-center rounded-full border border-line px-4 text-[12px] font-medium text-ink">
              Choose another team
            </Link>
          }
        />
      </div>
    );
  }

  const candidates = await repo.getDiscoveryCandidatesForRole(activeRole.id, employer.id);

  return (
    <div data-testid="discover-page">
      <div className="pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Review · {employer.name}</p>
        <h1 className="mt-2 max-w-3xl font-display text-[30px] leading-[1.05] tracking-[-0.04em] sm:text-[clamp(2rem,3.2vw,2.5rem)] sm:leading-[1.02]">
          One person. The whole picture.
        </h1>
        <p className="mt-1.5 hidden max-w-2xl text-[13px] leading-5 text-ink-muted sm:block">
          Rich, source-backed profiles in event order. Full profiles open after interest.
        </p>
      </div>
      <EmployerDiscovery
        candidates={candidates}
        activeRole={activeRole}
        employerName={employer.name}
        initialPriorityIntroState={priorityIntroState}
      />
    </div>
  );
}
