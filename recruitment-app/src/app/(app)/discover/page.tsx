import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Flower2, Layers, ShieldCheck } from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { EmptyState } from "@/components/brand/empty-state";
import { EvidenceLegend, LinkStatusBadge, ProvenanceBadge, SyntheticTag } from "@/components/brand/evidence-badges";
import { PageHeader } from "@/components/brand/page-header";
import { RoseCounter } from "@/components/brand/rose-counter";
import { CardStack } from "@/components/discovery/card-stack";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse roles or candidates in a curated event order and decide for yourself.",
};

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const [event, roseState] = await Promise.all([repo.getEvent(), repo.getRoseState(session.side, session.side === "candidate" ? session.candidate.id : session.employer.id)]);
  const candidate = session.side === "candidate" ? session.candidate : null;
  const employer = session.side === "employer" ? session.employer : null;
  const activeRoleSummary = session.side === "employer" ? session.activeRole : null;
  const activeRole = activeRoleSummary ? await repo.getRoleById(activeRoleSummary.id) : null;

  const cards = candidate
    ? await repo.getDiscoveryRolesForCandidate(candidate.id)
    : employer && activeRole
      ? await repo.getDiscoveryCandidatesForRole(activeRole.id, employer.id)
      : [];

  const personaName = candidate ? candidate.name : employer?.name ?? "You";
  const headerTitle = candidate
    ? "Roles worth a second look."
    : activeRole
      ? "Who's in the room?"
      : "Choose a role first.";
  const headerDescription = candidate
    ? "Curated in event order, not ranked by an algorithm. A yes is only half of a match."
    : activeRole
      ? "Candidates for " + activeRole.title + ", in event order. Your yes only becomes a match if they said yes to this role too."
      : "This employer has no open roles in the demo event.";

  return (
    <div data-testid="discover-page">
      <PageHeader
        eyebrow={candidate ? "Discover · the event deck" : "Employer discovery · " + (activeRole?.employer.name ?? "event")}
        title={headerTitle}
        description={headerDescription}
        action={
          <div className="hidden items-center gap-2 sm:flex">
            <SyntheticTag />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-ink-soft">
              <Layers className="h-3.5 w-3.5 text-rose" /> {cards.length} in deck
            </span>
          </div>
        }
      />

      {!activeRole && employer ? (
        <EmptyState
          icon={Layers}
          title="No role selected"
          body="This fictional employer has no open roles in the seeded event. Switch employer persona to explore another team."
          action={<Link href="/enter?side=employer" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">Choose another team</Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_318px] lg:items-start">
          <div>
            {candidate ? (
              <CardStack
                kind="role"
                cards={cards}
                initialRoseState={roseState}
                personaName={personaName}
                activeRoleTitle={undefined}
              />
            ) : activeRole ? (
              <CardStack
                kind="candidate"
                cards={cards}
                initialRoseState={roseState}
                personaName={personaName}
                activeRoleTitle={activeRole.title}
                activeRoleId={activeRole.id}
              />
            ) : null}
          </div>

          <aside className="hidden space-y-4 lg:block">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">At this event</p>
                <Compass className="h-4 w-4 text-rose" />
              </div>
              <p className="mt-3 font-display text-[24px] leading-tight">{event.name}</p>
              <p className="mt-1 text-[11px] text-ink-muted">{event.dateLabel} · {event.city}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-paper/60 p-2.5">
                  <p className="font-display text-[20px] leading-none">{candidate ? cards.length : 12}</p>
                  <p className="mt-1 text-[8.5px] uppercase tracking-[0.09em] text-ink-faint">{candidate ? "roles left" : "candidate pool"}</p>
                </div>
                <div className="rounded-xl border border-line bg-paper/60 p-2.5">
                  <p className="font-display text-[20px] leading-none">{roseState.remaining}</p>
                  <p className="mt-1 text-[8.5px] uppercase tracking-[0.09em] text-ink-faint">roses left</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-paper/60 px-3 py-2.5 text-[10px] leading-4 text-ink-muted">
                <p className="flex items-center gap-1.5 font-semibold text-ink-soft"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> No ranking, no penalty</p>
                <p className="mt-1">The order is curated by the event team. Saying yes to lots of profiles does not reduce your chances.</p>
              </div>
            </Card>

            <RoseCounter remaining={roseState.remaining} total={roseState.total} />

            {activeRole && (
              <Card className="p-5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-ink-faint">The role you&apos;re hiring for</p>
                <p className="mt-2 font-display text-[23px] leading-tight">{activeRole.title}</p>
                <p className="mt-1 text-[10.5px] text-ink-muted">{activeRole.employmentType} · {activeRole.workMode}</p>
                <p className="mt-3 text-[11px] leading-5 text-ink-muted">{activeRole.summary}</p>
                <Link href={"/roles/" + activeRole.id} className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">
                  Role details <ArrowRight className="h-3 w-3" />
                </Link>
              </Card>
            )}

            <EvidenceLegend />

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">AI in this flow</p>
                <AiStatusChip compact />
              </div>
              <p className="mt-2 text-[10px] leading-4 text-ink-muted">
                Discovery does not use AI to choose, sort, or reject anyone. The deck order is the seeded event order.
              </p>
              <Link href="/about-ai" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted transition hover:text-ink">
                About the AI <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
