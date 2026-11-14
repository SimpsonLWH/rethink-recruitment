"use client";

import { useState } from "react";
import { ArrowUp, Bot, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EngineBadge } from "@/components/brand/evidence-badges";
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
    <div className="rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-rose" /> Ask this profile
          </p>
          <p className="mt-1 text-[10px] text-ink-faint">Answers only from the facts below. Sources are always shown.</p>
        </div>
        <EngineBadge engine={engine} />
      </div>

      <form
        className="mt-3 flex gap-2"
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
          className="h-10 text-[12px]"
          data-testid="ask-profile-input"
        />
        <Button type="submit" size="sm" variant="primary" disabled={loading || question.trim().length === 0} className="h-10 shrink-0" data-testid="ask-profile-send">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
        </Button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuestion(suggestion);
              void ask(suggestion);
            }}
            disabled={loading}
            className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-left text-[9.5px] text-ink-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-paper/55 px-3.5 py-3 text-[10.5px] text-ink-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose" /> Reading the record, not the internet…
        </div>
      )}

      {answer && (
        <div className="mt-4 rounded-2xl border border-line bg-paper/55 p-3.5" data-testid="ask-profile-answer">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint"><Bot className="h-3 w-3" /> From this record</p>
          <p className="mt-2 whitespace-pre-wrap text-[11.5px] leading-5 text-ink-soft">{answer}</p>
          {sources.length > 0 && (
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint"><Sparkles className="h-3 w-3" /> Sources</p>
              <div className="mt-1.5 space-y-1.5">
                {sources.map((source) => (
                  <div key={source.factId} className="rounded-lg border border-line bg-surface px-2.5 py-2">
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{source.prompt}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-ink-muted">{source.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <p className="mt-3 text-[9px] leading-4 text-ink-faint">
        The model never changes provenance and cannot use anything outside this profile. If the answer is not in
        the record, it says so.
      </p>
    </div>
  );
}
