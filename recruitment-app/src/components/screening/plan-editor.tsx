"use client";

import { useState } from "react";
import { Loader2, Plus, Settings2, Trash2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScreeningCriterion } from "@/lib/screening";

const KIND_OPTIONS = [
  { value: "MUST_HAVE", label: "Must have" },
  { value: "NICE_TO_HAVE", label: "Nice to have" },
  { value: "CONVERSATION", label: "In conversation" },
] as const;

function newCriterion(): ScreeningCriterion {
  const id = "custom:" + (globalThis.crypto?.randomUUID?.() ?? "criterion-" + Date.now());
  return {
    id,
    label: "New criterion",
    kind: "MUST_HAVE",
    source: "CONVERSATION",
    detail: "What the reviewer should look for.",
    ask: "What should the reviewer ask about this?",
  };
}

function validate(criteria: ScreeningCriterion[]): string[] {
  const errors: string[] = [];
  if (criteria.length === 0) errors.push("Keep at least one criterion.");
  if (criteria.length > 7) errors.push("Keep the plan to seven criteria or fewer.");
  for (const criterion of criteria) {
    if (criterion.label.trim().length < 3) errors.push("Every criterion needs a label of at least 3 characters.");
    if (criterion.detail.trim().length < 5) errors.push("Every criterion needs a short description of what good looks like.");
    if (criterion.ask.trim().length < 5) errors.push("Every criterion needs a question the reviewer can ask.");
  }
  return [...new Set(errors)];
}

export function PlanEditor({ roleId, initialPlan }: { roleId: string; initialPlan: ScreeningCriterion[] }) {
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState<ScreeningCriterion[]>(initialPlan);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  function update(id: string, patch: Partial<ScreeningCriterion>) {
    setCriteria((current) => current.map((criterion) => (criterion.id === id ? { ...criterion, ...patch } : criterion)));
  }

  async function resetPlan() {
    setBusy(true);
    setErrors([]);
    try {
      const response = await fetch("/api/screening/roles/" + roleId + "/plan/reset", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not reset the plan.");
      setOpen(false);
      window.location.reload();
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : "Could not reset the plan."]);
      setResetPending(false);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const next = criteria.map((criterion) => ({
      ...criterion,
      label: criterion.label.trim(),
      detail: criterion.detail.trim(),
      ask: criterion.ask.trim(),
    }));
    const validation = validate(next);
    if (validation.length) {
      setErrors(validation);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      const response = await fetch("/api/screening/roles/" + roleId + "/plan", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ criteria: next }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save the plan.");
      setOpen(false);
      // A plan version is rare and affects every reviewer. Reload so the new
      // version is guaranteed to be the one on screen, not a cached RSC.
      window.location.reload();
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : "Could not save the plan."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCriteria(initialPlan);
          setErrors([]);
          setResetPending(false);
          setOpen(true);
        }}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-muted transition hover:border-line-strong hover:text-ink sm:h-8"
      >
        <Settings2 className="h-3.5 w-3.5" aria-hidden /> Edit plan
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit the screening plan</DialogTitle>
            <DialogDescription>
              Every reviewer of this role sees these criteria. The plan affects future pre-screens. A decision already
              recorded keeps its written basis and audit event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {criteria.map((criterion, index) => (
              <div key={criterion.id} className="rounded-lg border border-line bg-paper p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    Criterion {index + 1} · {criterion.source.toLowerCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCriteria((current) => current.filter((entry) => entry.id !== criterion.id))}
                    disabled={criteria.length <= 1}
                    className="inline-flex h-9 items-center gap-1 rounded px-2 text-[10.5px] font-medium text-ink-muted hover:text-rose-700 disabled:opacity-40 sm:h-7"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden /> Remove
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_170px]">
                  <label className="text-[10.5px] font-medium text-ink-muted">
                    Label
                    <input
                      value={criterion.label}
                      onChange={(event) => update(criterion.id, { label: event.target.value })}
                      maxLength={160}
                      className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent"
                    />
                  </label>
                  <label className="text-[10.5px] font-medium text-ink-muted">
                    Kind
                    <select
                      value={criterion.kind}
                      onChange={(event) => update(criterion.id, { kind: event.target.value as ScreeningCriterion["kind"] })}
                      className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink outline-none focus:border-accent"
                    >
                      {KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-2 block text-[10.5px] font-medium text-ink-muted">
                  What good looks like
                  <textarea
                    value={criterion.detail}
                    onChange={(event) => update(criterion.id, { detail: event.target.value })}
                    rows={2}
                    maxLength={320}
                    className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] leading-5 text-ink outline-none focus:border-accent"
                  />
                </label>
                <label className="mt-2 block text-[10.5px] font-medium text-ink-muted">
                  Question to ask
                  <input
                    value={criterion.ask}
                    onChange={(event) => update(criterion.id, { ask: event.target.value })}
                    maxLength={240}
                    className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCriteria((current) => [...current, newCriterion()])}
              disabled={criteria.length >= 7}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 text-[12px] font-medium text-ink-muted transition hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add a criterion
            </button>
            <button
              type="button"
              onClick={() => setResetPending(true)}
              disabled={busy}
              className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-ink-muted hover:text-ink"
            >
              Reset from role card
            </button>
          </div>

          {resetPending ? (
            <div className="mt-3 rounded-md border border-amber-300/70 bg-amber-50 p-3 text-[11.5px] leading-5 text-amber-900">
              <p>
                This replaces the current criteria with a fresh plan derived from the role card. Custom labels and questions
                will be removed, and the plan version will increment.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetPlan}
                  disabled={busy}
                  className="inline-flex h-9 items-center rounded-md bg-amber-900 px-3 text-[11.5px] font-medium text-white disabled:opacity-60"
                >
                  Confirm reset
                </button>
                <button
                  type="button"
                  onClick={() => setResetPending(false)}
                  className="inline-flex h-9 items-center rounded-md border border-amber-300 bg-white px-3 text-[11.5px] font-medium text-amber-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {errors.length ? (
            <ul className="mt-3 space-y-1 rounded-md border border-rose-200 bg-rose-50 p-3 text-[11.5px] leading-5 text-rose-800" role="alert">
              {errors.map((error) => (
                <li key={error} className="flex items-start gap-1.5">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
                </li>
              ))}
            </ul>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-[12px] font-medium text-ink-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[12px] font-medium text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Save plan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
