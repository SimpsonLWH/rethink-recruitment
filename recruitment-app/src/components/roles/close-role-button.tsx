"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CloseRoleButton({ roleId }: { roleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function close() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/roles/" + roleId + "/close", { method: "POST" });
      const data = (await response.json()) as { outcomes?: number; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not close that role.");
        return;
      }
      toast.success("Role closed. " + (data.outcomes ?? 0) + " honest outcome updates delivered.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void close()}
      disabled={busy}
      className="text-[11px] font-medium text-ink-muted transition hover:text-ink disabled:opacity-50"
      data-testid="close-role"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Close role"}
    </button>
  );
}
