import type { Metadata } from "next";
import { PageHeader } from "@/components/brand/page-header";
import { InvitationList } from "@/components/invitations/invitation-list";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invitations",
  description: "Message-only invitations from recruiter discovery. Accepting is not a match.",
};

export default async function InvitationsPage() {
  const session = await getSession();
  if (!session) return null;
  const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
  const invitations = await getRepository().getInvitations(session.side, actorId);

  return (
    <div className="mx-auto max-w-3xl animate-fade-up" data-testid="invitations-page">
      <PageHeader
        eyebrow="Invitations"
        title="Invitations"
        description={
          session.side === "candidate"
            ? "A recruiter sent a message. Accepting records your interest. A match still needs both sides."
            : "Invite a relevant candidate from discovery. The message never creates an application, meeting or match."
        }
      />
      <InvitationList items={invitations} side={session.side} />
    </div>
  );
}
