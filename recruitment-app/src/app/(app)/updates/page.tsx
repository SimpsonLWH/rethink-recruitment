import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bell } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { EmptyState } from "@/components/brand/empty-state";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Updates",
  description: "Interest status and honest outcomes, with no fabricated review claims.",
};

function typeLabel(type: string) {
  if (type === "INTEREST") return "Interest";
  if (type === "INVITATION") return "Invitation";
  if (type === "OUTCOME") return "Outcome";
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function statusLabel(status: string) {
  if (status === "WAITING") return "Waiting for the team";
  if (status === "MATCHED") return "Matched";
  if (status === "PENDING") return "Invitation pending";
  if (status === "ACCEPTED") return "Invitation accepted";
  if (status === "DECLINED") return "Invitation declined";
  if (status === "WITHDRAWN") return "Invitation withdrawn";
  if (status === "NOT_SELECTED") return "Not selected at this stage";
  if (status === "ROLE_CLOSED") return "Role closed";
  if (status === "AFTER_CONVERSATION") return "After your conversation";
  return status;
}

export default async function UpdatesPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Outcomes live with the candidate." description="Candidates see state-derived wording; recruiters see the same truth in their match and role views." />
        <Link href="/matches" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Open matches <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    );
  }

  const updates = await getRepository().getCandidateUpdates(session.candidate.id);
  return (
    <div className="mx-auto max-w-3xl animate-fade-up" data-testid="updates-page">
      <PageHeader
        title="Updates"
        description="Interest status and outcome messages. Wording reflects what actually happened."
      />
      {updates.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No updates yet"
          body="Interest, invitations and outcomes appear here. A one-sided swipe or a sent invitation is not a match."
          action={<Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Discover roles <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {updates.map((update) => (
            <article key={update.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-ink">{update.roleTitle}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{update.employerName} · {typeLabel(update.type)}</p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  {statusLabel(update.status)}
                </span>
              </div>
              {update.message ? (
                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-ink-soft">{update.message}</p>
              ) : (
                <p className="mt-3 text-[12px] leading-5 text-ink-faint">
                  {update.status === "WAITING"
                    ? "No match yet. The team has not said yes; this is not a rejection."
                    : "A match is a two-sided yes. Open the conversation to continue."}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-medium">
                <Link href={"/roles/" + update.roleId} className="text-accent">Read the role</Link>
                {update.matchId ? <Link href={"/matches/" + update.matchId} className="text-ink">Open conversation</Link> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}