"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Edit3, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { EngineBadge, LinkStatusBadge, ProvenanceBadge } from "@/components/brand/evidence-badges";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { TailoringDraftView, TailoringItemView } from "@/lib/repo";
import { cn } from "@/lib/utils";

function uniqueProvenances(item: TailoringItemView) {
  return Array.from(new Set(item.sourceFacts.map((fact) => fact.provenance)));
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
      <div className="space-y-3" data-testid="tailoring-review">
        {sorted.map((item) => {
          const text = item.editedText ?? item.suggestedText;
          const isEditing = editingId === item.id;
          return (
            <article
              key={item.id}
              className={cn(
                "overflow-hidden rounded-[24px] border bg-surface transition",
                item.status === "APPROVED" ? "border-moss/35" : item.status === "REJECTED" ? "border-line opacity-65" : "border-line",
              )}
              data-testid="tailoring-suggestion"
            >
              <div className="grid md:grid-cols-[0.88fr_1.12fr]">
                <div className="border-b border-line bg-paper/55 p-4 md:border-b-0 md:border-r">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Trace · source fact{item.sourceFacts.length === 1 ? "" : "s"}</p>
                  <div className="mt-2.5 space-y-2.5">
                    {item.sourceFacts.map((fact) => (
                      <div key={fact.id} className="rounded-xl border border-line bg-surface p-3">
                        <p className="text-[8.5px] font-semibold uppercase tracking-[0.09em] text-ink-faint">{fact.prompt}</p>
                        <p className="mt-1 line-clamp-4 text-[10.5px] leading-5 text-ink-soft">{fact.claim}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <ProvenanceBadge provenance={fact.provenance} className="scale-[0.9] origin-left" />
                          {fact.linkStatus && <LinkStatusBadge status={fact.linkStatus.status} className="scale-[0.9] origin-left" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn("rounded-full border px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-[0.1em]", item.kind === "FOREGROUND" ? "border-rose/20 bg-rose-tint text-rose-deep" : "border-line bg-paper text-ink-muted")}>
                      {item.kind === "FOREGROUND" ? "Foreground" : "Reword"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.status === "APPROVED" && <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-moss">Approved</span>}
                      {item.status === "REJECTED" && <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Rejected</span>}
                      {item.editedText && <span className="rounded-full border border-line px-2 py-0.5 text-[8.5px] font-medium text-ink-muted">Edited by you</span>}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3">
                      <Textarea value={editValue} onChange={(event) => setEditValue(event.target.value.slice(0, 1200))} className="min-h-[100px] text-[12px]" autoFocus data-testid="tailoring-edit-textarea" />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] text-ink-faint">{editValue.length}/1200 · same source facts</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" variant="primary" onClick={() => void saveEdit(item)} disabled={busyId === item.id}>Save wording</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 font-display text-[21px] leading-[1.45] tracking-[-0.01em] text-ink">{text}</p>
                  )}

                  <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-faint">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-rose" /> {item.rationale}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[9.5px] text-ink-faint">
                    <ShieldCheck className="h-3 w-3 text-moss" />
                    {uniqueProvenances(item).map((provenance) => (
                      <ProvenanceBadge key={provenance} provenance={provenance} className="scale-[0.88] origin-left" />
                    ))}
                    <span>Provenance follows the source facts; AI cannot change it.</span>
                  </p>

                  {!isEditing && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <Button size="sm" variant={item.status === "APPROVED" ? "secondary" : "primary"} onClick={() => void setStatus(item, item.status === "APPROVED" ? "SUGGESTED" : "APPROVED")} disabled={busyId === item.id} data-testid="tailoring-approve-item">
                        {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : item.status === "APPROVED" ? <Check className="h-3 w-3" /> : <Check className="h-3 w-3" />}
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
        <div className="rounded-[24px] border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Approval</p>
            <EngineBadge engine={draft.engine} />
          </div>
          <p className="mt-2 font-display text-[23px] leading-tight">{approvedCount} of {items.length} lines approved</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-rose transition-all" style={{ width: (items.length ? (approvedCount / items.length) * 100 : 0) + "%" }} />
          </div>
          <p className="mt-3 text-[10px] leading-5 text-ink-muted">
            The employer preview contains only approved lines. The master record is unchanged, and rejected
            lines disappear from the shared version.
          </p>
          <Button className="mt-4 w-full" variant="primary" onClick={() => void approveAndPreview()} disabled={approvedCount === 0 || approving} data-testid="tailoring-approve-all">
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {approving ? "Approving…" : "Approve & see what they see"}
          </Button>
          <p className="mt-2 text-center text-[9px] text-ink-faint">A human approval is required before sharing.</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper/55 p-4 text-[10px] leading-5 text-ink-muted">
          <p className="flex items-center gap-1.5 font-semibold text-ink-soft"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> Only the record</p>
          <p className="mt-1.5">Each suggestion carries the IDs of the source facts it derives from. If an ID is missing, the app rejects the suggestion.</p>
          <Link href="/profile" className="mt-2 inline-flex items-center gap-1 font-semibold text-ink transition hover:text-rose">See the master record <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-faint">Reviewing as</p>
          <p className="mt-1.5 font-display text-[18px]">{candidateName}</p>
          <p className="mt-1 text-[10px] leading-4 text-ink-muted">You can edit the wording, but not the facts or provenance.</p>
        </div>
      </aside>
    </div>
  );
}
