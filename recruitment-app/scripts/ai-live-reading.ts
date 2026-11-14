#!/usr/bin/env node
/**
 * Capture one real NVIDIA Nemotron evidence-reading call.
 *
 *   NVIDIA_API_KEY=... npm run audit:live -- --confirm-live
 *
 * Defaults: Northwind Product Engineer + Noor Salmi. Override with
 *   --role <slug> --candidate <slug>.
 *
 * This script can make up to four provider requests (two attempts per call,
 * including at most one repair) and writes no capture unless the call really
 * succeeded and passed its grounding checks. It never writes an API key or request headers. After reviewing the
 * capture, add the printed LIVE_EVIDENCE entry to src/lib/ai/live-evidence.ts.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readEvidence } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";
import { getArg, loadReadingTarget, requireLiveConfirmation } from "./reading-targets";
import { readingMetrics } from "./reading-metrics";

function timestampForFile(iso: string) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function relativeAuditPath(fileName: string) {
  return "audit/live/" + fileName;
}

async function main() {
  requireLiveConfirmation();

  const roleSlug = getArg("--role", "northwind-product-engineer");
  const candidateSlug = getArg("--candidate", "noor-salmi");
  const repo = getRepository();
  const target = await loadReadingTarget(repo, roleSlug, candidateSlug);

  console.log("Target: " + target.review.candidate.name + " -> " + target.review.role.title);
  console.log("This can make up to 4 NVIDIA requests (two attempts per call, plus one repair if needed).");
  console.log("No headers, keys or tokens will be written.");

  const result = await readEvidence(target.input, { bypassCache: true });
  if (result.mode !== "LIVE" || result.engine !== "nemotron-live") {
    throw new Error(
      "The reading fell back (" +
        (result.fallbackReason ?? "unknown") +
        "). A fallback is not live evidence. No capture was written.",
    );
  }

  const metrics = readingMetrics(result.reading, target.input);
  if (
    !metrics.representedExactlyOnce ||
    !metrics.quotesGrounded ||
    metrics.unknownFactIds.length > 0 ||
    !metrics.noRankingLanguage
  ) {
    throw new Error("The live reading failed its grounding checks. No capture was written.");
  }

  const capturedAt = new Date().toISOString();
  const capture = {
    surface: "reading",
    provider: "NVIDIA",
    model: result.model,
    capturedAt,
    engine: result.engine,
    mode: result.mode,
    latencyMs: result.latencyMs ?? null,
    usage: result.usage ?? null,
    input: target.input,
    output: result.reading,
    metrics,
    redactions: ["request/response headers not captured", "API key"],
  };

  const content = JSON.stringify(capture, null, 2) + "\n";
  const fileName = "nemotron-reading-" + timestampForFile(capturedAt) + ".json";
  const relativePath = relativeAuditPath(fileName);
  const filePath = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  const sha256 = createHash("sha256").update(content).digest("hex");

  const runs = await repo.getRecentAiRuns(20);
  const hasLiveRun = runs.some((run) => run.kind === "reading" && run.mode === "LIVE");
  const entry = {
    surface: "reading",
    provider: "NVIDIA",
    model: result.model,
    capturedAt,
    file: relativePath,
    sha256,
    redactions: ["request/response headers", "API key"],
  };

  console.log("");
  console.log("Live reading captured.");
  console.log("  model: " + result.model);
  console.log("  latency: " + (result.latencyMs ?? "n/a") + " ms");
  console.log("  requirements: " + metrics.requirements + ", covered: " + metrics.covered + ", gaps: " + metrics.gaps);
  console.log("  questions: " + metrics.questions + ", cited facts: " + metrics.citedFactIds.length);
  console.log("  capture: " + relativePath);
  console.log("  sha256: " + sha256);
  console.log("");
  console.log("LIVE_EVIDENCE entry (review the capture before adding it):");
  console.log(JSON.stringify(entry, null, 2));
  console.log("");
  if (!hasLiveRun) {
    console.warn("WARNING: no LIVE reading AiRun row was observed. Do not claim live-with-evidence until one exists.");
  } else {
    console.log("A LIVE reading AiRun row was observed in this checkout.");
  }
  console.log("Do not edit the capture after hashing. Do not commit the key.");
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nLive reading capture failed: " + message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
