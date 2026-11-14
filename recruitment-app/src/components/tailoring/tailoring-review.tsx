"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Edit3, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { LinkStatusBadge, ProvenanceBadge } from "@/components/brand/evidence-badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TailoringDraftView, TailoringItemView } from "@/lib/repo";
import { cn } from "@/lib/utils";

function engineLabel(engine: string) {
  if (engine.startsWith("nemotron")) return "Nemotron 3.5 Super VL";
  if (engine.startsWith("gemini")) return "Gemini";
  return "Demo mode · local";
}

export function TailoringReview({ draft, candidateName }: { draft: TailoringDraftView; candidateName: string }) {
  const router = useRouter();
  const [items, setItems] = useState(draft.items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [approving, setApproving] = useState(false);

  const approvedCount = items.filter((item) => item.status === "APPROVED").length;

  function updateLocal(id: string, patch: Partial<TailoringItemView>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function patchItem(id: string, body: { status?: "APPROVED" | "REJECTED" | "SUGGESTED"; editedText?: string | null }) {
    setBusyId(id);
    try {
      const response = await fetch("/api/ai/tailor/items/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not save that review.");
        return false;
      }
      return true;
    } catch {
      toast.error("Network hiccup. Try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function setStatus(item: TailoringItemView, status: "APPROVED" | "REJECTED" | "SUGGESTED") {
    if (busyId) return;
    const previous = item.status;
    updateLocal(item.id, { status });
    const ok = await patchItem(item.id, { status });
    if (!ok) updateLocal(item.id, { status: previous });
  }

  async function saveEdit(item: TailoringItemView) {
    const value = editValue.trim();
    updateLocal(item.id, { editedText: value || null });
    const ok = await patchItem(item.id, { editedText: value || null });
    if (!ok) return;
    setEditingId(null);
    toast.success("Your wording is saved. It is still sourced from the same facts.");
  }

  async function approveAndPreview() {
    if (approvedCount === 0 || approving) return;
    setApproving(true);
    try {
      const response = await fetch("/api/ai/tailor/" + encodeURIComponent(draft.id) + "/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not approve this version.");
        return;
      }
      toast.success("Approved. Only the approved lines appear in the preview.");
      router.push("/tailor/" + draft.role.id + "/preview");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setApproving(false);
    }
  }

  const sorted = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <div className="space-y-4" data-testid="tailoring-review">
        {draft.note && (
          <p
            className="rounded-lg border border-line bg-paper/60 px-4 py-3 text-[12px] leading-5 text-ink-muted"
            data-testid="tailoring-note"
          >
            <span className="font-medium text-ink-soft">Draft note.</span> {draft.note}
          </p>
        )}
        {sorted.map((item) => {
          const text = item.editedText ?? item.suggestedText;
          const isEditing = editingId === item.id;
          return (
            <article
              key={item.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-surface transition",
                item.status === "APPROVED"
                  ? "border-accent/40"
                  : item.status === "REJECTED"
                    ? "border-line opacity-65"
                    : "border-line",
              )}
              data-testid="tailoring-suggestion"
            >
              <div className="grid md:grid-cols-[0.82fr_1.18fr]">
                <div className="border-b border-line bg-paper/40 p-5 md:border-b-0 md:border-r">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Source fact{item.sourceFacts.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-3 space-y-4">
                    {item.sourceFacts.map((fact) => (
                      <div key={fact.id}>
                        <p className="text-[11px] font-medium text-ink-muted">{fact.prompt}</p>
                        <p className="mt-1 line-clamp-4 text-[13px] leading-5 text-ink-soft" data-testid="tailoring-source-claim">{fact.claim}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                          <ProvenanceBadge provenance={fact.provenance} />
                          {fact.linkStatus && <LinkStatusBadge status={fact.linkStatus.status} />}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                      {item.kind === "FOREGROUND" ? "Foreground" : "Reword"}
                    </p>
                    <p className="flex items-center gap-3 text-[11px]">
                      {item.status === "APPROVED" && <span className="font-medium text-accent">Approved</span>}
                      {item.status === "REJECTED" && <span className="text-ink-faint">Rejected</span>}
                      {item.editedText && <span className="text-ink-faint">Edited by you</span>}
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="mt-3">
                      <Textarea
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value.slice(0, 1200))}
                        className="min-h-[104px] text-[14px] leading-6"
                        autoFocus
                        data-testid="tailoring-edit-textarea"
                      />
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-ink-faint">{editValue.length}/1200 · same source facts</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => void saveEdit(item)} disabled={busyId === item.id}>
                            Save wording
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-[17px] leading-[1.55] text-ink" data-testid="tailoring-suggestion-text">{text}</p>
                  )}

                  <p className="mt-3 text-[12px] leading-5 text-ink-muted">{item.rationale}</p>
                  <p className="mt-2 text-[11px] leading-5 text-ink-faint">
                    Provenance follows the source facts; AI cannot change it.
                  </p>

                  {!isEditing && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <Button
                        size="sm"
                        variant={item.status === "APPROVED" ? "secondary" : "primary"}
                        onClick={() => void setStatus(item, item.status === "APPROVED" ? "SUGGESTED" : "APPROVED")}
                        disabled={busyId === item.id}
                        data-testid="tailoring-approve-item"
                      >
                        {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        {item.status === "APPROVED" ? "Approved" : "Approve line"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditValue(text);
                        }}
                        disabled={busyId === item.id}
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void setStatus(item, item.status === "REJECTED" ? "SUGGESTED" : "REJECTED")}
                        disabled={busyId === item.id}
                      >
                        {item.status === "REJECTED" ? <Clock3 className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {item.status === "REJECTED" ? "Undo" : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Approval</p>
            <p className="text-[11px] text-ink-faint">{engineLabel(draft.engine)}</p>
          </div>
          <p className="mt-2 text-[22px] font-semibold leading-tight tabular-nums">
            {approvedCount} of {items.length} approved
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: (items.length ? (approvedCount / items.length) * 100 : 0) + "%" }}
            />
          </div>
          <p className="mt-3 text-[12px] leading-5 text-ink-muted">
            Only approved lines appear in the employer preview. The master record is unchanged.
          </p>
          <Button
            className="mt-4 w-full"
            variant="primary"
            onClick={() => void approveAndPreview()}
            disabled={approvedCount === 0 || approving}
            data-testid="tailoring-approve-all"
          >
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {approving ? "Approving…" : "Approve & see what they see"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-ink-faint">A human approval is required before sharing.</p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The rule</p>
          <p className="mt-2 text-[13px] leading-6 text-ink-soft">
            Each line carries its source fact IDs; a line without one is rejected.
          </p>
          <Link
            href="/profile"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-muted transition hover:text-ink"
          >
            See your profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Reviewing as</p>
          <p className="mt-1.5 font-display text-[18px]">{candidateName}</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">Wording is editable; facts and provenance are not.</p>
        </div>
      </aside>
    </div>
  );
}