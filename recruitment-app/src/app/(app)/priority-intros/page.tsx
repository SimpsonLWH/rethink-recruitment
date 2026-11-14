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
        eyebrow={PRIORITY_INTRO.navLabel}
        title="Priority intros"
        description={
          session.side === "candidate"
            ? "One team can use a limited signal to get your attention. Read the reason, then decide."
            : "A candidate used their one Priority intro on a role. Read the reason, then decide."
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

      <p className="mt-6 text-[11px] leading-5 text-ink-faint">
        One per side, free. It never changes feed order.{" "}
        <Link href="/how-it-works#interest" className="font-medium text-ink-muted underline decoration-line underline-offset-4">
          Rules
        </Link>
      </p>
    </div>
  );
}
