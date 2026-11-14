"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EngineBadge, ProvenanceBadge } from "@/components/brand/evidence-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface Highlight {
  skill: string;
  claim: string;
  evidenceUrl?: string | null;
  sourceQuote: string;
}

export function HighlightStudio({
  sampleText,
  candidateName,
}: {
  sampleText: string;
  candidateName: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(sampleText);
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [edits, setEdits] = useState<Record<number, { claim: string; skill: string }>>({});

  function updateEdit(index: number, field: "claim" | "skill", value: string) {
    setEdits((current) => ({
      ...current,
      [index]: {
        claim: current[index]?.claim ?? highlights?.[index]?.claim ?? "",
        skill: current[index]?.skill ?? highlights?.[index]?.skill ?? "",
        [field]: value,
      },
    }));
  }

  async function extract() {
    if (loading) return;
    setLoading(true);
    setHighlights(null);
    setAdded({});
    setEdits({});
    try {
      const response = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { highlights?: Highlight[]; engine?: string; error?: string };
      if (!response.ok || !data.highlights) {
        toast.error(data.error ?? "Could not extract highlights.");
        return;
      }
      setHighlights(data.highlights);
      setEngine(data.engine ?? null);
      window.dispatchEvent(new Event("rivet:ai-run"));
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addHighlight(index: number) {
    const highlight = highlights?.[index];
    if (!highlight || savingIndex !== null) return;
    const edited = edits[index];
    const claim = (edited?.claim ?? highlight.claim).trim();
    const skill = (edited?.skill ?? highlight.skill).trim();
    setSavingIndex(index);
    try {
      const response = await fetch("/api/facts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceText: text,
          claim,
          skill,
          evidenceUrl: highlight.evidenceUrl ?? null,
          sourceQuote: highlight.sourceQuote,
        }),
      });
      const data = (await response.json()) as { fact?: unknown; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not add that highlight.");
        return;
      }
      setAdded((current) => ({ ...current, [index]: true }));
      toast.success("Added to your record as Self-claimed.");
      router.refresh();
      window.dispatchEvent(new Event("rivet:ai-run"));
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setSavingIndex(null);
    }
  }

  return (
    <div className="mt-4" id="highlight-studio">
      <div className="rounded-[22px] border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Paste a longer answer</p>
            <p className="mt-1 text-[10.5px] text-ink-muted">You review every highlight before it becomes part of your record.</p>
          </div>
          <div className="flex items-center gap-2">
            <EngineBadge engine={engine} />
            <button
              type="button"
              onClick={() => {
                setText(sampleText);
                setHighlights(null);
                setAdded({});
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink-muted transition hover:text-ink"
            >
              <RotateCcw className="h-3 w-3" /> Reset example
            </button>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 1600))}
          className="mt-3 min-h-[150px] bg-paper/40 font-sans text-[12px] leading-6"
          placeholder="Write about a project, a problem you solved, or a team you want. Include a link if there is one."
          data-testid="highlight-source"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] text-ink-faint">Example text for {candidateName}. Edit freely. Evidence links are optional and never inferred.</p>
          <span className="text-[9px] text-ink-faint">{text.length}/1600</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-sm text-[9.5px] leading-4 text-ink-faint">
            Extraction can suggest a link only when the URL is already in your answer. Every accepted highlight
            is saved as Self-claimed. AI never sets provenance.
          </p>
          <Button size="sm" variant="primary" onClick={() => void extract()} disabled={loading || text.trim().length < 20} data-testid="highlight-extract">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Reading your answer…" : "Extract highlights"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      )}

      {highlights && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
              {highlights.length} highlight{highlights.length === 1 ? "" : "s"} found
            </p>
            <p className="text-[9px] text-ink-faint">Review, then add only what you want.</p>
          </div>
          {highlights.map((highlight, index) => {
            const edited = edits[index];
            const claim = edited?.claim ?? highlight.claim;
            const skill = edited?.skill ?? highlight.skill;
            const isAdded = Boolean(added[index]);
            return (
              <div key={index} className="rounded-[20px] border border-line bg-surface p-4" data-testid="highlight-result">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                    <Input
                      value={skill}
                      onChange={(event) => updateEdit(index, "skill", event.target.value.slice(0, 60))}
                      className="h-8 w-full text-[11px] font-semibold sm:w-40"
                      aria-label="Highlight skill"
                    />
                    <div className="inline-flex items-center gap-1.5">
                      <ProvenanceBadge provenance="SELF_CLAIMED" />
                      {highlight.evidenceUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper/60 px-2.5 py-1 text-[10px] font-semibold text-ink-muted">
                          <Link2 className="h-3 w-3" /> Link in answer
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void addHighlight(index)}
                    disabled={savingIndex !== null || isAdded}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-ink bg-ink px-3 text-[10px] font-semibold text-paper transition hover:bg-ink-soft disabled:opacity-50"
                  >
                    {savingIndex === index ? <Loader2 className="h-3 w-3 animate-spin" /> : isAdded ? <Check className="h-3 w-3" /> : null}
                    {isAdded ? "Added" : "Add to record"}
                  </button>
                </div>
                <Textarea
                  value={claim}
                  onChange={(event) => updateEdit(index, "claim", event.target.value.slice(0, 500))}
                  className="mt-2 min-h-[64px] border-0 bg-paper/45 font-display text-[16px] leading-5 focus:ring-0"
                  aria-label="Highlight claim"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] text-ink-faint">
                  <span className="rounded-full border border-line px-2 py-0.5">Source quote</span>
                  <span className="line-clamp-1 italic">“{highlight.sourceQuote}”</span>
                  {highlight.evidenceUrl && <span className="truncate">Link stays unverified.</span>}
                </div>
              </div>
            );
          })}
          <p className="text-[9px] leading-4 text-ink-faint">
            The extractor is not allowed to invent a URL, employer, metric, or provenance. A link works only
            means the URL answered. It does not verify the claim.
          </p>
        </div>
      )}
    </div>
  );
}
