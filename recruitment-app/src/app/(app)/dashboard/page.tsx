import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
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
          eyebrow="Candidate dashboard · evidence first"
          title={"Welcome back, " + session.candidate.name.split(" ")[0] + "."}
          description="Your application starts with evidence, not a CV pile. Complete assessments, browse roles that match your bar, and keep every next step in one place."
          action={<Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Browse roles <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><FileText className="h-3.5 w-3.5" /> CV on file</p>
            <p className="mt-2 truncate text-[14px] font-medium text-ink">{session.candidate.cvFileName ?? "Not added"}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">Used for onboarding context only. No automated CV screening.</p>
            <Link href="/onboarding/cv" className="mt-3 inline-flex text-[11px] font-medium text-accent">Replace CV</Link>
          </div>
          <div className="rounded-[22px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><UserRound className="h-3.5 w-3.5" /> Profile</p>
            <p className="mt-2 text-[14px] font-medium text-ink">{session.candidate.profileCompletion.completed} of {session.candidate.profileCompletion.total} pieces</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">{session.candidate.profileCompletion.complete ? "Complete enough for the demo." : "Missing: " + session.candidate.profileCompletion.missing.join(", ") + "."}</p>
            <Link href="/profile/edit" className="mt-3 inline-flex text-[11px] font-medium text-accent">Edit profile</Link>
          </div>
          <div className="rounded-[22px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><ClipboardCheck className="h-3.5 w-3.5" /> Assessments</p>
            <p className="mt-2 text-[14px] font-medium text-ink">{results.length} result{results.length === 1 ? "" : "s"} · {interest.likesRemaining} Likes left</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">Scores are exact to family, version and difficulty. No aggregate score.</p>
            <Link href="/assessments" className="mt-3 inline-flex text-[11px] font-medium text-accent">Open assessments</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Your evidence</p>
                <h2 className="mt-1 font-display text-[26px] leading-tight">What teams can see.</h2>
              </div>
              <Link href="/assessments" className="text-[11px] font-medium text-accent">Add evidence</Link>
            </div>
            {results.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-line-strong bg-paper p-5">
                <p className="text-[13px] text-ink-muted">No assessment results yet. Take one short assessment to show evidence against a role&apos;s stated bar.</p>
                <Link href="/assessments" className="mt-2 inline-flex text-[12px] font-medium text-accent">Start an assessment</Link>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-line border-y border-line">
                {results.map((result) => (
                  <div key={result.assessment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-ink">{result.assessment.family} · {result.assessment.version}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{result.assessment.difficulty.toLowerCase()} · {result.attemptCount} attempt{result.attemptCount === 1 ? "" : "s"}</p>
                    </div>
                    <p className="text-[14px] font-semibold text-ink">{result.bestScore}/100</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/discover" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Browse roles <ArrowRight className="h-3.5 w-3.5" /></Link>
              <Link href="/assessments" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-medium text-ink">Take an assessment</Link>
            </div>
          </section>

          <div className="space-y-4">
            <section className="rounded-[22px] border border-line bg-surface p-5">
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
            <section className="rounded-[22px] border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><HeartHandshake className="h-3.5 w-3.5" /> Matches</p>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-muted">{matches.length}</span>
              </div>
              <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                {matches.length ? "Your most recent match: " + matches[0].roleTitle + " at " + matches[0].employerName + " · " + stageLabel(matches[0].stage) + "." : "No mutual matches yet. A match needs two explicit yeses."}
              </p>
              <Link href="/matches" className="mt-3 inline-flex text-[11px] font-medium text-accent">Open matches</Link>
            </section>
            <section className="rounded-[22px] border border-line bg-surface p-5">
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

        <section className="mt-6 rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">How applying works here</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Show evidence", "Add structured experience and take a short assessment. Your result is tied to one exact version."],
              ["2", "Browse with context", "Every role card shows the evidence it asks for and the team's stated bar. No hidden ranking."],
              ["3", "Decide together", "A Like or Priority intro is interest. A match needs the team's explicit yes too."],
            ].map(([n, title, body]) => (
              <div key={n} className="border-t border-line pt-3">
                <p className="font-display text-[26px] leading-none text-ink-faint">{n}</p>
                <p className="mt-2 text-[13px] font-semibold text-ink">{title}</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>
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
        eyebrow="Hiring dashboard · need first"
        title={"Welcome back, " + employer.name + "."}
        description="You state the evidence bar before you browse. Review only the people whose evidence matches the role you need, and keep every next step human."
        action={<Link href="/discover" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12px] font-medium text-white">Review candidates <ArrowRight className="h-3.5 w-3.5" /></Link>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><BriefcaseBusiness className="h-3.5 w-3.5" /> Role cards</p>
          <p className="mt-2 text-[14px] font-medium text-ink">{employer.roles.length} role{employer.roles.length === 1 ? "" : "s"} configured</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">Live cards state the exact assessments and scores you accept.</p>
          <Link href="/roles" className="mt-3 inline-flex text-[11px] font-medium text-accent">Manage role cards</Link>
        </div>
        <div className="rounded-[22px] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><SlidersHorizontal className="h-3.5 w-3.5" /> Assessment bar</p>
          <p className="mt-2 text-[14px] font-medium text-ink">{employer.roles.reduce((total, role) => total + role.requirements.length, 0)} stated requirements</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">Scores are exact to family, version and difficulty. No universal person score.</p>
          <Link href="/roles/new" className="mt-3 inline-flex text-[11px] font-medium text-accent">Add a role card</Link>
        </div>
        <div className="rounded-[22px] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><Mail className="h-3.5 w-3.5" /> Outreach</p>
          <p className="mt-2 text-[14px] font-medium text-ink">{pendingInvites.length} pending invitation{pendingInvites.length === 1 ? "" : "s"} · {counts.matches} match{counts.matches === 1 ? "" : "es"}</p>
          <p className="mt-1 text-[11px] leading-5 text-ink-muted">An invitation is a message, never an automatic application or match.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/discovery" className="inline-flex text-[11px] font-medium text-accent">Open discovery lane</Link>
            <Link href="/priority-intros" className="inline-flex text-[11px] font-medium text-ink-muted">Priority intros</Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Your roles</p>
              <h2 className="mt-1 font-display text-[26px] leading-tight">The bar you set.</h2>
            </div>
            <Link href="/roles" className="text-[11px] font-medium text-accent">All role cards</Link>
          </div>
          <div className="mt-4 space-y-3">
            {employer.roles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-line bg-paper p-4">
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
          <section className="rounded-[22px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><HeartHandshake className="h-3.5 w-3.5" /> Matches</p>
            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              {matches.length ? "Latest: " + matches[0].candidateName + " · " + matches[0].roleTitle + " · " + stageLabel(matches[0].stage) + "." : "No mutual matches yet. A match needs an explicit yes from both sides."}
            </p>
            <Link href="/matches" className="mt-3 inline-flex text-[11px] font-medium text-accent">Open matches</Link>
          </section>
          <section className="rounded-[22px] border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"><Check className="h-3.5 w-3.5" /> How hiring works here</p>
            <ol className="mt-2 space-y-2 text-[12px] leading-5 text-ink-muted">
              <li><span className="font-medium text-ink-soft">1.</span> Configure a role card with the exact assessments and scores.</li>
              <li><span className="font-medium text-ink-soft">2.</span> Review the mixed feed and evidence; below-bar candidates stay visible.</li>
              <li><span className="font-medium text-ink-soft">3.</span> Match only after both sides say yes; send honest outcomes for the rest.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}