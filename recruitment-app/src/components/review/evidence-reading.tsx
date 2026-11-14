"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FactView } from "@/lib/repo";
import type { ReadingApiResponse, ReadingCoveredView, ReadingGapView } from "@/lib/ai/reading-types";

type ReadingState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ReadingApiResponse }
  | { status: "error"; message: string };

function fallbackNote(data: ReadingApiResponse) {
  if (data.mode === "LIVE") return null;
  if (data.fallbackReason === "no_key") {
    return "No model key is configured. This reading is built by the app from the same requirements and facts.";
  }
  return "The live model was unavailable. This reading is built by the app from the same requirements and facts.";
}

function coveredStatusLabel(status: ReadingCoveredView["status"]) {
  return status === "related" ? "Related evidence" : "Met";
}

function gapStatusLabel(item: ReadingGapView) {
  if (item.kind === "ASSESSMENT") {
    return item.status === "not_met" ? "Below the stated bar" : "No sitting";
  }
  if (item.status === "not_met") return "Not met";
  if (item.status === "uncertain") return "Uncertain";
  return "Not evidenced";
}

export function EvidenceReading({
  roleId,
  candidateId,
  facts,
}: {
  roleId: string;
  candidateId: string;
  facts: FactView[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ReadingState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function loadReading() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/ai/reading", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleId, candidateId }),
        signal: controller.signal,
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as ReadingApiResponse & { error?: string };
      if (!response.ok) {
        setState({
          status: "error",
          message: payload.error ?? "The reading could not be generated.",
        });
        return;
      }
      setState({ status: "ready", data: payload });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setState({
        status: "error",
        message: "The reading could not be generated. Check the connection and try again.",
      });
    }
  }

  function openReading() {
    setOpen(true);
    void loadReading();
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) abortRef.current?.abort();
  }

  const citedFacts = (ids: string[]) =>
    ids
      .map((id) => facts.find((fact) => fact.id === id))
      .filter((fact): fact is FactView => Boolean(fact));

  const data = state.status === "ready" ? state.data : null;

  return (
    <>
      <button
        type="button"
        onClick={openReading}
        data-testid="read-evidence"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent underline decoration-accent/30 underline-offset-4 transition hover:text-accent-deep"
      >
        Read the evidence
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col overflow-hidden"
          data-testid="evidence-reading"
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[28px]">Evidence reading</DialogTitle>
            <DialogDescription>
              Advisory reading of this record against the role&apos;s stated bar. It explains the evidence; a human
              decides.
            </DialogDescription>
          </DialogHeader>

          {state.status === "loading" && (
            <div className="mt-6 flex items-start gap-2 text-[13px] leading-6 text-ink-muted" role="status" aria-live="polite">
              <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Reading the record against the stated bar…
            </div>
          )}

          {state.status === "error" && (
            <div className="mt-6 rounded-xl border border-line bg-paper p-4" role="alert">
              <p className="text-[13px] leading-6 text-ink-muted">{state.message}</p>
              <button
                type="button"
                onClick={() => void loadReading()}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
                <p className="text-[12px] font-medium text-ink">
                  {data.engine === "nemotron-live"
                    ? "Nemotron · live"
                    : data.engine === "nemotron-cache"
                      ? "Nemotron · cached"
                      : "Deterministic reading · demo mode"}
                </p>
                {data.mode === "LIVE" && (
                  <p className="break-all font-mono text-[10px] text-ink-faint">{data.model}</p>
                )}
              </div>

              {fallbackNote(data) && (
                <p className="mt-2 text-[11.5px] leading-5 text-ink-faint">{fallbackNote(data)}</p>
              )}

              <div
                className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
                role="region"
                aria-label="Evidence reading detail"
                tabIndex={0}
              >
                <p className="text-[14px] leading-7 text-ink">{data.reading.summary}</p>

                {data.reading.covered.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Covered by the record
                    </h3>
                    <ul className="mt-2 divide-y divide-line border-t border-line">
                      {data.reading.covered.map((item) => {
                        const sources = citedFacts(item.factIds);
                        return (
                          <li key={item.requirementId} className="py-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-[13px] font-medium text-ink">{item.label}</p>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                                {coveredStatusLabel(item.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-[12.5px] leading-6 text-ink-muted">{item.note}</p>
                            {item.quote && (
                              <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-[12px] leading-6 text-ink-soft">
                                “{item.quote}”
                              </blockquote>
                            )}
                            {sources.length > 0 && (
                              <details className="mt-2 text-[11px] leading-5 text-ink-faint">
                                <summary className="cursor-pointer font-medium text-ink-muted">Cited facts</summary>
                                <ul className="mt-1.5 space-y-1.5">
                                  {sources.map((fact) => (
                                    <li key={fact.id}>
                                      <span className="font-medium text-ink-soft">{fact.prompt}:</span> {fact.claim}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}

                {data.reading.gaps.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Open questions
                    </h3>
                    <ul className="mt-2 divide-y divide-line border-t border-line">
                      {data.reading.gaps.map((item) => (
                        <li key={item.requirementId} className="py-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[13px] font-medium text-ink">{item.label}</p>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                              {gapStatusLabel(item)}
                            </span>
                          </div>
                          <p className="mt-1 text-[12.5px] leading-6 text-ink-muted">{item.note}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="mt-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Questions for the conversation
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {data.reading.questions.map((question) => (
                      <li key={question} className="text-[12.5px] leading-6 text-ink-muted">
                        {question}
                      </li>
                    ))}
                  </ul>
                </section>

              </div>

              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-5 text-ink-faint">
                <span className="font-semibold text-ink-muted">Not a score.</span> It cannot change the bar, the feed, a
                decision or a match.{" "}
                <Link
                  href="/how-it-works#ai"
                  className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
                >
                  How AI is used
                </Link>
                .
              </p>
              <p className="mt-2 text-[11px] leading-5 text-ink-faint">
                {data.mode === "LIVE"
                  ? "Sends the facts on this card and the stated bar to the configured model. Synthetic demo data only."
                  : "Synthetic demo data only."}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
