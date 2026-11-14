import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RepositoryError } from "@/lib/repo";

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
          : error.code === "already_decided" || error.code === "rose_exhausted" || error.code === "draft_approved"
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
