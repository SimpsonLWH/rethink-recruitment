import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Braces, Compass, Network, Sigma } from "lucide-react";
import { TrackProgress } from "@/components/learn/progress";
import { TRACKS, itemKey } from "@/lib/learn/content";

export const metadata: Metadata = {
  title: "Prepare",
  description: "Lessons and unlimited practice before your one-attempt assessments.",
};

const ICONS: Record<string, typeof BookOpen> = {
  javascript: Braces,
  algorithms: Network,
  quant: Sigma,
  strategy: Compass,
};

export default function LearnPage() {
  const lessons = TRACKS.reduce((total, track) => total + track.items.filter((item) => item.kind === "lesson").length, 0);
  const practice = TRACKS.reduce((total, track) => total + track.items.filter((item) => item.kind === "practice").length, 0);
  return (
    <div className="animate-fade-up" data-testid="learn-page">
      <div className="rounded-xl bg-navy px-6 py-7 text-white sm:px-8">
        <h1 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em]">Prepare</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/75">
          Short lessons and unlimited practice before you sit a one-attempt assessment. Practice never counts as
          evidence and employers never see it.
        </p>
        <p className="mt-4 text-[12px] text-white/60">
          {TRACKS.length} tracks · {lessons} lessons · {practice} practice challenges
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TRACKS.map((track) => {
          const Icon = ICONS[track.slug] ?? BookOpen;
          const keys = track.items.map((item) => itemKey(track.slug, item.slug));
          const practiceCount = track.items.filter((item) => item.kind === "practice").length;
          return (
            <Link
              key={track.slug}
              href={"/learn/" + track.slug}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-line-strong hover:shadow-card"
              data-testid={"track-" + track.slug}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold text-ink group-hover:text-accent">{track.title}</h2>
                  <p className="mt-1 text-[13px] leading-6 text-ink-muted">{track.blurb}</p>
                </div>
              </div>
              <p className="mt-4 text-[12px] text-ink-faint">
                {track.items.length - practiceCount} lessons
                {practiceCount > 0 ? " · " + practiceCount + " challenges" : ""}
                {track.prepares ? " · prepares for " + track.prepares + " tests" : ""}
              </p>
              <TrackProgress keys={keys} className="mt-3" />
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                Open track <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
