import type { Metadata } from "next";
import Link from "next/link";
import { Layers, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { EmptyState } from "@/components/brand/empty-state";
import { DiscoveryLane } from "@/components/discovery/discovery-lane";
import { InvitationList } from "@/components/invitations/invitation-list";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discovery lane",
  description: "Relevant, opted-in candidates who have not swiped, with a message-only invitation.",
};

export default async function DiscoveryPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "employer") {
    return <div className="mx-auto max-w-3xl"><p className="text-[14px] text-ink-muted">Only a recruiter has a discovery lane.</p></div>;
  }
  const repo = getRepository();
  const activeRole = session.activeRole ? await repo.getRoleById(session.activeRole.id) : null;
  if (!activeRole) {
    return (
      <PageHeader
        title="Choose a role first."
        description="The discovery lane is specific to one role card."
      />
    );
  }
  if (activeRole.configStatus !== "LIVE") {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Publish the role card first." description="Only a live role card can invite candidates from discovery." />
        <EmptyState
          icon={SlidersHorizontal}
          title="Draft role card"
          body="Set the assessment bar and signals before inviting anyone."
          action={<Link href={"/roles/" + activeRole.id + "/edit"} className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12px] font-medium text-white">Edit role card</Link>}
        />
      </div>
    );
  }

  const [feed, invitations] = await Promise.all([
    repo.getDiscoveryLane(activeRole.id, session.employer.id),
    repo.getInvitations("employer", session.employer.id),
  ]);

  return (
    <div className="animate-fade-up" data-testid="discovery-page">
      <PageHeader
        title={"Discovery lane"}
        description={"Opted-in candidates who have not swiped on " + activeRole.title + ". Send a message; they choose whether to look."}
      />
      <DiscoveryLane feed={feed} activeRole={activeRole} />
      {invitations.length ? (
        <section className="mx-auto mt-10 max-w-4xl">
          <div className="border-t border-line pt-6">
            <h2 className="text-[22px] font-semibold leading-tight">Sent invitations</h2>
            <p className="mt-1 text-[12px] text-ink-muted">Accepted invitations still need your explicit yes for a match.</p>
          </div>
          <div className="mt-4">
            <InvitationList items={invitations} side="employer" />
          </div>
        </section>
      ) : null}
    </div>
  );
}