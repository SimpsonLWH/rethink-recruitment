import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarkLessonRead } from "@/components/learn/progress";
import { PracticeSolver } from "@/components/learn/practice-solver";
import { difficultyText, difficultyTone } from "@/lib/ui-copy";
import { findItem, itemKey } from "@/lib/learn/content";
import { practiceView } from "@/lib/learn/practice";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ track: string; item: string }> }): Promise<Metadata> {
  const { track, item } = await params;
  return { title: findItem(track, item)?.item.title ?? "Prepare" };
}

export default async function LearnItemPage({ params }: { params: Promise<{ track: string; item: string }> }) {
  const { track: trackSlug, item: itemSlug } = await params;
  const found = findItem(trackSlug, itemSlug);
  if (!found) notFound();
  const { track, item } = found;
  const key = itemKey(track.slug, item.slug);
  const index = track.items.findIndex((entry) => entry.slug === item.slug);
  const next = track.items[index + 1] ?? null;

  return (
    <div className="animate-fade-up" data-testid="learn-item">
      <Link href={"/learn/" + track.slug} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> {track.title}
      </Link>
      <div className="mt-4 border-b border-line pb-5">
        <p className="text-[12px] text-ink-muted">
          {item.kind === "lesson" ? (
            "Lesson · " + item.minutes + " min read"
          ) : (
            <>
              <span className={cn("font-semibold", difficultyTone(item.difficulty))}>{difficultyText(item.difficulty)}</span> · Practice challenge
            </>
          )}
        </p>
        <h1 className="mt-1 text-[clamp(1.5rem,2.4vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-ink">{item.title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-ink-muted">{item.summary}</p>
      </div>

      {item.kind === "lesson" ? (
        <article className="mt-6 max-w-[72ch] space-y-6">
          {item.sections.map((section, sectionIndex) => (
            <section key={sectionIndex}>
              {section.heading ? <h2 className="text-[17px] font-semibold text-ink">{section.heading}</h2> : null}
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="mt-2 text-[15px] leading-7 text-ink-soft">
                  {paragraph}
                </p>
              ))}
              {section.points ? (
                <ul className="mt-2 space-y-1.5">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[15px] leading-7 text-ink-soft">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.code ? (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-navy p-4 font-mono text-[13px] leading-6 text-white/90">
                  <code>{section.code}</code>
                </pre>
              ) : null}
            </section>
          ))}
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <MarkLessonRead itemKey={key} />
          </div>
        </article>
      ) : (
        <div className="mt-6">
          <PracticeSolver view={practiceView(item)} itemKey={key} />
        </div>
      )}

      {next ? (
        <Link
          href={"/learn/" + track.slug + "/" + next.slug}
          className="mt-8 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong"
        >
          <span>
            <span className="block text-[12px] text-ink-faint">Up next</span>
            <span className="text-[14px] font-semibold text-ink">{next.title}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-ink-muted" />
        </Link>
      ) : null}
    </div>
  );
}
