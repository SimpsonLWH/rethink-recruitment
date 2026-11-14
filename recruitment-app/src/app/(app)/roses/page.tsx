import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flower2, ShieldCheck } from "lucide-react";
import { AiStatusChip } from "@/components/brand/ai-status-chip";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { RoseCounter } from "@/components/brand/rose-counter";
import { SyntheticTag } from "@/components/brand/evidence-badges";
import { RoseInboxList } from "@/components/roses/rose-inbox-list";
import { Card } from "@/components/ui/card";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rose inbox",
  description: "See who sent a rose, and the one-line reason. A rose is interest, not ability.",
};

export default async function RosesPage() {
  const session = await getSession();
  if (!session) return null;
  const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
  const repo = getRepository();
  const [items, roseState] = await Promise.all([
    repo.getRoseInbox(session.side, actorId),
    repo.getRoseState(session.side, actorId),
  ]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Rose inbox · strong interest, not a score"
        title="Somebody stopped scrolling."
        description={
          session.side === "candidate"
            ? "A small number of teams can send a rose. The reason is the point — not a ranking of your ability."
            : "Candidates can send a rose too. Read the specific reason, then decide whether you want the conversation."
        }
        action={<SyntheticTag />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div>
          {items.length === 0 ? (
            <EmptyState
              icon={Flower2}
              title="No roses in this inbox"
              body="Roses are limited and free. If someone spends one on you, the reason will appear here. Meanwhile, your match list and discovery are still open."
              action={
                <>
                  <Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-paper">Go to discovery <ArrowRight className="h-3.5 w-3.5" /></Link>
                  <Link href="/matches" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">See matches</Link>
                </>
              }
            />
          ) : (
            <RoseInboxList items={items} side={session.side} />
          )}
        </div>

        <aside className="space-y-4">
          <RoseCounter remaining={roseState.remaining} total={roseState.total} />
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              <Flower2 className="h-4 w-4 text-rose" /> The rose rule
            </p>
            <p className="mt-3 font-display text-[22px] leading-tight">Three, free, equal.</p>
            <div className="mt-3 space-y-2 text-[11px] leading-5 text-ink-muted">
              <p>Candidates and employers each get 3 for the whole event.</p>
              <p>A rose carries a one-line reason. It signals strong interest, not ability.</p>
              <p>It also counts as a yes on the sender&apos;s side. Saying yes back creates a match.</p>
              <p>Roses never affect discovery order or any score. They can&apos;t be bought.</p>
            </div>
          </Card>
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> Mutual before messaging</p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-muted">You can only open a conversation after both sides say yes. Accepting a rose records your yes.</p>
            <div className="mt-3 flex items-center justify-between"><AiStatusChip compact /><Link href="/about-ai" className="text-[10px] font-semibold text-ink-muted hover:text-ink">About AI</Link></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
