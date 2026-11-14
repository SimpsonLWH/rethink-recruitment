import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/repo";
import { getSession } from "@/lib/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

const schema = z.object({ force: z.boolean().optional() }).default({});
const PRIVATE_HOSTS = [/^localhost$/i, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^::1$/, /\.local$/i];

function isPrivateHost(hostname: string) {
  if (PRIVATE_HOSTS.some((pattern) => pattern.test(hostname))) return true;
  const match = hostname.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

async function headCheck(url: URL) {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    signal: AbortSignal.timeout(5000),
    headers: {
      "user-agent": "RivetDemoLinkChecker/0.1 (synthetic prototype; reachability check only)",
      accept: "*/*",
    },
  });
  return response.status;
}

export async function POST(request: Request, context: { params: Promise<{ factId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return jsonError("Choose a demo persona first.", 401, "no_session");
    const { factId } = await context.params;
    const parsedBody = schema.safeParse(await readJson(request));
    const force = parsedBody.success ? Boolean(parsedBody.data.force) : false;
    const repo = getRepository();
    const target = await repo.getLinkTarget(factId);
    if (!target || !target.evidenceUrl) return jsonError("No evidence link on this fact.", 404, "no_link");

    const fresh =
      target.checkedAt && Date.now() - new Date(target.checkedAt).getTime() < 24 * 60 * 60 * 1000;
    if (target.status && fresh && !force) {
      return NextResponse.json({ status: target.status, checkedAt: target.checkedAt, httpStatus: target.httpStatus, cached: true });
    }

    let url: URL;
    try {
      url = new URL(target.evidenceUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("protocol");
      if (isPrivateHost(url.hostname)) throw new Error("private");
      if (url.username || url.password) throw new Error("credentials");
    } catch {
      const saved = await repo.saveLinkCheck(target.factId, "UNREACHABLE", null, "Blocked or invalid URL");
      return NextResponse.json({ status: saved.status, checkedAt: saved.checkedAt, httpStatus: null, saved: true });
    }

    try {
      const httpStatus = await headCheck(url);
      const status = httpStatus >= 200 && httpStatus < 400 ? "WORKS" : "UNREACHABLE";
      const saved = await repo.saveLinkCheck(target.factId, status, httpStatus, "HEAD " + httpStatus);
      return NextResponse.json({ status: saved.status, checkedAt: saved.checkedAt, httpStatus, cached: false });
    } catch (error) {
      const detail = error instanceof Error ? error.message.slice(0, 200) : "HEAD request failed";
      const saved = await repo.saveLinkCheck(target.factId, "UNREACHABLE", null, detail);
      return NextResponse.json({ status: saved.status, checkedAt: saved.checkedAt, httpStatus: null, cached: false });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
