import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getRepository } from "@/lib/repo";
import { getSession, EMPLOYER_ROLE_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

const requirementSchema = z.object({
  assessmentId: z.string().min(1),
  requiredScore: z.number().int().min(0).max(100),
});

const signalSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["SKILL", "EXPERIENCE", "DOMAIN"]),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(120),
  years: z.number().int().min(0).max(40).optional(),
  skill: z.string().min(1).max(80).optional(),
});

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  employmentType: z.string().trim().max(80).default("Full-time"),
  workMode: z.string().trim().max(120).default("Hybrid"),
  location: z.string().trim().max(120).default("Espoo"),
  summary: z.string().trim().min(10).max(600),
  whyJoin: z.string().trim().max(600).default(""),
  problemNow: z.string().trim().max(600).default(""),
  first90: z.string().trim().max(600).default(""),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  roleFamily: z.string().min(1).max(80),
  assessmentId: z.string().min(1),
  requiredScore: z.number().int().min(0).max(100),
  requirements: z.array(requirementSchema).min(1).max(3),
  signals: z.array(signalSchema).max(4).default([]),
  reviewOwnerName: z.string().trim().min(1).max(120),
  publish: z.boolean().default(true),
});

async function setActiveRole(roleId: string) {
  const store = await cookies();
  store.set(EMPLOYER_ROLE_COOKIE, roleId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    if (session.side !== "employer") return jsonError("Only a recruiter can create a role card.", 403, "forbidden");
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid role card.", 400, "invalid_request");
    const role = await getRepository().createRoleCard(session.employer.id, parsed.data);
    await setActiveRole(role.id);
    return NextResponse.json({ role });
  } catch (error) {
    return handleRouteError(error);
  }
}