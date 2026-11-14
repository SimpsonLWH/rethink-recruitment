import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { Avatar } from "@/components/brand/avatar";
import { EmptyState } from "@/components/brand/empty-state";
import { SyntheticTag } from "@/components/brand/evidence-badges";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
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
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Matches · mutual by construction"
        title="Mutual, or not at all."
        description={
          session.side === "candidate"
            ? "These teams said yes back. No secret shortlist and no ranking — just a two-sided yes and a conversation."
            : "These candidates said yes to the role you're hiring for. Replies are human, not generated."
        }
        action={<SyntheticTag />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div>
          {matches.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="No mutual matches yet"
              body="A match appears only after both sides say yes. Check your rose inbox or go back to discovery. Nothing was auto-rejected."
              action={
                <>
                  <Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-paper">Go to discovery <ArrowRight className="h-3.5 w-3.5" /></Link>
                  <Link href="/roses" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">Rose inbox</Link>
                </>
              }
            />
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={"/matches/" + match.id}
                  className="group block rounded-[22px] border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card sm:p-5"
                >
                  <div className="flex items-start gap-3.5">
                    {session.side === "candidate" ? (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] font-display text-[15px] font-semibold text-ink-soft">{match.employerLogoMark}</span>
                    ) : (
                      <Avatar name={match.candidateName} monogram={match.candidateMonogram} palette={match.candidatePalette} size="md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-display text-[21px] leading-tight">
                          {session.side === "candidate" ? match.employerName : match.candidateName}
                        </p>
                        <span className="rounded-full border border-moss/20 bg-moss/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-moss">Matched</span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-ink-muted">
                        {session.side === "candidate" ? match.roleTitle : match.candidateHeadline} · {session.side === "candidate" ? match.employerName : match.roleTitle}
                      </p>
                      <p className={cn("mt-3 line-clamp-2 rounded-xl bg-paper/60 px-3 py-2 text-[11px] leading-5 text-ink-soft", !match.lastMessage && "italic text-ink-faint")}>
                        {match.lastMessage ? "“" + match.lastMessage + "”" : "No messages yet — you both said yes, now say something specific."}
                      </p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                      <span className="text-[9px] text-ink-faint">{match.lastMessageAt ? formatRelativeTime(match.lastMessageAt) : "New"}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted transition group-hover:border-rose/30 group-hover:bg-rose-tint group-hover:text-rose"><MessageCircle className="h-4 w-4" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <HeartHandshake className="h-4 w-4 text-rose" /> The match rule
            </p>
            <p className="mt-3 font-display text-[23px] leading-tight">Both sides, every time.</p>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">A like or rose on one side is only interest. It becomes a match when the other side chooses yes too.</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-moss"><ShieldCheck className="h-3.5 w-3.5" /> No automated rejections</div>
          </Card>
          <Card className="p-5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What the AI will do here</p>
            <p className="mt-2 text-[11px] leading-5 text-ink-muted">Nothing. Conversations are between people. A fit brief may appear as advisory context, but it never decides or ranks the match.</p>
            <Link href="/about-ai" className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">About the AI <ArrowRight className="h-3 w-3" /></Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
