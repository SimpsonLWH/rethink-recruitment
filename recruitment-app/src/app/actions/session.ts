"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/repo";
import { getSession, PERSONA_COOKIE, EMPLOYER_ROLE_COOKIE, SESSION_MAX_AGE, personaCookieValue } from "@/lib/session";

function safeNext(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function selectPersona(formData: FormData) {
  const side = formData.get("side");
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    redirect("/enter?error=missing");
  }
  const repo = getRepository();
  const store = await cookies();

  if (side === "candidate") {
    const candidate = await repo.getCandidateById(id);
    if (!candidate) redirect("/enter?side=candidate&error=unknown");
    store.set(PERSONA_COOKIE, personaCookieValue("candidate", id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    store.delete(EMPLOYER_ROLE_COOKIE);
    redirect("/discover");
  }

  if (side === "employer") {
    const employer = await repo.getEmployerById(id);
    if (!employer) redirect("/enter?side=employer&error=unknown");
    store.set(PERSONA_COOKIE, personaCookieValue("employer", id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    if (employer.roles[0]) {
      store.set(EMPLOYER_ROLE_COOKIE, employer.roles[0].id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }
    redirect("/discover");
  }

  redirect("/enter?error=missing");
}

export async function switchEmployerRole(formData: FormData) {
  const roleId = formData.get("roleId");
  if (typeof roleId !== "string" || roleId.length === 0) return;
  const session = await getSession();
  if (!session || session.side !== "employer") redirect("/enter");
  if (!session.employer.roles.some((role) => role.id === roleId)) return;
  const store = await cookies();
  store.set(EMPLOYER_ROLE_COOKIE, roleId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(formData.get("next"), "/discover"));
}
