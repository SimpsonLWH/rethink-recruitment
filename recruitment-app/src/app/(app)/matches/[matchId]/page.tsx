import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, UserRound } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { FitBrief } from "@/components/profile/fit-brief";
import { MessageThread } from "@/components/matches/message-thread";
import { MatchStageControl } from "@/components/matches/match-stage-control";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { stageLabel } from "@/lib/stages";
import { cn, formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ matchId: string }> }): Promise<Metadata> {
  const { matchId } = await params;
  const session = await getSession();
  if (!session) return { title: "Match" };
  const match = await getRepository().getMatch(
    matchId,
    session.side,
    session.side === "candidate" ? session.candidate.id : session.employer.id,
  );
  return { title: match ? "Conversation with " + match.candidate.name : "Match" };
}

export default async function MatchThreadPage({ params }: { params: Promise<{ matchId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const { matchId } = await params;
  const repo = getRepository();
  const match = await repo.getMatch(
    matchId,
    session.side,
    session.side === "candidate" ? session.candidate.id : session.employer.id,
  );
  if (!match) notFound();

  const counterpartName = session.side === "candidate" ? match.role.employer.name : match.candidate.name;
  const counterpartSubtitle = session.side === "candidate" ? match.role.title : match.candidate.headline;
  const profileHref = session.side === "candidate" ? "/roles/" + match.role.id : "/candidates/" + match.candidate.id;
  const ProfileIcon = session.side === "candidate" ? Building2 : UserRound;

  return (
    <div className="animate-fade-up">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All matches
      </Link>

      <header className="mt-5 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {session.side === "candidate" ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line bg-paper font-display text-[17px] font-semibold text-ink-soft">
              {match.role.employer.logoMark}
            </span>
          ) : (
            <Avatar
              name={match.candidate.name}
              monogram={match.candidate.monogram}
              palette={match.candidate.palette}
              size="lg"
            />
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Mutual match · {formatRelativeTime(match.createdAt)}
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,4vw,2.9rem)] leading-[0.98] tracking-[-0.04em]">
              {counterpartName}
            </h1>
            <p className="mt-2 text-[13px] text-ink-muted">{counterpartSubtitle}</p>
          </div>
        </div>
        <Link
          href={profileHref}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0 gap-2")}
        >
          <ProfileIcon className="h-3.5 w-3.5" /> View full profile
        </Link>
      </header>

      <div className="mt-5 rounded-2xl border border-line bg-surface px-4 py-3" data-testid="match-stage-strip">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-ink-soft">
            <span className="font-medium text-ink">Current stage:</span> {stageLabel(match.stage)}
          </p>
          <p className="text-[11px] text-ink-faint">Updated {formatRelativeTime(match.stageUpdatedAt)}</p>
        </div>
        {session.side === "employer" ? <MatchStageControl matchId={match.id} current={match.stage} /> : null}
      </div>

      {match.outcome ? (
        <div className="mt-4 rounded-2xl border border-line bg-paper px-4 py-3" data-testid="match-outcome">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Outcome delivered</p>
          <p className="mt-1 text-[13px] leading-6 text-ink-soft">{match.outcome.message}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <MessageThread
          match={match}
          side={session.side}
          candidate={match.candidate}
          employer={{ name: match.role.employer.name }}
        />

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The role</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper font-display text-[12px] font-semibold text-ink-soft">
                {match.role.employer.logoMark}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-ink">{match.role.employer.name}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">{match.role.title}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-5 text-ink-muted">
              {match.role.workMode} · {match.role.employmentType} · {match.role.location}
            </p>
            <p className="mt-2 text-[12px] leading-5 text-ink-faint">{match.role.skills.join(" · ")}</p>

            {session.side === "candidate" ? (
              <Link
                href={"/tailor/" + match.role.id}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 w-full gap-1.5")}
              >
                Tailor your record for this role <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href={"/candidates/" + match.candidate.id}
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4 w-full gap-1.5")}
              >
                Read the full profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </Card>

          {match.fitSummary ? (
            <FitBrief fit={match.fitSummary} />
          ) : (
            <Card className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Advisory fit brief</p>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                No fit brief has been generated for this pair yet. The conversation does not need one.
              </p>
            </Card>
          )}

          <p className="flex items-start gap-2 text-[12px] leading-6 text-ink-muted">
            <PriorityIntroIcon className="mt-1 h-3.5 w-3.5 shrink-0" />
            <span>
              A fit brief is context for this conversation — never a score, a ranking or a decision. A{" "}
              {PRIORITY_INTRO.name.toLowerCase()} can start a match; it has no effect on this thread.{" "}
              <Link
                href="/how-it-works#ai"
                className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
              >
                How AI is used
              </Link>
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}
