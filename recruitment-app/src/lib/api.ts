import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RepositoryError } from "@/lib/repo";

const CONFLICT_CODES = new Set([
  "already_decided",
  "priority_intro_exhausted",
  "like_exhausted",
  "draft_approved",
  "attempt_cooldown",
  "attempt_limit",
  "attempt_closed",
  "invitation_exists",
  "invitation_closed",
  "invalid_stage",
]);

export function jsonError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof RepositoryError) {
    const status =
      error.code === "forbidden"
        ? 403
        : error.code === "not_found"
          ? 404
          : CONFLICT_CODES.has(error.code)
            ? 409
            : 400;
    return jsonError(error.message, status, error.code);
  }
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid request.", 400, "invalid_request");
  }
  console.error("[api]", error);
  return jsonError("Something went wrong. Please try again.", 500, "internal");
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
