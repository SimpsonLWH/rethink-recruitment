import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Code2, ListChecks } from "lucide-react";
import { ItemStatus, TrackProgress } from "@/components/learn/progress";
import { difficultyText, difficultyTone } from "@/lib/ui-copy";
import { findTrack, itemKey } from "@/lib/learn/content";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  return { title: findTrack(track)?.title ?? "Prepare" };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: slug } = await params;
  const track = findTrack(slug);
  if (!track) notFound();
  const keys = track.items.map((item) => itemKey(track.slug, item.slug));

  return (
    <div className="animate-fade-up" data-testid="learn-track">
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Prepare
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="max-w-2xl">
          <h1 className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">{track.title}</h1>
          <p className="mt-2 text-[14px] leading-6 text-ink-muted">{track.blurb}</p>
        </div>
        <TrackProgress keys={keys} className="w-full max-w-[240px]" />
      </div>

      <ul className="mt-5 space-y-3">
        {track.items.map((item) => {
          const key = itemKey(track.slug, item.slug);
          const href = "/learn/" + track.slug + "/" + item.slug;
          const Icon = item.kind === "lesson" ? BookOpen : item.problem.kind === "code" ? Code2 : ListChecks;
          return (
            <li key={item.slug}>
              <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition hover:border-line-strong sm:flex-row sm:items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink-muted">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-ink">
                    <Link href={href} className="hover:text-accent">
                      {item.title}
                    </Link>
                  </h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-muted">
                    {item.kind === "lesson" ? (
                      <span>Lesson · {item.minutes} min read</span>
                    ) : (
                      <>
                        <span className={cn("font-semibold", difficultyTone(item.difficulty))}>{difficultyText(item.difficulty)}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {item.problem.kind === "code" ? "Coding challenge" : item.problem.kind === "choice" ? "Multiple choice" : "Numeric answer"}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-6 text-ink-soft">{item.summary}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <ItemStatus itemKey={key} label={item.kind === "lesson" ? "Read" : "Solved"} />
                  <Link
                    href={href}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-[13px] font-semibold transition",
                      item.kind === "lesson" ? "border border-line text-ink hover:bg-paper" : "bg-accent text-white hover:bg-accent-deep",
                    )}
                  >
                    {item.kind === "lesson" ? "Read" : "Solve challenge"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {track.prepares ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5">
          <p className="text-[13px] leading-6 text-ink-soft">
            Ready? {track.prepares} tests are one sitting per recruiting cycle.
          </p>
          <Link
            href={"/assessments?track=" + encodeURIComponent(track.prepares)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-4 text-[13px] font-semibold text-ink hover:bg-paper"
          >
            See {track.prepares} tests <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
