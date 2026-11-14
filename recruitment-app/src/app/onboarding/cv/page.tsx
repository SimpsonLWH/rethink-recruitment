import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, ShieldCheck, Upload } from "lucide-react";
import { PageHeader } from "@/components/brand/page-header";
import { completeCandidateCvAction } from "@/app/actions/onboarding";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your candidate profile",
  description: "Upload a CV or choose a synthetic sample profile, then browse roles and assessments.",
};

function errorCopy(error?: string) {
  if (error === "file") return "Choose a CV file or a sample profile.";
  if (error === "large") return "That file is over 5 MB. Choose a smaller file for the demo.";
  return null;
}

export default async function CandidateCvOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) return null;
  if (session.side !== "candidate") {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[14px] text-ink-muted">This setup belongs to a candidate account.</p>
        <Link href="/dashboard" className="mt-4 inline-flex text-[13px] font-medium text-accent">Back to dashboard</Link>
      </main>
    );
  }

  const hasCv = Boolean(session.candidate.cvUploadedAt);
  const error = errorCopy(params.error);

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <Link href={hasCv ? "/dashboard" : "/enter"} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> {hasCv ? "Back to dashboard" : "Back to sign in"}
        </Link>
        <div className="mt-7" data-testid="candidate-cv-onboarding">
          <PageHeader
            title="Set up your profile"
            description="Upload a CV or choose a sample profile. The CV is context only. Assessments provide the evidence used in matching."
          />

          {error ? <p className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-[12px] text-ink-soft">{error}</p> : null}
          {hasCv ? (
            <div className="mb-5 rounded-xl border border-line bg-paper px-4 py-3 text-[12px] text-ink-soft" data-testid="cv-status">
              CV on file: <span className="font-medium text-ink">{session.candidate.cvFileName}</span>. You can replace it below.
            </div>
          ) : null}

          <form action={completeCandidateCvAction} className="space-y-5" data-testid="cv-form">
            <section className="rounded-xl border border-line bg-surface p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink-muted"><Upload className="h-4 w-4" /></span>
                <div>
                  <h2 className="text-[18px] font-semibold text-ink">Upload a CV</h2>
                  <p className="mt-1 text-[12px] leading-5 text-ink-muted">PDF, DOC, DOCX or TXT, up to 5 MB. The demo stores the file name and onboarding state; it does not screen CVs automatically.</p>
                </div>
              </div>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper px-4 py-8 text-center transition hover:border-accent">
                <FileText className="h-6 w-6 text-ink-faint" />
                <span className="mt-2 text-[13px] font-medium text-ink">Choose a CV file</span>
                <span className="mt-1 text-[11px] text-ink-faint">or drag it into the picker</span>
                <input
                  type="file"
                  name="cv"
                  accept=".pdf,.doc,.docx,.txt"
                  className="mt-4 w-full max-w-xs rounded-lg border border-line bg-surface px-3 py-2 text-[11px] text-ink-muted"
                  data-testid="cv-file"
                />
              </label>
              <div className="mt-4 flex justify-end">
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-[12px] font-medium text-white" data-testid="cv-upload-submit">
                  Use this CV <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <section className="rounded-xl border border-line bg-surface p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink-muted"><Check className="h-4 w-4" /></span>
                <div>
                  <h2 className="text-[18px] font-semibold text-ink">Choose a sample profile</h2>
                  <p className="mt-1 text-[12px] leading-5 text-ink-muted">Use a complete synthetic profile to explore the candidate flow immediately. This copies structured evidence, not a real CV.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper px-3 py-3 text-[13px] text-ink">
                  <input type="radio" name="sampleCandidateSlug" value="aino-vikstrom" className="mt-1 h-4 w-4 accent-[#16833F]" />
                  <span><span className="font-medium">Aino Vikström</span><span className="mt-0.5 block text-[11px] leading-5 text-ink-muted">Product-minded frontend engineer · accessibility, design systems, React</span></span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper px-3 py-3 text-[13px] text-ink">
                  <input type="radio" name="sampleCandidateSlug" value="noor-salmi" className="mt-1 h-4 w-4 accent-[#16833F]" />
                  <span><span className="font-medium">Noor Salmi</span><span className="mt-0.5 block text-[11px] leading-5 text-ink-muted">Finance frontend engineer · React, TypeScript, invoice-matching</span></span>
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-4 text-[12px] font-medium text-ink" data-testid="cv-sample-submit">
                  Use sample profile <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>

            <div className="flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-[12px] leading-5 text-ink-muted">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p>No automated CV screening. Your CV is not sent anywhere, and the assessment scores are the only evidence used in role matching.</p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}