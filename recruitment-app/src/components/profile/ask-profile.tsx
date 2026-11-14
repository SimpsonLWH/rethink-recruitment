"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CandidateDetail } from "@/lib/repo";

interface AskSource {
  factId: string;
  prompt: string;
  excerpt: string;
}

const SUGGESTIONS = [
  "What is the strongest evidence in this record?",
  "What does this person want in a team?",
  "What have they actually shipped?",
];

function engineLabel(engine: string | null) {
  if (!engine) return null;
  if (engine.startsWith("nemotron")) return "Nemotron 3.5 Super VL";
  if (engine.startsWith("gemini")) return "Gemini";
  return "Demo fallback · local";
}

export function AskProfile({ candidate }: { candidate: CandidateDetail }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<AskSource[]>([]);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer(null);
    setSources([]);
    setEngine(null);
    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id, question: trimmed }),
      });
      const data = (await response.json()) as { answer?: string; sources?: AskSource[]; engine?: string; error?: string };
      if (!response.ok || !data.answer) {
        toast.error(data.error ?? "Could not answer from this record.");
        return;
      }
      setAnswer(data.answer);
      setSources(data.sources ?? []);
      setEngine(data.engine ?? null);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("rivet:ai-run"));
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-line bg-surface p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Ask this profile</p>
      <p className="mt-2 text-[13px] leading-6 text-ink-muted">
        Answers come only from this record. Sources are always shown.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value.slice(0, 240))}
          placeholder="Ask about the record…"
          aria-label="Question about this candidate's record"
          className="h-11 text-[14px]"
          data-testid="ask-profile-input"
        />
        <Button
          type="submit"
          size="md"
          variant="primary"
          disabled={loading || question.trim().length === 0}
          className="shrink-0 px-4"
          data-testid="ask-profile-send"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuestion(suggestion);
              void ask(suggestion);
            }}
            disabled={loading}
            className="text-left text-[12px] leading-5 text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[13px] text-ink-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the record, not the internet…
        </p>
      )}

      {answer && (
        <div className="mt-5 border-t border-line pt-4" data-testid="ask-profile-answer">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">From this record</p>
            {engineLabel(engine) && <p className="text-[11px] text-ink-faint">{engineLabel(engine)}</p>}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-ink-soft">{answer}</p>
          {sources.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">Sources</p>
              {sources.map((source) => (
                <div key={source.factId} className="border-l border-line-strong pl-3">
                  <p className="text-[11px] font-medium text-ink-muted">{source.prompt}</p>
                  <p className="mt-1 text-[12px] leading-5 text-ink-muted">{source.excerpt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-5 border-t border-line pt-4 text-[11.5px] leading-5 text-ink-faint">
        The model can only use this profile and cannot change provenance.{" "}
        <Link
          href="/how-it-works#ai"
          className="font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition hover:text-ink"
        >
          How AI is used
        </Link>
      </p>
    </section>
  );
}
