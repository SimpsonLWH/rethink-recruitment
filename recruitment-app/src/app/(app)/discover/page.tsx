import type { Metadata } from "next";
import Link from "next/link";
import { Layers, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { CandidateFeedDeck } from "@/components/discovery/candidate-feed";
import { EmployerFeedDeck } from "@/components/review/employer-feed";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  return {
    title: session?.side === "employer" ? "Review candidates" : "Discover roles",
    description: "Evidence-backed cards, mixed interested and discovery cohorts, no match percentage.",
  };
}

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
  const interest = await repo.getInterestState(session.side, actorId);

  if (session.side === "candidate") {
    const feed = await repo.getCandidateFeed(session.candidate.id);
    return (
      <div data-testid="discover-page">
        <PageHeader
          eyebrow="Discover"
          title="Roles with a stated bar."
          description="Every card shows the assessment evidence and the experience signals for that role. Below-bar roles stay visible."
        />
        <CandidateFeedDeck
          main={feed.main}
          belowBar={feed.belowBar}
          initialInterest={interest}
          personaName={session.candidate.name}
        />
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
          title="Create a role card first."
          description="A role enters the matching feed only after you state the assessment bar and the signals you care about."
        />
        <EmptyState
          icon={SlidersHorizontal}
          title="No role card selected"
          body="Create a live role card before reviewing candidates. This is need capture, not an afterthought."
          action={
            <Link href="/roles" className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              Open role cards
            </Link>
          }
        />
      </div>
    );
  }

  if (activeRole.configStatus !== "LIVE") {
    return (
      <div data-testid="discover-page">
        <PageHeader
          eyebrow="Review"
          title={activeRole.configStatus === "CLOSED" ? "This role is closed." : "Publish the role card first."}
          description="Only a live role card with a playable assessment bar enters the feed."
        />
        <EmptyState
          icon={Layers}
          title={activeRole.configStatus === "CLOSED" ? "Closed for this cycle" : "Draft role card"}
          body={
            activeRole.configStatus === "CLOSED"
              ? "Candidates with pending interest received an honest role-closed update. You can still review the role in your records."
              : "Set the role family, assessment, difficulty and your required score, then publish it."
          }
          action={
            <Link href={"/roles/" + activeRole.id + "/edit"} className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white">
              {activeRole.configStatus === "CLOSED" ? "View role" : "Edit role card"}
            </Link>
          }
        />
      </div>
    );
  }

  const feed = await repo.getEmployerFeed(activeRole.id, employer.id);

  return (
    <div data-testid="discover-page">
      <div className="pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Review · {employer.name}</p>
        <h1 className="mt-1.5 max-w-3xl font-sans text-[clamp(1.5rem,2.3vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
          Candidates against your stated bar.
        </h1>
        <p className="mt-1.5 hidden max-w-2xl text-[12px] leading-5 text-ink-muted sm:block">
          Mixed feed. Every card shows the assessment result and relevant signals. Below-bar candidates stay visible.
        </p>
      </div>
      <EmployerFeedDeck
        feed={feed}
        activeRole={activeRole}
        employerName={employer.name}
        initialInterest={interest}
      />
    </div>
  );
}
