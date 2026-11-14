"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LIVE_ROLE_FAMILIES, roleFamilyTemplate } from "@/lib/role-card-templates";
import type { AssessmentSummary, RoleDetail, RoleSignal } from "@/lib/repo";

function difficultyLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function RoleCardForm({
  mode,
  role,
  catalog,
  employerContact,
  redirectTo = "/discover",
}: {
  mode: "create" | "edit";
  role?: RoleDetail;
  catalog: AssessmentSummary[];
  employerContact: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const initialFamily = role?.roleFamily ?? LIVE_ROLE_FAMILIES[0];
  const initialTemplate = roleFamilyTemplate(initialFamily);
  const initialSignals = role?.evidenceSignals ?? initialTemplate.suggestedSignals;
  const initialAssessmentId =
    role?.assessment?.id ??
    catalog.find((assessment) => assessment.playable && assessment.family === initialTemplate.recommendedAssessmentFamily)?.id ??
    catalog.find((assessment) => assessment.playable)?.id ??
    "";
  const [roleFamily, setRoleFamily] = useState(initialFamily);
  const [title, setTitle] = useState(role?.title ?? "");
  const [employmentType, setEmploymentType] = useState(role?.employmentType ?? "Full-time");
  const [workMode, setWorkMode] = useState(role?.workMode ?? "Hybrid · 2 days in Espoo");
  const [location, setLocation] = useState(role?.location ?? "Espoo");
  const [summary, setSummary] = useState(role?.summary ?? initialTemplate.exampleDescription);
  const [whyJoin, setWhyJoin] = useState(role?.whyJoin ?? "");
  const [problemNow, setProblemNow] = useState(role?.problemNow ?? "");
  const [first90, setFirst90] = useState(role?.first90 ?? "");
  const [skills, setSkills] = useState(role?.skills.join(", ") ?? "");
  const [requirements, setRequirements] = useState<Array<{ assessmentId: string; requiredScore: string }>>(
    role?.requirements?.length
      ? role.requirements.map((requirement) => ({
          assessmentId: requirement.assessmentId,
          requiredScore: String(requirement.requiredScore),
        }))
      : [
          {
            assessmentId: initialAssessmentId,
            requiredScore: String(role?.requiredScore ?? 70),
          },
        ],
  );
  const [reviewOwnerName, setReviewOwnerName] = useState(role?.reviewOwnerName ?? employerContact);
  const [publish, setPublish] = useState(role ? role.configStatus === "LIVE" : true);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>(initialSignals.map((signal) => signal.id));
  const [busy, setBusy] = useState(false);

  const playable = catalog.filter((assessment) => assessment.playable);
  const allSignals = useMemo(() => {
    const template = roleFamilyTemplate(roleFamily);
    const combined = [...template.suggestedSignals, ...(role?.evidenceSignals ?? [])];
    return Array.from(new Map(combined.map((signal) => [signal.id, signal] as const)).values());
  }, [roleFamily, role?.evidenceSignals]);

  function changeFamily(nextFamily: string) {
    setRoleFamily(nextFamily);
    if (mode === "create") {
      const template = roleFamilyTemplate(nextFamily);
      setSummary(template.exampleDescription);
      setSelectedSignalIds(template.suggestedSignals.map((signal) => signal.id));
      const recommended = playable.find((assessment) => assessment.family === template.recommendedAssessmentFamily);
      if (recommended) {
        setRequirements((previous) => [
          { ...previous[0], assessmentId: recommended.id },
          ...previous.slice(1),
        ]);
      }
    }
  }

  function updateRequirement(index: number, patch: Partial<{ assessmentId: string; requiredScore: string }>) {
    setRequirements((previous) =>
      previous.map((requirement, currentIndex) => (currentIndex === index ? { ...requirement, ...patch } : requirement)),
    );
  }

  function addRequirement() {
    if (requirements.length >= 3) {
      toast.error("Choose at most three assessment requirements.");
      return;
    }
    setRequirements((previous) => [...previous, { assessmentId: playable[0]?.id ?? "", requiredScore: "60" }]);
  }

  function removeRequirement(index: number) {
    if (requirements.length === 1) {
      toast.error("Keep at least one assessment requirement.");
      return;
    }
    setRequirements((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  }

  function toggleSignal(id: string) {
    setSelectedSignalIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      if (previous.length >= 4) {
        toast.error("Choose at most four signals.");
        return previous;
      }
      return [...previous, id];
    });
  }

  async function submit() {
    if (busy) return;
    const parsedRequirements = requirements.map((requirement) => ({
      assessmentId: requirement.assessmentId,
      requiredScore: Number(requirement.requiredScore),
    }));
    if (parsedRequirements.some((requirement) => !requirement.assessmentId)) {
      toast.error("Choose a playable assessment for every requirement.");
      return;
    }
    if (parsedRequirements.some((requirement) => !Number.isInteger(requirement.requiredScore) || requirement.requiredScore < 0 || requirement.requiredScore > 100)) {
      toast.error("Every required score must be a whole number from 0 to 100.");
      return;
    }
    const primary = parsedRequirements[0];
    const signals: RoleSignal[] = allSignals.filter((signal) => selectedSignalIds.includes(signal.id));
    setBusy(true);
    try {
      const response = await fetch(mode === "create" ? "/api/roles" : "/api/roles/" + role?.id, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          employmentType,
          workMode,
          location,
          summary,
          whyJoin,
          problemNow,
          first90,
          skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
          roleFamily,
          assessmentId: primary.assessmentId,
          requiredScore: primary.requiredScore,
          requirements: parsedRequirements,
          signals,
          reviewOwnerName,
          publish,
        }),
      });
      const data = (await response.json()) as { role?: RoleDetail; error?: string };
      if (!response.ok || !data.role) {
        toast.error(data.error ?? "Could not save the role card.");
        return;
      }
      toast.success(publish ? "Role card published." : "Role card saved as draft.");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl" data-testid="role-card-form">
      <Link href="/roles" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Role cards
      </Link>

      <div className="mt-5 space-y-6">
        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">1 · The need</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            Say what the role is for, in your own words. Templates are examples, not a substitute for your judgment.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
              Role title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5" maxLength={120} placeholder="Backend Engineer" />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              Role family
              <select
                value={roleFamily}
                onChange={(event) => changeFamily(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink"
              >
                {LIVE_ROLE_FAMILIES.map((family) => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              Employment type
              <Input value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="mt-1.5" />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              Work mode
              <Input value={workMode} onChange={(event) => setWorkMode(event.target.value)} className="mt-1.5" />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              Location
              <Input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1.5" />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
              What the role does
              <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1.5 min-h-[96px]" maxLength={600} />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
              Skills visible on the role
              <Input value={skills} onChange={(event) => setSkills(event.target.value)} className="mt-1.5" placeholder="PostgreSQL, Node.js, reliability" />
            </label>
          </div>
        </section>

        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">2 · The evidence you accept</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            Pick one or more exact assessment versions and the score you consider sufficient. The system filters and
            presents; you decide. A below-bar result never auto-rejects anyone.
          </p>
          <div className="mt-5 space-y-3">
            {requirements.map((requirement, index) => (
              <div key={index} className="rounded-xl border border-line bg-paper p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-medium text-ink">
                    {index === 0 ? "Primary assessment" : "Additional assessment " + index}
                  </p>
                  {requirements.length > 1 ? (
                    <button type="button" onClick={() => removeRequirement(index)} className="text-[11px] font-medium text-ink-muted">
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
                  <label className="block text-[12px] font-medium text-ink-soft">
                    Assessment
                    <select
                      value={requirement.assessmentId}
                      onChange={(event) => updateRequirement(index, { assessmentId: event.target.value })}
                      className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink"
                    >
                      <option value="">Choose a playable assessment</option>
                      {playable.map((assessment) => (
                        <option key={assessment.id} value={assessment.id}>
                          {assessment.family} · {assessment.version} · {difficultyLabel(assessment.difficulty)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[12px] font-medium text-ink-soft">
                    Required score (0–100)
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={requirement.requiredScore}
                      onChange={(event) => updateRequirement(index, { requiredScore: event.target.value })}
                      className="mt-1.5"
                    />
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              disabled={requirements.length >= 3}
              className="text-[12px] font-medium text-accent disabled:text-ink-faint"
            >
              + Add another assessment requirement
            </button>
            <label className="block max-w-md text-[12px] font-medium text-ink-soft">
              Review owner
              <Input value={reviewOwnerName} onChange={(event) => setReviewOwnerName(event.target.value)} className="mt-1.5" maxLength={120} />
            </label>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-ink-faint">
            Review expectation: {role?.reviewDueHours ?? 48}h after a below-bar candidate asks for review. The owner is
            named for accountability; this is not an automated decision.
          </p>
        </section>

        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">3 · What experience matters</p>
          <p className="mt-1 text-[12px] leading-5 text-ink-muted">
            Up to four structured signals. Unknown stays visible as not stated; nothing is inferred from a name,
            location, nationality, language or education.
          </p>
          <div className="mt-4 space-y-2">
            {allSignals.map((signal) => (
              <label key={signal.id} className="flex items-start gap-3 rounded-xl border border-line bg-paper px-3 py-2.5 text-[12px] leading-5">
                <input
                  type="checkbox"
                  checked={selectedSignalIds.includes(signal.id)}
                  onChange={() => toggleSignal(signal.id)}
                  className="mt-0.5 h-4 w-4 accent-[#A64056]"
                />
                <span>
                  <span className="font-medium text-ink">{signal.label}</span>
                  <span className="ml-1.5 text-ink-faint">{signal.kind.toLowerCase()}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">4 · The rest of the role</p>
          <div className="mt-4 space-y-4">
            <label className="block text-[12px] font-medium text-ink-soft">
              Why join
              <Textarea value={whyJoin} onChange={(event) => setWhyJoin(event.target.value)} className="mt-1.5 min-h-[72px]" maxLength={600} />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              A problem the team is solving now
              <Textarea value={problemNow} onChange={(event) => setProblemNow(event.target.value)} className="mt-1.5 min-h-[72px]" maxLength={600} />
            </label>
            <label className="block text-[12px] font-medium text-ink-soft">
              What good looks like in 90 days
              <Textarea value={first90} onChange={(event) => setFirst90(event.target.value)} className="mt-1.5 min-h-[72px]" maxLength={600} />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 text-[12px] font-medium text-ink">
            <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} className="h-4 w-4 accent-[#A64056]" />
            Publish into the mixed feed
          </label>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-[11px] leading-5 text-ink-faint">
            Only playable assessments can publish a live card. Scores are never compared across versions.
          </p>
          <Button variant="primary" size="md" onClick={() => void submit()} disabled={busy} data-testid="save-role-card">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Save role card" : "Update role card"}
          </Button>
        </div>
      </div>
    </div>
  );
}
