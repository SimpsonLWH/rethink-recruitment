import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { stageLabel } from "@/lib/stages";
import { cn, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matches",
  description: "Mutual yeses only. Start a real conversation.",
};

export default async function MatchesPage() {
  const session = await getSession();
  if (!session) return null;
  const repo = getRepository();
  const matches = await repo.getMatches(
    session.side,
    session.side === "candidate" ? session.candidate.id : session.employer.id,
  );

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        title="Matches"
        description={
          session.side === "candidate"
            ? "Both sides said yes. Open a conversation to continue."
            : "Candidates who said yes to your role. Open a conversation to continue."
        }
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No mutual matches yet"
          body="Nothing was auto-rejected or ranked. Priority intros stay in their own inbox."
          action={
            <>
              <Link href="/discover" className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2")}>
                Go to discovery <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/priority-intros"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }), "gap-2")}
              >
                <PriorityIntroIcon className="h-4 w-4" /> {PRIORITY_INTRO.navLabel}
              </Link>
            </>
          }
        />
      ) : (
        <section aria-labelledby="open-conversations">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
            <h2 id="open-conversations" className="text-[18px] font-semibold leading-tight text-ink">
              Open conversations
            </h2>
            <p className="text-[11px] text-ink-faint">
              {matches.length} {matches.length === 1 ? "conversation" : "conversations"}
            </p>
          </div>
          <ul className="overflow-hidden rounded-[20px] border border-line bg-surface">
          {matches.map((match, index) => (
            <li key={match.id} className={cn(index > 0 && "border-t border-line")}>
              <Link
                href={"/matches/" + match.id}
                className="group flex items-start gap-4 p-5 transition hover:bg-paper/60 sm:p-6"
              >
                {session.side === "candidate" ? (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-paper font-display text-[15px] font-semibold text-ink-soft">
                    {match.employerLogoMark}
                  </span>
                ) : (
                  <Avatar
                    name={match.candidateName}
                    monogram={match.candidateMonogram}
                    palette={match.candidatePalette}
                    size="md"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-sans text-[18px] font-semibold leading-tight tracking-[-0.01em]">
                      {session.side === "candidate" ? match.employerName : match.candidateName}
                    </p>
                    <span className="text-[11px] text-ink-faint">
                      {match.lastMessageAt ? formatRelativeTime(match.lastMessageAt) : "New match"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-ink-muted">
                    {session.side === "candidate"
                      ? match.roleTitle
                      : match.candidateHeadline + " · " + match.roleTitle}
                    {" · "}
                    {stageLabel(match.stage)}
                  </p>
                  <p
                    className={cn(
                      "mt-2 line-clamp-2 text-[14px] leading-6",
                      match.lastMessage ? "text-ink-soft" : "text-ink-faint",
                    )}
                  >
                    {match.lastMessage
                      ? "“" + match.lastMessage + "”"
                      : "No messages yet. Start with one specific question."}
                  </p>
                </div>
                <MessageCircle className="mt-1.5 h-4 w-4 shrink-0 text-ink-faint transition group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          ))}
          </ul>
        </section>
      )}

      <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-6 text-ink-muted">
        <Link
          href="/how-it-works#interest"
          className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4"
        >
          How matching works
        </Link>
        <Link href="/updates" className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4">
          Your interest and updates
        </Link>
        <Link
          href="/priority-intros"
          className="inline-flex items-center gap-1.5 font-medium text-ink-muted underline decoration-line-strong underline-offset-4"
        >
          <PriorityIntroIcon className="h-3.5 w-3.5" /> {PRIORITY_INTRO.navLabel}
        </Link>
      </p>
    </div>
  );
}