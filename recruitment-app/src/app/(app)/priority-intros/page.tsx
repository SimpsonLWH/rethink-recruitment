import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/brand/empty-state";
import { PageHeader } from "@/components/brand/page-header";
import { PRIORITY_INTRO, PriorityIntroIcon } from "@/lib/brand";
import { PriorityIntroInboxList } from "@/components/priority-intros/priority-intro-inbox-list";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: PRIORITY_INTRO.navLabel,
  description: "See who sent a priority intro and the one-line reason. Interest, not an assessment of suitability.",
};

export default async function PriorityIntrosPage() {
  const session = await getSession();
  if (!session) return null;
  const actorId = session.side === "candidate" ? session.candidate.id : session.employer.id;
  const repo = getRepository();
  const items = await repo.getPriorityIntroInbox(session.side, actorId);

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        eyebrow={PRIORITY_INTRO.navLabel + " · interest, not a score"}
        title="Somebody made room for you."
        description={
          session.side === "candidate"
            ? "A small number of teams can send a priority intro. The reason is the point — not a ranking of your ability."
            : "Candidates can send a priority intro too. Read the specific reason, then decide whether you want the conversation."
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={PriorityIntroIcon}
          title={"No " + PRIORITY_INTRO.plural.toLowerCase() + " in this inbox"}
          body="The allowance is small and free. If someone spends one on you, the reason appears here. Your matches and discovery are still open."
          action={
            <>
              <Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-[12px] font-medium text-white">
                Go to discovery <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/matches" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-medium text-ink">
                See matches
              </Link>
            </>
          }
        />
      ) : (
        <PriorityIntroInboxList items={items} side={session.side} />
      )}

      <p className="mt-8 text-[12px] leading-6 text-ink-muted">
        A priority intro is a limited, free signal. It never changes discovery order and cannot be bought.{" "}
        <Link href="/how-it-works#interest" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
          How priority intros work
        </Link>
        .
      </p>
    </div>
  );
}
