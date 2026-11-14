import type { Metadata } from "next";
import { PageHeader } from "@/components/brand/page-header";
import { RoleCardForm } from "@/components/roles/role-card-form";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New role card" };

export default async function NewRolePage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "employer") return <div className="mx-auto max-w-3xl"><p className="text-[14px] text-ink-muted">Only a recruiter can create a role card.</p></div>;
  const catalog = await getRepository().getAssessmentCatalog();
  return (
    <div className="animate-fade-up" data-testid="new-role-page">
      <PageHeader
        eyebrow="Need capture · new role"
        title="What would convince you?"
        description="State the role, one exact assessment bar, and the experience signals that matter. This happens before the event feed, not after."
      />
      <RoleCardForm mode="create" catalog={catalog} employerContact={session.employer.contactName} />
    </div>
  );
}
