"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/repo";
import { hashDemoPassword, SAMPLE_ACCOUNTS, SAMPLE_QUANT_EMPLOYER, verifyDemoPassword } from "@/lib/auth";
import { PERSONA_COOKIE, SESSION_MAX_AGE, personaCookieValue } from "@/lib/session";

async function setSession(side: "candidate" | "employer", personId: string) {
  const store = await cookies();
  store.set(PERSONA_COOKIE, personaCookieValue(side, personId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  store.delete("rivet_employer_role");
}

async function postAuthPath(side: "candidate" | "employer", personId: string) {
  const repo = getRepository();
  if (side === "candidate") {
    const candidate = await repo.getCandidateById(personId);
    return candidate?.cvUploadedAt ? "/dashboard" : "/onboarding/cv";
  }
  const employer = await repo.getEmployerById(personId);
  return employer && employer.roles.length > 0 ? "/dashboard" : "/onboarding/role";
}

export async function signInSample(formData: FormData) {
  const side = formData.get("side") === "employer" ? "employer" : "candidate";
  const sample =
    side === "candidate"
      ? SAMPLE_ACCOUNTS.candidate
      : formData.get("sample") === "quant"
        ? SAMPLE_QUANT_EMPLOYER
        : SAMPLE_ACCOUNTS.employer;
  const account = await getRepository().getAccountByEmail(sample.email);
  if (!account || account.side !== side) redirect("/enter?error=sample");
  await setSession(side, account.personId);
  redirect(await postAuthPath(side, account.personId));
}

export async function signInAccount(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/enter?error=missing");
  const account = await getRepository().getAccountByEmail(email);
  if (!account || !verifyDemoPassword(password, account.passwordHash, account.passwordSalt)) {
    redirect("/enter?error=invalid");
  }
  await setSession(account.side, account.personId);
  redirect(await postAuthPath(account.side, account.personId));
}

export async function createAccountAction(formData: FormData) {
  const side = formData.get("side") === "employer" ? "employer" : "candidate";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || !email || password.length < 6) {
    redirect("/signup?side=" + side + "&error=details");
  }
  const { hash, salt } = hashDemoPassword(password);
  let account;
  try {
    account = await getRepository().createAccount({ side, name, email, passwordHash: hash, passwordSalt: salt });
  } catch {
    redirect("/signup?side=" + side + "&error=email");
  }
  await setSession(side, account.personId);
  redirect(side === "candidate" ? "/onboarding/cv" : "/onboarding/role");
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(PERSONA_COOKIE);
  store.delete("rivet_employer_role");
  redirect("/enter");
}

