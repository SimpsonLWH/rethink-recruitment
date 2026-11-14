"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartAssessmentButton({
  assessmentId,
  label = "Start assessment",
  disabled = false,
}: {
  assessmentId: string;
  label?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const response = await fetch("/api/assessments/" + assessmentId + "/attempts", { method: "POST" });
      const data = (await response.json()) as { attempt?: { id: string }; error?: string };
      if (!response.ok || !data.attempt) {
        toast.error(data.error ?? "Could not start that assessment.");
        return;
      }
      router.push("/assessments/attempts/" + data.attempt.id);
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => void start()}
      disabled={busy || disabled}
      data-testid="start-assessment"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
      {busy ? "Opening…" : label}
    </Button>
  );
}
