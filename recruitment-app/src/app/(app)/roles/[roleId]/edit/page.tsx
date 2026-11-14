import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/brand/page-header";
import { RoleCardForm } from "@/components/roles/role-card-form";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit role card" };

export default async function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "employer") return <div className="mx-auto max-w-3xl"><p className="text-[14px] text-ink-muted">Only a recruiter can edit a role card.</p></div>;
  const { roleId } = await params;
  const repo = getRepository();
  const [role, catalog] = await Promise.all([repo.getRoleById(roleId), repo.getAssessmentCatalog()]);
  if (!role || role.employer.id !== session.employer.id) notFound();
  return (
    <div className="animate-fade-up" data-testid="edit-role-page">
      <PageHeader
        eyebrow="Need capture · edit"
        title="Keep the bar honest."
        description="Changing the assessment version or bar changes what the feed presents. It never changes past outcomes."
      />
      <RoleCardForm mode="edit" role={role} catalog={catalog} employerContact={session.employer.contactName} />
    </div>
  );
}
