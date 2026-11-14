import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { RoleCardForm } from "@/components/roles/role-card-form";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set your hiring requirements",
  description: "Choose the assessments and scores your role accepts before you review anyone.",
};

export default async function RecruiterOnboardingPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "employer") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[14px] text-ink-muted">This setup belongs to a hiring account.</p>
        <Link href="/dashboard" className="mt-4 inline-flex text-[13px] font-medium text-accent">Back to dashboard</Link>
      </main>
    );
  }
  const catalog = await getRepository().getAssessmentCatalog();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
        <div className="mt-7" data-testid="recruiter-onboarding">
          <PageHeader
            eyebrow="Hiring setup"
            title="Set hiring requirements"
            description="Choose the role, the assessments you accept and the score for each. Below-bar candidates stay visible for human review."
          />
          <RoleCardForm mode="create" catalog={catalog} employerContact={session.employer.contactName} redirectTo="/dashboard" />
        </div>
      </div>
    </main>
  );
}