"use client";

import { useState } from "react";
import { Loader2, Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CandidateFeedMatch,
  FeedCriterion,
  FeedCriterionKind,
  FeedParseResult,
} from "@/lib/feed";

type Engine = { engine: string; model: string; mode: string } | null;

function criterionLabel(kind: FeedCriterionKind, value: string, years?: number): string {
  if (kind === "SKILL") return "Skill: " + (value || "skill");
  if (kind === "DOMAIN") return "Domain: " + (value || "domain");
  return "Experience: " + (years ?? 0) + "+ years" + (value ? " " + value : "");
}

function withLabel(criterion: FeedCriterion, patch: Partial<FeedCriterion>): FeedCriterion {
  const next = { ...criterion, ...patch };
  const displayValue = next.kind === "SKILL" ? next.skill ?? next.value : next.value;
  return {
    ...next,
    label: criterionLabel(next.kind, displayValue, next.years),
  };
}

function makeCriterion(kind: FeedCriterionKind, value: string, years?: number): FeedCriterion {
  const clean = value.trim();
  const numericYears = years && Number.isFinite(years) ? Math.max(0, Math.round(years * 10) / 10) : undefined;
  const id = kind.toLowerCase() + ":" + clean.toLowerCase() + (numericYears ? ":" + numericYears : "");
  return {
    id,
    kind,
    value: clean,
    label: criterionLabel(kind, clean, numericYears),
    ...(kind === "SKILL" ? { skill: clean } : {}),
    ...(kind === "EXPERIENCE" ? { skill: clean || undefined, years: numericYears ?? 0 } : {}),
    ...(kind === "DOMAIN" ? {} : {}),
  };
}

export function FeedPanel({
  applied,
  matches,
  broadened,
  onApply,
  onBroaden,
  onReset,
  className,
}: {
  applied: FeedCriterion[] | null;
  matches: CandidateFeedMatch[];
  broadened: boolean;
  onApply: (criteria: FeedCriterion[]) => void;
  onBroaden: () => void;
  onReset: () => void;
  className?: string;
}) {
  const [text, setText] = useState("");
  const [criteria, setCriteria] = useState<FeedCriterion[]>([]);
  const [rejected, setRejected] = useState<FeedParseResult["rejected"]>([]);
  const [unparsed, setUnparsed] = useState<string[]>([]);
  const [engine, setEngine] = useState<Engine>(null);
  const [parsing, setParsing] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [addKind, setAddKind] = useState<FeedCriterionKind>("SKILL");
  const [addValue, setAddValue] = useState("");
  const [addYears, setAddYears] = useState("2");

  const inFeed = matches.filter((match) => match.state === "in_feed").length;
  const notStated = matches.filter((match) => match.state === "not_stated").length;
  const outside = matches.filter((match) => match.state === "outside").length;

  async function parse() {
    if (parsing || text.trim().length < 2) return;
    setParsing(true);
    setAttempted(true);
    try {
      const response = await fetch("/api/feed/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as FeedParseResult & {
        engine?: string;
        model?: string;
        mode?: string;
        error?: string;
      };
      if (!response.ok) return;
      setCriteria(data.criteria);
      setRejected(data.rejected);
      setUnparsed(data.unparsed);
      setEngine(data.engine ? { engine: data.engine, model: data.model ?? "", mode: data.mode ?? "FALLBACK" } : null);
      onReset();
    } catch {
      // Keep the rules-based tip visible; the user can retry.
    } finally {
      setParsing(false);
    }
  }

  function updateCriterion(id: string, patch: Partial<FeedCriterion>) {
    setCriteria((current) => current.map((criterion) => (criterion.id === id ? withLabel(criterion, patch) : criterion)));
    if (applied) onReset();
  }

  function removeCriterion(id: string) {
    setCriteria((current) => current.filter((criterion) => criterion.id !== id));
    if (applied) onReset();
  }

  function addCriterion() {
    const value = addValue.trim();
    if (!value) return;
    const kind = addKind;
    const years = kind === "EXPERIENCE" ? Number(addYears) || 0 : undefined;
    const next = makeCriterion(kind, value, years);
    setCriteria((current) => {
      if (current.some((criterion) => criterion.id === next.id)) return current;
      return [...current, next];
    });
    setAddValue("");
    if (applied) onReset();
  }

  const parseLabel = engine?.engine?.startsWith("gemini")
    ? "Gemini parser"
    : engine?.engine === "rules"
      ? "Rules-based demo parser"
      : "Rules-based demo parser";

  return (
    <section className={"rounded-2xl border border-line bg-surface p-3.5 " + (className ?? "")} data-testid="feed-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <SlidersHorizontal className="h-3.5 w-3.5 text-accent" /> Customise feed
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-ink-muted">
            A discovery filter, not a ranking. Only profile facts are used; unknown stays visible.
          </p>
        </div>
        <p className="text-[11px] text-ink-faint">{parseLabel}</p>
      </div>

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 400))}
          placeholder="e.g. React, at least 2 years, finance background"
          className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          data-testid="feed-input"
          aria-label="Describe who you want to see"
        />
        <Button variant="primary" size="sm" className="h-9 shrink-0" onClick={() => void parse()} disabled={parsing || text.trim().length < 2} data-testid="feed-parse">
          {parsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {parsing ? "Parsing…" : "Parse"}
        </Button>
      </div>

      {(criteria.length > 0 || attempted) && (
        <div className="mt-3" data-testid="feed-criteria">
          <div className="flex flex-wrap items-center gap-2">
            {criteria.map((criterion) => (
              <span
                key={criterion.id}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-2 py-1"
                data-testid="feed-criterion"
              >
                <span className="text-[11px] font-medium text-ink-faint">
                  {criterion.kind === "SKILL" ? "Skill" : criterion.kind === "DOMAIN" ? "Domain" : "Experience"}
                </span>
                <input
                  value={criterion.kind === "EXPERIENCE" ? criterion.skill ?? "" : criterion.value}
                  onChange={(event) =>
                    updateCriterion(
                      criterion.id,
                      criterion.kind === "SKILL"
                        ? { value: event.target.value, skill: event.target.value }
                        : { value: event.target.value },
                    )
                  }
                  className="w-[84px] border-0 bg-transparent p-0 text-[12px] text-ink outline-none"
                  aria-label={"Edit " + criterion.label}
                />
                {criterion.kind === "EXPERIENCE" && (
                  <>
                    <input
                      value={criterion.years ?? 0}
                      onChange={(event) => updateCriterion(criterion.id, { years: Number(event.target.value) || 0 })}
                      type="number"
                      min={0}
                      max={30}
                      className="w-10 rounded border border-line bg-surface px-1 text-[12px] text-ink outline-none"
                      aria-label="Minimum years"
                    />
                    <span className="text-[11px] text-ink-faint">yrs</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeCriterion(criterion.id)}
                  aria-label={"Remove " + criterion.label}
                  className="text-ink-faint transition hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <Button
              variant="accent"
              size="sm"
              className="h-8"
              onClick={() => onApply(criteria)}
              disabled={criteria.length === 0}
              data-testid="feed-apply"
            >
              Apply to feed
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-faint">
            <select
              value={addKind}
              onChange={(event) => setAddKind(event.target.value as FeedCriterionKind)}
              className="h-7 rounded-lg border border-line bg-paper px-2 text-[11px] text-ink"
              aria-label="Criterion type"
            >
              <option value="SKILL">Skill</option>
              <option value="EXPERIENCE">Experience</option>
              <option value="DOMAIN">Domain</option>
            </select>
            <input
              value={addValue}
              onChange={(event) => setAddValue(event.target.value.slice(0, 40))}
              placeholder={addKind === "DOMAIN" ? "finance" : "React"}
              className="h-7 w-28 rounded-lg border border-line bg-paper px-2 text-[11px] text-ink outline-none"
              aria-label="New criterion value"
            />
            {addKind === "EXPERIENCE" && (
              <input
                value={addYears}
                onChange={(event) => setAddYears(event.target.value.slice(0, 3))}
                type="number"
                min={0}
                max={30}
                className="h-7 w-14 rounded-lg border border-line bg-paper px-2 text-[11px] text-ink outline-none"
                aria-label="New criterion years"
              />
            )}
            <button type="button" onClick={addCriterion} className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
              <Plus className="h-3 w-3" /> Add criterion
            </button>
          </div>

          {rejected.length > 0 && (
            <div className="mt-2 space-y-1 text-[11px] leading-5 text-ink-muted" data-testid="feed-rejected">
              {rejected.map((item) => (
                <p key={item.text + item.reason}>
                  <span className="font-medium text-ink">Left out: {item.text}.</span> {item.reason}
                </p>
              ))}
            </div>
          )}
          {unparsed.length > 0 && (
            <p className="mt-1 text-[11px] leading-5 text-ink-faint" data-testid="feed-unparsed">
              Not turned into a criterion: {unparsed.join(", ")}.
            </p>
          )}
          {attempted && criteria.length === 0 && rejected.length === 0 && unparsed.length === 0 && (
            <p className="mt-2 text-[11px] leading-5 text-ink-muted" data-testid="feed-empty-parse">
              Could not turn that into a criterion. Add one below or try a shorter request.
            </p>
          )}
        </div>
      )}

      {applied && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12px] text-ink-muted" data-testid="feed-summary">
          <span>
            <strong className="font-medium text-ink">{inFeed}</strong> in your feed
          </span>
          <span>
            <strong className="font-medium text-ink">{notStated}</strong> not stated
          </span>
          <span>
            <strong className="font-medium text-ink">{outside}</strong> outside your criteria
          </span>
          <span className="text-ink-faint">{broadened ? "Not-stated profiles are included in the deck." : "Unknown is not a fail."}</span>
          <div className="ml-auto flex items-center gap-3">
            {!broadened && notStated > 0 && (
              <button type="button" onClick={onBroaden} className="text-[11px] font-medium text-accent" data-testid="feed-broaden">
                Broaden feed
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setText("");
                setCriteria([]);
                setRejected([]);
                setUnparsed([]);
                setAttempted(false);
                onReset();
              }}
              className="text-[11px] font-medium text-ink-muted"
              data-testid="feed-reset"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
