"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DecisionActions } from "@/components/discovery/decision-actions";
import { MatchDialog } from "@/components/discovery/match-dialog";
import { PriorityIntroDialog } from "@/components/discovery/priority-intro-dialog";
import { PRIORITY_INTRO } from "@/lib/brand";
import type { DecisionResult, PriorityIntroState, RoleDetail } from "@/lib/repo";
import { cn } from "@/lib/utils";

type ExitDirection = "left" | "right" | "up" | null;

function RoleCard({ role }: { role: RoleDetail }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-paper font-display text-[15px] font-semibold text-ink-soft">
            {role.employer.logoMark}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink-soft">{role.employer.name}</p>
            <p className="mt-0.5 truncate text-[12px] text-ink-muted">{role.employer.tagline}</p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-ink-faint">Event order</span>
      </div>

      <div className="mt-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Open role</p>
        <h2 className="mt-3 font-display text-[36px] leading-[0.98] tracking-[-0.04em] sm:text-[44px]">{role.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          <span>{role.employmentType}</span>
          <span className="text-line-strong">·</span>
          <span>{role.workMode}</span>
          <span className="text-line-strong">·</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {role.location}</span>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-7 text-ink-soft">{role.summary}</p>

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">A problem for this role</p>
        <p className="mt-2 text-[18px] font-medium leading-[1.5] text-ink">{role.problemNow}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {role.skills.slice(0, 5).map((skill) => (
          <span key={skill} className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] text-ink-muted">
            {skill}
          </span>
        ))}
        {!role.portfolioRequired && <span className="px-1 py-1 text-[12px] text-ink-faint">Portfolio optional</span>}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
        <p className="text-[12px] text-ink-faint">Not ranked. No auto-screen.</p>
        <Link href={"/roles/" + role.id} className="inline-flex items-center gap-1 text-[12px] font-medium text-ink transition hover:text-accent">
          Read the full role <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function RoleDeck({
  roles,
  initialPriorityIntroState,
  personaName,
}: {
  roles: RoleDetail[];
  initialPriorityIntroState: PriorityIntroState;
  personaName: string;
}) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(initialPriorityIntroState.remaining);
  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState<ExitDirection>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState("");
  const [matchSubtitle, setMatchSubtitle] = useState("");
  const reducedMotion = useReducedMotion();

  const current = roles[index];
  const finished = !current;
  const displayName = current?.title ?? "";
  const employerName = current?.employer.name ?? "";

  const openMatch = useCallback(
    (id: string) => {
      if (!current) return;
      setMatchId(id);
      setMatchName(current.employer.name);
      setMatchSubtitle(current.title);
      setMatchOpen(true);
    },
    [current],
  );

  const decide = useCallback(
    async (action: "LIKE" | "PASS" | "PRIORITY_INTRO", reason?: string) => {
      if (!current || busy) return;
      if (action === "PRIORITY_INTRO" && remaining <= 0) {
        toast.error("No " + PRIORITY_INTRO.plural.toLowerCase() + " left for this event.");
        return;
      }
      setBusy(true);
      try {
        const response = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ roleId: current.id, action, reason }),
        });
        const data = (await response.json()) as DecisionResult & { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "Could not save that decision.");
          setBusy(false);
          return;
        }
        if (action === "PRIORITY_INTRO") {
          setRemaining(data.priorityIntrosRemaining);
          setIntroOpen(false);
        }
        setExit(action === "PASS" ? "left" : action === "PRIORITY_INTRO" ? "up" : "right");
        if (!data.matched) {
          toast.success(
            action === "PASS"
              ? "Passed. No penalty, no ranking."
              : action === "PRIORITY_INTRO"
                ? "Priority intro sent. It counts as a yes on your side."
                : "Like sent. A match needs both sides.",
          );
        }
        window.setTimeout(() => {
          setIndex((value) => value + 1);
          setExit(null);
          setBusy(false);
          if (data.matched && data.matchId) openMatch(data.matchId);
        }, reducedMotion ? 20 : 240);
      } catch {
        toast.error("Network hiccup. Try again.");
        setBusy(false);
      }
    },
    [current, busy, remaining, reducedMotion, openMatch],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (busy || introOpen || matchOpen) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void decide("LIKE");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        void decide("PASS");
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (remaining > 0) setIntroOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, busy, introOpen, matchOpen, remaining]);

  if (finished) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-paper text-accent">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-[32px] leading-tight">That&apos;s the whole deck.</h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-ink-muted">
          Nothing was auto-rejected. You reached the end of the event&apos;s curated order. Check your matches and
          Priority intros, or switch personas.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/matches" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-[12px] font-medium text-white">
            See matches <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/priority-intros" className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-[12px] font-medium text-ink">
            Open {PRIORITY_INTRO.navLabel.toLowerCase()}
          </Link>
          <Link href="/enter" className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-4 text-[12px] font-medium text-ink">
            Switch persona
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[760px] pb-24 lg:pb-0" data-testid="card-stack">
        <motion.div
          key={String(index)}
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={
            exit === "left"
              ? { x: -360, opacity: 0 }
              : exit === "right"
                ? { x: 360, opacity: 0 }
                : exit === "up"
                  ? { y: -360, opacity: 0 }
                  : { x: 0, y: 0, opacity: 1 }
          }
          transition={{ duration: reducedMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          drag={reducedMotion ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={(_, info) => {
            if (busy) return;
            if (info.offset.x > 105) void decide("LIKE");
            else if (info.offset.x < -105) void decide("PASS");
          }}
          className={cn(
            "flex min-h-[560px] cursor-grab flex-col rounded-xl border border-line bg-surface p-6 shadow-card active:cursor-grabbing sm:p-8",
            busy && "pointer-events-none",
          )}
        >
          <div className="flex items-center justify-between pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Role · mutual interest</span>
            <span className="text-[11px] text-ink-faint">
              {index + 1} of {roles.length}
            </span>
          </div>
          <RoleCard role={current} />
        </motion.div>

        <DecisionActions
          className="mt-6"
          displayName={displayName}
          remaining={remaining}
          busy={busy}
          onPass={() => void decide("PASS")}
          onLike={() => void decide("LIKE")}
          onPriorityIntro={() => setIntroOpen(true)}
        />
        <p className="mt-4 hidden text-center text-[12px] text-ink-faint lg:block">
          Drag or use ← / → · P for a {PRIORITY_INTRO.name.toLowerCase()} · it also counts as a yes
        </p>
      </div>

      <PriorityIntroDialog
        open={introOpen}
        onOpenChange={setIntroOpen}
        recipientName={employerName}
        remaining={remaining}
        busy={busy}
        onSend={(reason) => decide("PRIORITY_INTRO", reason)}
      />

      <MatchDialog
        open={matchOpen}
        onOpenChange={setMatchOpen}
        personaName={personaName}
        matchName={matchName}
        matchSubtitle={matchSubtitle}
        matchId={matchId}
      />

      <span className="sr-only" aria-live="polite">
        {current ? "Viewing " + displayName : ""}
      </span>
    </>
  );
}