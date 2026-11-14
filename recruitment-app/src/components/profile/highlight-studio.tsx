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
    <div className="mt-6" id="highlight-studio">
      <div className="rounded-[20px] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Paste a longer answer</p>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">You review every highlight before it becomes part of your record.</p>
          </div>
          <div className="flex items-center gap-3">
            <EngineBadge engine={engine} />
            <button
              type="button"
              onClick={() => {
                setText(sampleText);
                setHighlights(null);
                setAdded({});
              }}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset example
            </button>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 1600))}
          className="mt-4 min-h-[160px] bg-paper/40 text-[14px] leading-6"
          placeholder="Write about a project, a problem you solved, or a team you want. Include a link if there is one."
          data-testid="highlight-source"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5 text-ink-faint">
          <p>Example text for {candidateName}. Edit freely. Evidence links are optional and never inferred.</p>
          <span>{text.length}/1600</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="max-w-md text-[12px] leading-5 text-ink-muted">
            A link can only be suggested when the URL is already in your answer. Every accepted highlight is saved as
            Self-claimed; AI never sets provenance.
          </p>
          <Button size="sm" variant="primary" onClick={() => void extract()} disabled={loading || text.trim().length < 20} data-testid="highlight-extract">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
            {loading ? "Reading your answer…" : "Extract highlights"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-28 rounded-[20px]" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-[20px]" />
            <Skeleton className="h-28 rounded-[20px]" />
          </div>
        </div>
      )}

      {highlights && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-ink-soft">
              {highlights.length} highlight{highlights.length === 1 ? "" : "s"} found
            </p>
            <p className="text-[11px] text-ink-faint">Review, then add only what you want.</p>
          </div>
          {highlights.map((highlight, index) => {
            const edited = edits[index];
            const claim = edited?.claim ?? highlight.claim;
            const skill = edited?.skill ?? highlight.skill;
            const isAdded = Boolean(added[index]);
            return (
              <div key={index} className="rounded-[20px] border border-line bg-surface p-5" data-testid="highlight-result">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                    <Input
                      value={skill}
                      onChange={(event) => updateEdit(index, "skill", event.target.value.slice(0, 60))}
                      className="h-9 w-full max-w-[240px] text-[13px] font-medium"
                      aria-label="Highlight skill"
                    />
                    <ProvenanceBadge provenance="SELF_CLAIMED" />
                    {highlight.evidenceUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                        <Link2 className="h-3.5 w-3.5" aria-hidden /> Link in answer
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => void addHighlight(index)}
                    disabled={savingIndex !== null || isAdded}
                    className="shrink-0"
                  >
                    {savingIndex === index ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : isAdded ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    {isAdded ? "Added" : "Add to record"}
                  </Button>
                </div>
                <Textarea
                  value={claim}
                  onChange={(event) => updateEdit(index, "claim", event.target.value.slice(0, 500))}
                  className="mt-3 min-h-[76px] bg-paper/40 text-[15px] leading-6"
                  aria-label="Highlight claim"
                />
                <p className="mt-2 text-[12px] leading-5 text-ink-faint">
                  <span className="text-ink-muted">Source:</span>{" "}
                  <span className="italic">“{highlight.sourceQuote}”</span>
                  {highlight.evidenceUrl && <span> · Link stays unverified.</span>}
                </p>
              </div>
            );
          })}
          <p className="text-[11px] leading-5 text-ink-faint">
            The extractor cannot invent a URL, employer, metric, or provenance. A working link means the URL answered —
            it does not verify the claim.
          </p>
        </div>
      )}
    </div>
  );
}
