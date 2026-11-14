"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { LinkStatusBadge } from "@/components/brand/evidence-badges";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";

type Status = "WORKS" | "UNREACHABLE";

export function EvidenceLink({
  factId,
  evidenceUrl,
  initialStatus,
  initialCheckedAt,
  className,
}: {
  factId: string;
  evidenceUrl: string;
  initialStatus: Status | null;
  initialCheckedAt: string | null;
  className?: string;
}) {
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [checkedAt, setCheckedAt] = useState<string | null>(initialCheckedAt);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  async function check(force: boolean) {
    if (checking) return;
    setChecking(true);
    setFailed(false);
    try {
      const response = await fetch("/api/evidence/" + encodeURIComponent(factId) + "/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force }),
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      const data = (await response.json()) as { status: Status; checkedAt: string };
      setStatus(data.status);
      setCheckedAt(data.checkedAt);
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fresh =
      checkedAt && Date.now() - new Date(checkedAt).getTime() < 24 * 60 * 60 * 1000;
    if (!status || !fresh) void check(false);
    // We only want the initial auto-check; manual rechecks go through the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let display = evidenceUrl;
  try {
    const parsed = new URL(evidenceUrl);
    display = parsed.hostname + (parsed.pathname === "/" ? "" : parsed.pathname) + parsed.search;
  } catch {
    display = evidenceUrl;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-ink-faint", className)}>
      <a
        href={evidenceUrl}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 text-[12px] font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
        title={"Fictional evidence link — reachability only: " + evidenceUrl}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{truncate(display, 42)}</span>
      </a>
      <span aria-hidden>·</span>
      {failed && !status ? (
        <span className="text-ink-muted">Check failed — retry</span>
      ) : (
        <LinkStatusBadge status={checking && !status ? null : status} />
      )}
      <span>
        {checkedAt ? "· checked " + formatRelativeTime(checkedAt) + " · " : "· "}reachability only
      </span>
      <button
        type="button"
        onClick={() => void check(true)}
        disabled={checking}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
        aria-label="Recheck evidence link"
        title={checkedAt ? "Checked " + formatRelativeTime(checkedAt) : "Recheck link"}
      >
        <RefreshCw className={cn("h-3 w-3", checking && "animate-spin")} aria-hidden />
      </button>
    </div>
  );
}
