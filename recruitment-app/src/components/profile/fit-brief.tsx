import Link from "next/link";
import type { FitSummaryView } from "@/lib/repo";
import { cn } from "@/lib/utils";

export function FitBrief({ fit, className }: { fit: FitSummaryView; className?: string }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-surface p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Advisory fit brief</p>
        <p className="text-[11px] text-ink-faint">{fit.generatedBy === "modal" ? "Modal batch" : "Local batch fallback"}</p>
      </div>

      <p className="mt-3 text-[14px] leading-6 text-ink-soft">{fit.digest}</p>

      {fit.sharedThemes.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Shared themes</p>
          <ul className="mt-2 space-y-1">
            {fit.sharedThemes.map((theme) => (
              <li key={theme.theme} className="text-[13px] leading-5 text-ink-muted">
                {theme.theme}
                {theme.factIds.length > 0
                  ? " · " + theme.factIds.length + " source" + (theme.factIds.length === 1 ? "" : "s")
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fit.questions.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Questions for the human</p>
          <ul className="mt-2 space-y-2">
            {fit.questions.map((question) => (
              <li key={question} className="text-[13px] leading-6 text-ink-muted">
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 border-t border-line pt-3.5 text-[11.5px] leading-5 text-ink-faint">
        <span className="font-semibold text-ink-muted">Not a score.</span> Derived from skills, tags and evidence
        presence only — never used to sort discovery, auto-reject or decide a match.{" "}
        <Link
          href="/how-it-works#ai"
          className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
        >
          How AI is used
        </Link>
      </p>
    </section>
  );
}
