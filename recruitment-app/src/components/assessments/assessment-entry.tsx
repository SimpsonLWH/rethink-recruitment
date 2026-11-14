"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AssessmentRunner } from "@/components/assessments/assessment-runner";
import { assessmentTitle } from "@/lib/ui-copy";
import type { AssessmentAttemptView, AssessmentSummary } from "@/lib/repo";

/**
 * Starts an OA sitting and renders it in place.
 *
 * The Vercel demo copies the SQLite file per serverless instance, so a
 * navigation to /assessments/attempts/[id] can hit an instance that has never
 * seen the new attempt row. Keeping the returned attempt in client state means
 * the start -> solve -> submit flow does not depend on that second lookup.
 */
export function AssessmentEntry({
  assessment,
  label = "Start assessment",
  continueAttempt = false,
}: {
  assessment: AssessmentSummary;
  label?: string;
  continueAttempt?: boolean;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AssessmentAttemptView | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function start() {
    if (starting || attempt) return;
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/assessments/" + assessment.id + "/attempts", { method: "POST" });
      const data = (await response.json()) as { attempt?: AssessmentAttemptView; error?: string };
      if (!response.ok || !data.attempt) {
        const message = data.error ?? "Could not start that assessment.";
        setError(message);
        toast.error(message);
        return;
      }
      setAttempt(data.attempt);
    } catch {
      setError("Network hiccup. Try starting the assessment again.");
      toast.error("Network hiccup. Try starting the assessment again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void start()}
          disabled={starting}
          data-testid={continueAttempt ? "continue-assessment" : "start-assessment"}
        >
          {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          {starting ? "Opening..." : label}
        </Button>
        {error ? (
          <p role="alert" className="mt-2 text-[11px] leading-5 text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      {mounted && attempt
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={assessmentTitle(assessment.title) + " assessment"}
              className="fixed inset-0 z-50 overflow-y-auto bg-paper"
              data-testid="oa-overlay"
            >
              <AssessmentRunner
                attempt={attempt}
                embedded
                onExit={() => {
                  setAttempt(null);
                  router.refresh();
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
