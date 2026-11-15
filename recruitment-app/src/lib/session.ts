import { cache } from "react";
import { cookies } from "next/headers";
import { getRepository } from "@/lib/repo";
import type { CandidateDetail, EmployerDetail, PersonaSide, RoleSummary } from "@/lib/repo";

export const PERSONA_COOKIE = "rivet_persona";
export const EMPLOYER_ROLE_COOKIE = "rivet_employer_role";
export const REVIEWER_COOKIE = "rivet_reviewer";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type Session =
  | { side: "candidate"; candidate: CandidateDetail }
  | { side: "employer"; employer: EmployerDetail; activeRole: RoleSummary | null; reviewerName: string };

export function personaCookieValue(side: PersonaSide, id: string) {
  return side + ":" + id;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const raw = store.get(PERSONA_COOKIE)?.value;
  if (!raw) return null;
  const separator = raw.indexOf(":");
  if (separator < 0) return null;
  const side = raw.slice(0, separator);
  const id = raw.slice(separator + 1);
  if (!id) return null;

  const repo = getRepository();
  if (side === "candidate") {
    const candidate = await repo.getCandidateById(id);
    return candidate ? { side: "candidate", candidate } : null;
  }
  if (side === "employer") {
    const employer = await repo.getEmployerById(id);
    if (!employer) return null;
    const roleId = store.get(EMPLOYER_ROLE_COOKIE)?.value;
    const activeRole = employer.roles.find((role) => role.id === roleId) ?? employer.roles[0] ?? null;
    const reviewerName = store.get(REVIEWER_COOKIE)?.value?.trim() || employer.contactName || employer.name;
    return { side: "employer", employer, activeRole, reviewerName };
  }
  return null;
});

export async function getRequiredSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("No active demo persona.");
  return session;
}
