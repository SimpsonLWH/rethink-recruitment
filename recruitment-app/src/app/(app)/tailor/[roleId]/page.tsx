import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { TailoringReview } from "@/components/tailoring/tailoring-review";
import { TailoringSteps } from "@/components/tailoring/tailoring-steps";
import { Card } from "@/components/ui/card";
import { getRepository, type RoleDetail } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string }> }): Promise<Metadata> {
  const { roleId } = await params;
  const role = await getRepository().getRoleById(roleId);
  return { title: role ? "Tailor for " + role.employer.name : "Tailor a profile" };
}

export default async function TailoringReviewPage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") redirect("/matches");
  const { roleId } = await params;
  const repo = getRepository();
  const [role, draft, tailorable] = await Promise.all([
    repo.getRoleById(roleId),
    repo.getTailoringDraft(session.candidate.id, roleId),
    repo.getTailorableRoles(session.candidate.id),
  ]);
  if (!role) notFound();
  if (draft?.status === "APPROVED") redirect("/tailor/" + roleId + "/preview");
  const option = tailorable.find((item) => item.role.id === roleId);
  if (!option) redirect("/tailor");

  return (
    <div className="animate-fade-up">
      <Link href="/tailor" className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> All tailoring
      </Link>
      <div className="mt-5">
        <PageHeader
          eyebrow="Review · master record in, approved version out"
          title={draft ? "Make it yours for " + role.employer.name : "A version for " + role.employer.name}
          description={draft ? "Approve, reject, or edit every suggested line. The source fact stays attached. Only approved lines go into the employer preview." : "Generate suggestions from your existing record, then review every line before anything is shared."}
          action={<span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-[10px] font-medium text-ink-muted"><ShieldCheck className="h-3.5 w-3.5 text-moss" /> You approve every line</span>}
        />
      </div>

      <div className="mb-5">
        <TailoringSteps current={draft ? 1 : 0} />
      </div>

      {!draft ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="p-6">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Ready to tailor</p>
            <h2 className="mt-2 font-display text-[30px] leading-tight">Let&apos;s read your record for this role.</h2>
            <p className="mt-3 max-w-xl text-[12px] leading-6 text-ink-muted">The app will suggest which facts to foreground and how to reword them. Suggestions can only use the facts already in your master record. You&apos;ll review and approve each line.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StartTailoringButton roleId={role.id} label="Generate suggestions" />
              <Link href="/profile" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-4 text-[12px] font-semibold text-ink">Review master record <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-6 grid gap-2 text-[10.5px] leading-5 text-ink-muted sm:grid-cols-2">
              <p className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" /> No new experience, skills, or links.</p>
              <p className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /> Self-claimed stays self-claimed.</p>
            </div>
          </Card>
          <Sidebar role={role} />
        </div>
      ) : (
        <TailoringReview draft={draft} candidateName={session.candidate.name} />
      )}
    </div>
  );
}

function Sidebar({ role }: { role: RoleDetail }) {
  return (
    <aside className="space-y-4">
      <Card className="p-5">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">The employer</p>
        <p className="mt-2 font-display text-[22px] leading-tight">{role.employer.name}</p>
        <p className="mt-1 text-[10.5px] text-ink-muted">{role.employer.tagline}</p>
        <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-5 text-ink-muted">{role.problemNow}</p>
      </Card>
      <Card className="p-5">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-faint">What can change</p>
        <div className="mt-3 space-y-2 text-[10.5px] leading-5 text-ink-muted">
          <p className="flex gap-2"><CheckMark /> Which facts appear first.</p>
          <p className="flex gap-2"><CheckMark /> How an existing claim is reworded.</p>
          <p className="flex gap-2"><CheckMark /> Which approved lines are shared.</p>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-4 text-ink-faint">Never new experience. Never a provenance upgrade. Never an invented link.</p>
      </Card>
    </aside>
  );
}

function CheckMark() {
  return <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-rose" />;
}
