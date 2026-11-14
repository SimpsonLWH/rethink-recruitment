"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StartTailoringButton({
  roleId,
  label = "Generate tailored version",
  variant = "primary",
  className,
}: {
  roleId: string;
  label?: string;
  variant?: "primary" | "accent" | "secondary";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      const data = (await response.json()) as { draft?: unknown; engine?: string; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not generate the tailored version.");
        return;
      }
      toast.success(data.engine === "fallback" ? "Generated with the demo AI fallback." : "Generated with Nemotron.");
      window.dispatchEvent(new Event("rivet:ai-run"));
      router.push("/tailor/" + roleId);
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} onClick={() => void start()} disabled={loading} className={cn(className)} data-testid="start-tailoring">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {loading ? "Reading your record…" : label}
    </Button>
  );
}
