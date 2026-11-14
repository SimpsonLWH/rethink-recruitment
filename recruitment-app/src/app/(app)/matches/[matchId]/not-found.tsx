import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";

export default function MatchNotFound() {
  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-xl flex-col items-start justify-center py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Conversation not available</p>
      <h1 className="mt-3 text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
        This conversation is no longer here.
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-6 text-ink-muted">
        This demo can reset between runs, which removes conversations created in an earlier session. The match
        itself and the rest of the demo are unaffected.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/matches"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All matches
        </Link>
        <Link
          href="/discover"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Back to discover <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/priority-intros"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink"
        >
          Priority intros
        </Link>
      </div>
    </div>
  );
}