import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { StartTailoringButton } from "@/components/tailoring/start-tailoring-button";
import { TailoringReview } from "@/components/tailoring/tailoring-review";
import { TailoringSteps } from "@/components/tailoring/tailoring-steps";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRepository, type RoleDetail } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";

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
      <Link
        href="/tailor"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All tailoring
      </Link>
      <div className="mt-5">
        <PageHeader
          title={draft ? "Make it yours for " + role.employer.name : "A version for " + role.employer.name}
          description={
            draft
              ? "Approve, reject, or edit every suggested line. The source fact stays attached, and only approved lines go into the employer preview."
              : "Generate suggestions from your existing record, then review every line before anything is shared."
          }
          action={<span className="text-[12px] text-ink-muted">You approve every line.</span>}
        />
      </div>

      <div className="mb-5">
        <TailoringSteps current={draft ? 1 : 0} />
      </div>

      {!draft ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Ready to tailor</p>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight">Let&apos;s read your record for this role.</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-ink-muted">
              The app will suggest which facts to foreground and how to reword them. Suggestions can only use the
              facts already in your profile record, and you review every line.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <StartTailoringButton roleId={role.id} label="Generate suggestions" />
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }), "gap-1.5")}
              >
                Review your profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-6 border-t border-line pt-4 text-[12px] leading-5 text-ink-faint">
              Existing facts only. You approve every line.
            </p>
          </div>
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">The employer</p>
        <p className="mt-2 font-display text-[20px] leading-tight">{role.employer.name}</p>
        <p className="mt-1 text-[12px] text-ink-muted">{role.employer.tagline}</p>
        <p className="mt-3 line-clamp-3 border-t border-line pt-3 text-[13px] leading-6 text-ink-muted">
          {role.problemNow}
        </p>
      </Card>
      <Card className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">What can change</p>
        <p className="mt-2 text-[13px] leading-6 text-ink-soft">Order, emphasis and wording.</p>
        <p className="mt-2 border-t border-line pt-2 text-[13px] leading-6 text-ink-muted">
          Never experience, provenance or links.
        </p>
        <Link
          href="/how-it-works#ai"
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-ink-muted transition hover:text-ink"
        >
          The full rule <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>
    </aside>
  );
}