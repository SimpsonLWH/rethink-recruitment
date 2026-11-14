import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Flower2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { SyntheticTag } from "@/components/brand/evidence-badges";
import { FitBrief } from "@/components/profile/fit-brief";
import { MessageThread } from "@/components/matches/message-thread";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { formatRelativeTime } from "@/lib/utils";

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

  return (
    <div className="animate-fade-up">
      <Link href="/matches" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All matches
      </Link>

      <div className="mt-5 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {session.side === "candidate" ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 bg-[#EFE7DB] font-display text-[17px] font-semibold text-ink-soft">
              {match.role.employer.logoMark}
            </span>
          ) : (
            <Avatar name={match.candidate.name} monogram={match.candidate.monogram} palette={match.candidate.palette} size="lg" />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[30px] leading-none tracking-[-0.035em] sm:text-[38px]">{counterpartName}</h1>
              <span className="rounded-full border border-moss/20 bg-moss/10 px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-[0.1em] text-moss">Mutual match</span>
            </div>
            <p className="mt-2 text-[12px] text-ink-muted">{counterpartSubtitle} · matched {formatRelativeTime(match.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SyntheticTag />
          <Link href={profileHref} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[11px] font-semibold text-ink transition hover:border-line-strong">
            {session.side === "candidate" ? <Building2 className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />} View full profile
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <MessageThread
          match={match}
          side={session.side}
          candidate={match.candidate}
          employer={{ name: match.role.employer.name }}
        />

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The match</p>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-[#EFE7DB] font-display text-[11px] font-semibold text-ink-soft">{match.role.employer.logoMark}</span>
              <div>
                <p className="text-[12px] font-semibold text-ink">{match.role.employer.name}</p>
                <p className="text-[10px] text-ink-muted">{match.role.title}</p>
              </div>
            </div>
            <p className="mt-3 text-[10.5px] leading-5 text-ink-muted">{match.role.workMode} · {match.role.employmentType}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {match.role.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="rounded-full border border-line bg-paper/60 px-2 py-1 text-[9px] text-ink-muted">{skill}</span>
              ))}
            </div>
            {session.side === "candidate" && (
              <Link href={"/tailor/" + match.role.id} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-rose/25 bg-rose-tint px-3 text-[11px] font-semibold text-rose-deep transition hover:bg-rose-soft">
                <Sparkles className="h-3.5 w-3.5" /> Tailor your record for this role
              </Link>
            )}
            {session.side === "employer" && (
              <Link href={"/candidates/" + match.candidate.id} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-line bg-paper px-3 text-[11px] font-semibold text-ink transition hover:border-line-strong">
                <UserRound className="h-3.5 w-3.5" /> Ask this profile a question
              </Link>
            )}
          </Card>

          {match.fitSummary ? (
            <FitBrief fit={match.fitSummary} />
          ) : (
            <Card className="p-5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Advisory fit brief</p>
              <p className="mt-2 text-[11px] leading-5 text-ink-muted">No fit brief has been generated for this pair yet. The conversation does not need one.</p>
            </Card>
          )}

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> Human decision</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">A fit brief is text to help a conversation. It is not a hiring score, is not used to sort discovery, and never decides a match.</p>
            <div className="mt-3 flex items-center justify-between"><AiStatusChip compact /><Link href="/about-ai" className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted transition hover:text-ink">About AI <ArrowRight className="h-3 w-3" /></Link></div>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><Flower2 className="h-3.5 w-3.5 text-rose" /> Roses are not here</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">A rose helped start this match, but it has no effect on the conversation, order, or your standing. It was a signal, not a score.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
