import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit your profile",
  description: "A structured profile without a CV: experience, projects, interests and assessment results.",
};

export default async function ProfileEditPage() {
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") {
    return <div className="mx-auto max-w-3xl"><p className="text-[14px] text-ink-muted">Only a candidate can edit this profile.</p></div>;
  }

  return (
    <div className="animate-fade-up" data-testid="profile-edit-page">
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
      </Link>
      <div className="mx-auto mt-5 max-w-3xl">
        <PageHeader
          title="Edit profile"
          description="Add experience and projects, set role interests, and choose whether teams can find you in discovery."
        />
        <ProfileEditor candidate={session.candidate} />
      </div>
    </div>
  );
}
