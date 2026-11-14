"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Flower2,
  Heart,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { EvidenceLegend, LinkStatusBadge, ProvenanceBadge } from "@/components/brand/evidence-badges";
import { RoseCounter } from "@/components/brand/rose-counter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateDetail, DecisionResult, RoleDetail, RoseState } from "@/lib/repo";
import { cn } from "@/lib/utils";

type DiscoverCard = { kind: "role"; card: RoleDetail } | { kind: "candidate"; card: CandidateDetail };
type ExitDirection = "left" | "right" | "up" | null;

function RoleDeckCard({ role }: { role: RoleDetail }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-[#EFE7DB] font-display text-[15px] font-semibold text-ink-soft">
            {role.employer.logoMark}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-ink-soft">{role.employer.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-ink-muted">{role.employer.tagline}</p>
          </div>
        </div>
        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          Event order
        </span>
      </div>

      <div className="mt-6">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.15em] text-rose">Open role</p>
        <h2 className="mt-2 font-display text-[34px] leading-[1.02] tracking-[-0.035em] sm:text-[40px]">{role.title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink-muted">
          <span>{role.employmentType}</span>
          <span className="h-1 w-1 rounded-full bg-line-strong" />
          <span>{role.workMode}</span>
          <span className="h-1 w-1 rounded-full bg-line-strong" />
          <span>{role.location}</span>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-6 text-ink-soft">{role.summary}</p>

      <div className="mt-5 rounded-2xl border border-line bg-paper/65 p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-faint">A problem our team is solving</p>
        <p className="mt-2 font-display text-[19px] leading-[1.4] text-ink">{role.problemNow}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {role.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[9.5px] font-medium text-ink-muted">{skill}</span>
        ))}
        {!role.portfolioRequired && (
          <span className="rounded-full border border-moss/20 bg-moss/10 px-2.5 py-1 text-[9.5px] font-medium text-moss">No portfolio required</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <p className="text-[10px] text-ink-faint">Not ranked. No auto-screen.</p>
        <Link href={"/roles/" + role.id} className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink transition hover:text-rose">
          Read full role <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CandidateDeckCard({ candidate }: { candidate: CandidateDetail }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-[25px] leading-tight">{candidate.name}</p>
            <p className="mt-1 truncate text-[11px] text-ink-muted">{candidate.headline}</p>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-faint"><MapPin className="h-3 w-3" /> {candidate.location}</p>
          </div>
        </div>
        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Event order</span>
      </div>

      <p className="mt-4 line-clamp-2 border-t border-line pt-3 text-[11.5px] leading-5 text-ink-muted">{candidate.bio}</p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {candidate.facts.slice(0, 2).map((fact, index) => (
          <div key={fact.id} className={cn("rounded-2xl border border-line bg-paper/60 p-3.5", index === 1 && "hidden sm:block")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{fact.prompt}</p>
              <ProvenanceBadge provenance={fact.provenance} className="scale-[0.86] origin-right" />
            </div>
            <p className="mt-1.5 line-clamp-3 font-display text-[17px] leading-[1.38] text-ink">{fact.claim}</p>
            {fact.evidenceUrl && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[9.5px] text-ink-muted">
                {fact.linkStatus ? (
                  <LinkStatusBadge status={fact.linkStatus.status} className="scale-[0.9] origin-left" />
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[9px] font-medium text-ink-muted">
                    <ExternalLink className="h-2.5 w-2.5" /> Evidence link
                  </span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
      {candidate.facts.length > 1 && <p className="mt-2 text-[9px] text-ink-faint sm:hidden">+{candidate.facts.length - 1} more facts in the full profile</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[9.5px] font-medium text-ink-muted">{tag}</span>
        ))}
        <span className="rounded-full border border-moss/20 bg-moss/10 px-2.5 py-1 text-[9.5px] font-medium text-moss">No portfolio needed</span>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <p className="text-[9.5px] text-ink-faint">Provenance labels stay separate.</p>
        <Link href={"/candidates/" + candidate.id} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink transition hover:text-rose">
          Read full profile <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function CardStack({
  kind,
  cards,
  initialRoseState,
  activeRoleTitle,
  activeRoleId,
  personaName,
}: {
  kind: "role" | "candidate";
  cards: Array<RoleDetail | CandidateDetail>;
  initialRoseState: RoseState;
  activeRoleTitle?: string;
  activeRoleId?: string;
  personaName: string;
}) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(initialRoseState.remaining);
  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState<ExitDirection>(null);
  const [roseOpen, setRoseOpen] = useState(false);
  const [roseReason, setRoseReason] = useState("");
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState("");
  const [matchSubtitle, setMatchSubtitle] = useState("");
  const reducedMotion = useReducedMotion();

  const current = cards[index];
  const next = cards[index + 1];
  const finished = !current;

  const currentDisplay = current
    ? kind === "role"
      ? (current as RoleDetail).title
      : (current as CandidateDetail).name
    : "";
  const counterpartName = current
    ? kind === "role"
      ? (current as RoleDetail).employer.name
      : (current as CandidateDetail).name
    : "";

  const openMatch = useCallback((id: string) => {
    setMatchId(id);
    setMatchName(kind === "role" ? (current as RoleDetail).employer.name : (current as CandidateDetail).name);
    setMatchSubtitle(kind === "role" ? (current as RoleDetail).title : activeRoleTitle ?? "");
    setMatchOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, current, activeRoleTitle]);

  const decide = useCallback(
    async (action: "LIKE" | "PASS" | "ROSE", reason?: string) => {
      if (!current || busy) return;
      if (action === "ROSE" && remaining <= 0) {
        toast.error("No roses left for this event.");
        return;
      }
      setBusy(true);
      try {
        const payload =
          kind === "role"
            ? { roleId: (current as RoleDetail).id, action, reason }
            : { roleId: activeRoleId, candidateId: (current as CandidateDetail).id, action, reason };
        const response = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as DecisionResult & { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "Could not save that decision.");
          setBusy(false);
          return;
        }
        if (action === "ROSE") {
          setRemaining(data.rosesRemaining);
          setRoseOpen(false);
          setRoseReason("");
        }
        setExit(action === "PASS" ? "left" : action === "ROSE" ? "up" : "right");
        if (!data.matched) {
          toast.success(
            action === "PASS"
              ? "Passed. No penalty, no ranking."
              : action === "ROSE"
                ? "Rose sent. It counts as a yes on your side."
                : "Yes sent. A match needs both sides.",
          );
        }
        window.setTimeout(() => {
          setIndex((value) => value + 1);
          setExit(null);
          setBusy(false);
          if (data.matched && data.matchId) openMatch(data.matchId);
        }, reducedMotion ? 20 : 260);
      } catch {
        toast.error("Network hiccup. Try again.");
        setBusy(false);
      }
    },
    [current, busy, remaining, kind, activeRoleId, reducedMotion, openMatch],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (busy || roseOpen || matchOpen) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void decide("LIKE");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        void decide("PASS");
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        if (remaining > 0) setRoseOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, busy, roseOpen, matchOpen, remaining]);

  if (finished) {
    return (
      <div className="rounded-[30px] border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface text-rose">
          <Sparkles className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-[30px] leading-tight">That&apos;s the whole deck.</h2>
        <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-ink-muted">
          Nothing was auto-rejected — you simply reached the end of the event&apos;s curated order. Check your
          matches and rose inbox, or switch personas.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/matches" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[12px] font-semibold text-paper">
            See matches <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/roses" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">
            Open roses
          </Link>
          <Link href="/enter" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">
            Switch persona
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[580px] pb-24 lg:pb-0" data-testid="card-stack">
        <div className="relative">
          {next && (
            <div className="absolute inset-x-3 top-3 h-full rounded-[30px] border border-line bg-[#F2EAE0]">
              <div className="h-full rounded-[30px] opacity-60" />
            </div>
          )}
          <motion.div
            key={String(index)}
            initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
            animate={
              exit === "left"
                ? { x: -460, rotate: -7, opacity: 0 }
                : exit === "right"
                  ? { x: 460, rotate: 7, opacity: 0 }
                  : exit === "up"
                    ? { y: -460, rotate: 3, opacity: 0 }
                    : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
            }
            transition={{ duration: reducedMotion ? 0.01 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            drag={reducedMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.62}
            onDragEnd={(_, info) => {
              if (busy) return;
              if (info.offset.x > 105) void decide("LIKE");
              else if (info.offset.x < -105) void decide("PASS");
            }}
            className={cn(
              "relative z-10 flex min-h-[500px] cursor-grab flex-col overflow-hidden rounded-[30px] border border-line bg-surface p-5 shadow-lift active:cursor-grabbing sm:min-h-[520px] sm:p-6",
              busy && "pointer-events-none",
            )}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                {kind === "role" ? "Role · mutual interest" : "Candidate · mutual interest"}
              </span>
              <span className="text-[9px] text-ink-faint">{index + 1} of {cards.length}</span>
            </div>
            <div className="flex flex-1 flex-col py-4">
              {kind === "role" ? (
                <RoleDeckCard role={current as RoleDetail} />
              ) : (
                <CandidateDeckCard candidate={current as CandidateDetail} />
              )}
            </div>
          </motion.div>
        </div>

        <div
          className="fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-center gap-6 border-t border-line bg-paper/95 px-4 py-2.5 shadow-[0_-10px_30px_-24px_rgba(37,27,20,.5)] backdrop-blur-md lg:static lg:inset-auto lg:z-auto lg:mt-5 lg:gap-4 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none"
          aria-label="Decision controls"
        >
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => void decide("PASS")}
              disabled={busy}
              aria-label={"Pass on " + currentDisplay}
              title="Pass (left arrow)"
              data-testid="discover-pass"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-muted shadow-sm transition hover:-translate-y-0.5 hover:border-ink hover:text-ink disabled:opacity-40 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint lg:block">Pass</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRoseOpen(true)}
              disabled={busy || remaining <= 0}
              aria-label={"Send a rose to " + currentDisplay}
              title={remaining > 0 ? "Send a rose (R)" : "No roses left"}
              data-testid="discover-rose"
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-rose/30 bg-rose-tint text-rose shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-soft disabled:opacity-40 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            >
              <Flower2 className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[8px] font-bold text-white">{remaining}</span>
            </button>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.1em] text-rose-deep lg:block">Rose · {remaining}</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => void decide("LIKE")}
              disabled={busy}
              aria-label={"Say yes to " + currentDisplay}
              title="Yes (right arrow)"
              data-testid="discover-yes"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-rose bg-rose text-white shadow-[0_10px_24px_-16px_rgba(198,63,74,.9)] transition hover:-translate-y-0.5 hover:bg-rose-deep disabled:opacity-40 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            >
              <Heart className="h-5 w-5" />
            </button>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[0.1em] text-rose-deep lg:block">Yes</span>
          </div>
        </div>
        <p className="mt-3 hidden text-center text-[10px] text-ink-faint lg:block">
          Drag or use ← / → · R for a rose · a rose also counts as a yes
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:hidden">
        <RoseCounter remaining={remaining} total={initialRoseState.total} />
        <EvidenceLegend />
      </div>

      <Dialog open={roseOpen} onOpenChange={setRoseOpen}>
        <DialogContent>
          <DialogHeader>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-rose">A free rose · {remaining} left</p>
            <DialogTitle>Send {counterpartName} a rose?</DialogTitle>
            <DialogDescription>
              One line about why. A rose signals strong interest, not ability, and it also counts as a yes on
              your side. It is never used for ranking.
            </DialogDescription>
          </DialogHeader>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Your reason</span>
            <Textarea
              autoFocus
              value={roseReason}
              onChange={(event) => setRoseReason(event.target.value.slice(0, 140))}
              placeholder="The detail that made you stop scrolling…"
              className="min-h-[100px]"
              data-testid="rose-reason"
            />
            <span className="mt-1.5 flex justify-between text-[10px] text-ink-faint">
              <span>This will be visible to the recipient.</span>
              <span>{roseReason.length}/140</span>
            </span>
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoseOpen(false)}>Cancel</Button>
            <Button
              variant="accent"
              disabled={busy || roseReason.trim().length === 0 || remaining <= 0}
              onClick={() => void decide("ROSE", roseReason.trim())}
              data-testid="rose-send"
            >
              {busy ? "Sending…" : "Send rose"} <Flower2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
        <DialogContent className="text-center" data-testid="match-dialog">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose text-white">
            <Check className="h-7 w-7" />
          </div>
          <DialogHeader className="mt-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-rose">Mutual yes</p>
            <DialogTitle className="mt-2 text-[34px]">It&apos;s a match.</DialogTitle>
            <DialogDescription>
              {personaName} and {matchName} both said yes to {matchSubtitle || "the role"}. Neither side was
              ranked or auto-screened into it.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-line bg-paper/60 p-4 text-left">
            <p className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Next</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-soft">Start with one specific question. No cover letter required.</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" onClick={() => setMatchOpen(false)}>Keep browsing</Button>
            {matchId && (
              <Link
                href={"/matches/" + matchId}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose bg-rose px-5 text-sm font-medium text-white transition hover:bg-rose-deep"
                onClick={() => setMatchOpen(false)}
              >
                Open conversation <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <span className="sr-only" aria-live="polite">{currentDisplay ? "Viewing " + currentDisplay : ""}</span>
    </>
  );
}
