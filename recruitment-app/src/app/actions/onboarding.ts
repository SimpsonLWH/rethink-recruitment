"use server";

import { redirect } from "next/navigation";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";

export async function completeCandidateCvAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.side !== "candidate") redirect("/enter");

  const sampleSlug = String(formData.get("sampleCandidateSlug") ?? "").trim();
  const upload = formData.get("cv");

  if (sampleSlug) {
    await getRepository().completeCandidateCv(session.candidate.id, {
      cvSource: "SAMPLE",
      cvFileName: sampleSlug + "-sample.pdf",
      sampleCandidateSlug: sampleSlug,
    });
    redirect("/dashboard");
  }

  if (!upload || typeof upload === "string" || !upload.name || upload.size === 0) {
    redirect("/onboarding/cv?error=file");
  }
  if (upload.size > 5 * 1024 * 1024) {
    redirect("/onboarding/cv?error=large");
  }

  await getRepository().completeCandidateCv(session.candidate.id, {
    cvSource: "UPLOAD",
    cvFileName: upload.name,
  });
  redirect("/dashboard");
}
