"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AssessmentResultView, ProfileCompletionView } from "@/lib/repo";
import { assessmentTitle } from "@/lib/ui-copy";

export function ProfileEditor({
  candidate,
}: {
  candidate: {
    headline: string;
    bio: string;
    location: string;
    interests: string[];
    availability: string;
    discoveryOptIn: boolean;
    profileCompletion: ProfileCompletionView;
    assessmentResults: AssessmentResultView[];
  };
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(candidate.headline);
  const [bio, setBio] = useState(candidate.bio);
  const [location, setLocation] = useState(candidate.location);
  const [interests, setInterests] = useState(candidate.interests.join(", "));
  const [availability, setAvailability] = useState(candidate.availability);
  const [discoveryOptIn, setDiscoveryOptIn] = useState(candidate.discoveryOptIn);
  const [saving, setSaving] = useState(false);

  const [factKind, setFactKind] = useState<"ROLE" | "PROJECT">("ROLE");
  const [title, setTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [skills, setSkills] = useState("");
  const [claim, setClaim] = useState("");
  const [addingFact, setAddingFact] = useState(false);

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          headline,
          bio,
          location,
          interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
          availability,
          discoveryOptIn,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not save your profile.");
        return;
      }
      toast.success(discoveryOptIn ? "Profile saved. You are discoverable." : "Profile saved. Discovery is off.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function addFact() {
    if (addingFact) return;
    if (claim.trim().length < 8) {
      toast.error("Add a short factual description first.");
      return;
    }
    setAddingFact(true);
    try {
      const response = await fetch("/api/profile/facts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: factKind === "ROLE" ? "Work history" : "A project I'm proud of",
          claim,
          skillTags: skills.split(",").map((item) => item.trim()).filter(Boolean),
          meta: {
            module: factKind,
            title,
            organisation,
            start: start || undefined,
            end: end || null,
            skills: skills.split(",").map((item) => item.trim()).filter(Boolean),
          },
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not add that entry.");
        return;
      }
      setTitle("");
      setOrganisation("");
      setStart("");
      setEnd("");
      setSkills("");
      setClaim("");
      toast.success("Added to your profile as self-claimed.");
      router.refresh();
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setAddingFact(false);
    }
  }

  const completion = candidate.profileCompletion;

  return (
    <div className="space-y-8" data-testid="profile-editor">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Profile completeness</p>
            <p className="mt-1 text-[14px] text-ink-soft">
              {completion.completed} of {completion.total} pieces in place
            </p>
          </div>
          <span className={completion.complete ? "text-[12px] font-medium text-accent" : "text-[12px] text-ink-faint"}>
            {completion.complete ? "Complete" : "Missing: " + completion.missing.join(", ")}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The basics</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-ink-soft">
            Headline
            <Input value={headline} onChange={(event) => setHeadline(event.target.value)} className="mt-1.5" maxLength={120} />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            Location
            <Input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1.5" maxLength={120} />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
            Short bio
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} className="mt-1.5 min-h-[100px]" maxLength={700} />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            Role interests
            <Input value={interests} onChange={(event) => setInterests(event.target.value)} className="mt-1.5" placeholder="Backend, reliability, civic tech" />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            Availability
            <Input value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-1.5" maxLength={160} />
          </label>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <label className="flex items-start gap-2 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={discoveryOptIn}
                onChange={(event) => setDiscoveryOptIn(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#16833F]"
              />
              Let teams find me in discovery
            </label>
            <p className="mt-1 text-[12px] leading-5 text-ink-muted">
              Off by default. When off, recruiters cannot find or invite you outside a role you swiped on. Turning it off
              withdraws pending invitations. It never removes an existing match.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => void saveProfile()} disabled={saving} data-testid="save-profile">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save profile
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Structured experience</p>
            <p className="mt-1 text-[12px] text-ink-muted">No CV, no upload. Add the role or project in your own words.</p>
          </div>
          <div className="flex gap-1 rounded-full border border-line p-1">
            {(["ROLE", "PROJECT"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setFactKind(kind)}
                className={factKind === kind ? "rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-paper" : "rounded-full px-3 py-1 text-[11px] font-medium text-ink-muted"}
              >
                {kind === "ROLE" ? "Experience" : "Project"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-ink-soft">
            {factKind === "ROLE" ? "Role title" : "Project title"}
            <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5" maxLength={120} />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            Organisation
            <Input value={organisation} onChange={(event) => setOrganisation(event.target.value)} className="mt-1.5" maxLength={120} />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            Start month
            <Input type="month" value={start} onChange={(event) => setStart(event.target.value)} className="mt-1.5" />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft">
            End month
            <Input type="month" value={end} onChange={(event) => setEnd(event.target.value)} className="mt-1.5" />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
            Skills used
            <Input value={skills} onChange={(event) => setSkills(event.target.value)} className="mt-1.5" placeholder="React, TypeScript, accessibility" />
          </label>
          <label className="block text-[12px] font-medium text-ink-soft sm:col-span-2">
            What happened
            <Textarea value={claim} onChange={(event) => setClaim(event.target.value)} className="mt-1.5 min-h-[84px]" maxLength={600} />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => void addFact()} disabled={addingFact} data-testid="add-profile-fact">
            {addingFact ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add entry
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Assessment results</p>
            <p className="mt-1 text-[12px] text-ink-muted">Recorded against exact family, version and difficulty.</p>
          </div>
          <Link href="/assessments" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-4 text-[12px] font-medium text-ink">
            Open assessments <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {candidate.assessmentResults.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-muted">No assessment results yet. Take one to add evidence to your profile.</p>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {candidate.assessmentResults.map((result) => (
              <div key={result.assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">{assessmentTitle(result.assessment.title)} · {result.assessment.version}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {result.assessment.difficulty.toLowerCase()} · {result.score === null ? "attempt in progress" : "final"}
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-ink">{result.score === null ? "In progress" : result.score + "/100"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
