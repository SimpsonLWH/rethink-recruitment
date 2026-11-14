import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { stageLabel } from "@/lib/stages";
import { assessmentTitle, likesLeftLabel } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Separate candidate and hiring dashboards for evidence-first matching.",
};

function statusLabel(status: string) {
  if (status === "WAITING") return "Waiting for the team";
  if (status === "MATCHED") return "Matched";
  if (status === "PENDING") return "Invitation pending";
  if (status === "ACCEPTED") return "Invitation accepted";
  if (status === "DECLINED") return "Invitation declined";
  if (status === "WITHDRAWN") return "Invitation withdrawn";
  if (status === "NOT_SELECTED") return "Not selected at this stage";
  if (status === "ROLE_CLOSED") return "Role closed";
  if (status === "AFTER_CONVERSATION") return "After your conversation";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  const repo = getRepository();

  if (session.side === "candidate") {
    if (!session.candidate.cvUploadedAt) redirect("/onboarding/cv");
    const [results, invitations, matches, interest, updates, counts] = await Promise.all([
      repo.getAssessmentResults(session.candidate.id),
      repo.getInvitations("candidate", session.candidate.id),
      repo.getMatches("candidate", session.candidate.id),
      repo.getInterestState("candidate", session.candidate.id),
      repo.getCandidateUpdates(session.candidate.id),
      repo.getNavCounts("candidate", session.candidate.id),
    ]);
    const pendingInvitations = invitations.filter((invitation) => invitation.status === "PENDING");
    const recentUpdates = updates.slice(0, 3);

    return (
      <div className="animate-fade-up" data-testid="candidate-dashboard">
        <PageHeader
          title="Home"
          description="CV, profile, assessment results, invitations and updates."
          action={<Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Browse roles <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><FileText className="h-3.5 w-3.5" /> CV</p>
            <p className="mt-2 truncate text-[13px] font-medium text-ink">{session.candidate.cvFileName ?? "Not added"}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">Context only. No automated screening.</p>
            <Link href="/onboarding/cv" className="mt-2 inline-flex text-[11px] font-medium text-accent">Replace CV</Link>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><UserRound className="h-3.5 w-3.5" /> Profile</p>
            <p className="mt-2 text-[13px] font-medium text-ink">{session.candidate.profileCompletion.completed} of {session.candidate.profileCompletion.total} complete</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">{session.candidate.profileCompletion.complete ? "All checklist items complete." : "Missing: " + session.candidate.profileCompletion.missing.join(", ") + "."}</p>
            <Link href="/profile/edit" className="mt-2 inline-flex text-[11px] font-medium text-accent">Edit profile</Link>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><ClipboardCheck className="h-3.5 w-3.5" /> Assessments</p>
            <p className="mt-2 text-[13px] font-medium text-ink">{results.length} result{results.length === 1 ? "" : "s"} · {likesLeftLabel(interest.likesRemaining)}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">Each result is tied to one assessment version.</p>
            <Link href="/assessments" className="mt-2 inline-flex text-[11px] font-medium text-accent">Open assessments</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold leading-tight">Assessment results</h2>
            {results.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-line-strong bg-paper p-5">
                <p className="text-[12px] text-ink-muted">No results yet. A short assessment adds evidence against a role&apos;s stated bar.</p>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-line border-y border-line">
                {results.map((result) => (
                  <div key={result.assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-ink">{assessmentTitle(result.assessment.title)}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {result.assessment.version} · {result.score === null ? "not marked yet" : "final"}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold tabular-nums text-ink">{result.score === null ? "In progress" : result.score + "/100"}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/assessments" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">Take an assessment</Link>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><Mail className="h-3.5 w-3.5" /> Invitations</p>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted">{counts.invitations} pending</span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                {pendingInvitations.length ? "A recruiter found your evidence and invited you to look." : "No pending invitations. Discovery is opt-in; you can change it in your profile."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/invitations" className="inline-flex text-[11px] font-medium text-accent">Open invitations</Link>
                <Link href="/priority-intros" className="inline-flex text-[11px] font-medium text-ink-muted">Priority intros</Link>
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><HeartHandshake className="h-3.5 w-3.5" /> Matches</p>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted">{matches.length}</span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                {matches.length ? "Your most recent match: " + matches[0].roleTitle + " at " + matches[0].employerName + " · " + stageLabel(matches[0].stage) + "." : "No mutual matches yet. A match needs two explicit yeses."}
              </p>
              <Link href="/matches" className="mt-3 inline-flex text-[11px] font-medium text-accent">Open matches</Link>
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><ShieldCheck className="h-3.5 w-3.5" /> Recent updates</p>
              {recentUpdates.length ? recentUpdates.map((update) => (
                <p key={update.id} className="mt-2 text-[12px] leading-5 text-ink-muted">
                  <span className="font-medium text-ink-soft">{update.roleTitle}:</span> {statusLabel(update.status)}
                </p>
              )) : <p className="mt-2 text-[12px] text-ink-muted">No updates yet.</p>}
              <Link href="/updates" className="mt-3 inline-flex text-[11px] font-medium text-accent">All updates</Link>
            </section>
          </div>
        </div>

      </div>
    );
  }

  const employer = session.employer;
  if (employer.roles.length === 0) redirect("/onboarding/role");
  const [matches, invitations, counts] = await Promise.all([
    repo.getMatches("employer", employer.id),
    repo.getInvitations("employer", employer.id),
    repo.getNavCounts("employer", employer.id),
  ]);
  const pendingInvites = invitations.filter((invitation) => invitation.status === "PENDING");

  return (
    <div className="animate-fade-up" data-testid="recruiter-dashboard">
      <PageHeader
        title="Home"
        description="Roles, requirements, outreach and matches."
        action={<Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Review candidates <ArrowRight className="h-3.5 w-3.5" /></Link>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><BriefcaseBusiness className="h-3.5 w-3.5" /> Role cards</p>
          <p className="mt-2 text-[13px] font-medium text-ink">{employer.roles.length} configured</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">Each live card states the assessments and scores you accept.</p>
          <Link href="/roles" className="mt-2 inline-flex text-[11px] font-medium text-accent">Manage role cards</Link>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><SlidersHorizontal className="h-3.5 w-3.5" /> Requirements</p>
          <p className="mt-2 text-[13px] font-medium text-ink">{employer.roles.reduce((total, role) => total + role.requirements.length, 0)} stated</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">Scores map to exact assessment versions.</p>
          <Link href="/roles/new" className="mt-2 inline-flex text-[11px] font-medium text-accent">Add a role card</Link>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><Mail className="h-3.5 w-3.5" /> Outreach</p>
          <p className="mt-2 text-[13px] font-medium text-ink">{pendingInvites.length} pending · {counts.matches} match{counts.matches === 1 ? "" : "es"}</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">An invitation is a message. It does not create an application or match.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/discovery" className="inline-flex text-[11px] font-medium text-accent">Discovery</Link>
            <Link href="/priority-intros" className="inline-flex text-[11px] font-medium text-ink-muted">Priority intros</Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[18px] font-semibold leading-tight">Role cards</h2>
            <Link href="/roles" className="text-[11px] font-medium text-accent">All role cards</Link>
          </div>
          <div className="mt-4 space-y-3">
            {employer.roles.map((role) => (
              <div key={role.id} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-ink">{role.title}</p>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-muted">{role.configStatus.toLowerCase()}</span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {role.requirements.map((requirement) => (
                    <p key={requirement.assessmentId} className="text-[11px] text-ink-muted">
                      {requirement.assessment?.family} {requirement.assessment?.version} · bar {requirement.requiredScore}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 text-[11px] font-medium">
                  <Link href={"/discover"} className="text-accent">Review</Link>
                  <Link href={"/roles/" + role.id + "/edit"} className="text-ink-muted">Edit</Link>
                  <Link href={"/roles/" + role.id} className="text-ink-muted">Public role</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><HeartHandshake className="h-3.5 w-3.5" /> Matches</p>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              {matches.length ? "Latest: " + matches[0].candidateName + " · " + matches[0].roleTitle + " · " + stageLabel(matches[0].stage) + "." : "No mutual matches yet. A match needs an explicit yes from both sides."}
            </p>
            <Link href="/matches" className="mt-3 inline-flex text-[11px] font-medium text-accent">Open matches</Link>
          </section>
        </div>
      </div>
    </div>
  );
}