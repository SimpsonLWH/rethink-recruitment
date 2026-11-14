"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb, Loader2, Play, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/assessments/code-editor";
import { usePrepareProgress } from "@/components/learn/progress";
import { cn } from "@/lib/utils";
import type { PracticeCheck, PracticeView } from "@/lib/learn/practice";

function valueLabel(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function PracticeSolver({ view, itemKey }: { view: PracticeView; itemKey: string }) {
  const { problem } = view;
  const draftKey = "rivet-practice-draft-" + problem.id;
  const [answer, setAnswer] = useState(problem.kind === "code" ? problem.starterCode : "");
  const [result, setResult] = useState<PracticeCheck | null>(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { done, markDone } = usePrepareProgress();
  const solved = done.includes(itemKey);

  useEffect(() => {
    if (problem.kind !== "code") return;
    try {
      const saved = window.localStorage.getItem(draftKey);
      if (saved) setAnswer(saved);
    } catch {
      // Drafts are optional.
    }
  }, [draftKey, problem.kind]);

  function update(next: string) {
    setAnswer(next);
    setResult(null);
    if (problem.kind === "code") {
      try {
        window.localStorage.setItem(draftKey, next);
      } catch {
        // Drafts are optional.
      }
    }
  }

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      const response = await fetch("/api/practice/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, answer }),
      });
      const data = (await response.json()) as { result?: PracticeCheck; error?: string };
      if (!response.ok || !data.result) {
        toast.error(data.error ?? "Could not check that answer.");
        return;
      }
      setResult(data.result);
      const success = data.result.kind === "code" ? data.result.allPassed : data.result.correct;
      if (success) {
        markDone(itemKey);
        toast.success("Solved. Nice work.");
      }
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setRunning(false);
    }
  }

  const explanation = result && (result.kind === "code" ? result.explanation : result.explanation);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start" data-testid="practice-solver">
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <p className="whitespace-pre-wrap text-[14px] leading-7 text-ink-soft">{problem.statement}</p>
        {problem.kind === "code" && view.tests.length > 0 ? (
          <div className="mt-5">
            <p className="text-[12px] font-semibold text-ink">Test cases (all visible in practice)</p>
            <ul className="mt-2 space-y-1.5 font-mono text-[12px]">
              {view.tests.map((test, index) => (
                <li key={index} className="rounded-md border border-line bg-paper px-3 py-2 text-ink-soft">
                  <span className="break-words">
                    {problem.functionName}({test.args.map(valueLabel).join(", ")})
                  </span>
                  <span className="text-ink-faint"> → </span>
                  <span className="break-words text-ink">{valueLabel(test.expected)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {view.hint ? (
          <div className="mt-5">
            {showHint ? (
              <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-900">
                <Lightbulb className="mt-1 h-3.5 w-3.5 shrink-0" /> {view.hint}
              </p>
            ) : (
              <button type="button" onClick={() => setShowHint(true)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-deep">
                <Lightbulb className="h-3.5 w-3.5" /> Show a hint
              </button>
            )}
          </div>
        ) : null}
        {solved ? (
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent-tint px-2.5 py-1 text-[12px] font-semibold text-accent-deep">
            <CheckCircle2 className="h-3.5 w-3.5" /> Solved in this browser
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        {problem.kind === "code" ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 bg-[#1e1e1e] px-3 py-2">
              <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80">JavaScript (Node)</span>
              <button
                type="button"
                onClick={() => update(problem.starterCode)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
            <CodeEditor problemId={"practice-" + problem.id} title={problem.title} value={answer} onChange={update} height={340} />
          </>
        ) : problem.kind === "choice" ? (
          <fieldset className="space-y-2.5 p-5">
            <legend className="mb-2 text-[13px] font-semibold text-ink">Choose one</legend>
            {problem.options.map((option, index) => (
              <label
                key={index}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-[14px]",
                  answer === String(index) ? "border-accent bg-accent-tint" : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name={"practice-" + problem.id}
                  checked={answer === String(index)}
                  onChange={() => update(String(index))}
                  className="h-4 w-4 accent-[#16833F]"
                />
                {option}
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="p-5">
            <label htmlFor={"practice-" + problem.id} className="text-[13px] font-semibold text-ink">
              Your answer
            </label>
            <input
              id={"practice-" + problem.id}
              value={answer}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => update(event.target.value.slice(0, 40))}
              onKeyDown={(event) => {
                if (event.key === "Enter") void run();
              }}
              placeholder="e.g. 0.25, 1/4 or 25%"
              className="mt-2 h-11 w-full max-w-xs rounded-lg border border-line-strong px-3 font-mono text-[15px] outline-none focus:border-accent"
            />
          </div>
        )}

        <div className="border-t border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-ink-muted">Practice: unlimited runs, nothing is recorded as evidence.</p>
            <Button variant="primary" size="sm" onClick={() => void run()} disabled={running || !answer.trim()} data-testid="practice-run">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {problem.kind === "code" ? "Run tests" : "Check answer"}
            </Button>
          </div>

          {result?.kind === "code" ? (
            <div className="mt-3 overflow-hidden rounded-md border border-line" data-testid="practice-results">
              <p
                className={cn(
                  "px-3 py-2 text-[12px] font-semibold",
                  result.allPassed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900",
                )}
              >
                {result.results.filter((entry) => entry.passed).length} of {result.results.length} tests passed
              </p>
              <ul className="divide-y divide-line">
                {result.results.map((entry, index) => (
                  <li key={entry.id} className="flex items-start gap-2 px-3 py-2 text-[12px]">
                    {entry.passed ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" />
                    )}
                    <span className="min-w-0">
                      <span className="font-medium text-ink">Test {index + 1}</span>
                      <span className="ml-2 break-words font-mono text-ink-muted">expects {valueLabel(entry.expected)}</span>
                      {entry.error ? <span className="block text-rose-800">{entry.error}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : result?.kind === "answer" ? (
            <p
              className={cn(
                "mt-3 rounded-md px-3 py-2 text-[13px] font-medium",
                result.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900",
              )}
              data-testid="practice-results"
            >
              {result.correct ? "Correct." : result.message ?? "Not quite. Try again."}
            </p>
          ) : null}

          {explanation ? (
            <div className="mt-3 rounded-md border border-line bg-paper px-3 py-2.5 text-[13px] leading-6 text-ink-soft">
              <p className="text-[12px] font-semibold text-ink">Why it works</p>
              <p className="mt-1">{explanation}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
