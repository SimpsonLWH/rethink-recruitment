#!/usr/bin/env node
/**
 * Three-pair live evaluation for the evidence reading surface.
 *
 *   NVIDIA_API_KEY=... npm run eval:reading -- --confirm-live
 *
 * This is a small, synthetic comparison, not a benchmark. It records the live
 * and deterministic fallback readings, grounding checks and latency, and leaves
 * a reviewer rubric for a human to fill honestly. It can make up to twelve provider requests.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildEvidenceReadingLocally } from "@/lib/ai/reading";
import { readEvidence } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";
import { loadReadingTarget, requireLiveConfirmation } from "./reading-targets";
import { readingMetrics } from "./reading-metrics";

const PAIRS = [
  { roleSlug: "northwind-product-engineer", candidateSlug: "noor-salmi", label: "meets the bar" },
  { roleSlug: "northwind-product-engineer", candidateSlug: "daniel-achebe", label: "below the bar" },
  { roleSlug: "northwind-product-engineer", candidateSlug: "elias-nieminen", label: "no assessment" },
] as const;

async function main() {
  requireLiveConfirmation();

  const repo = getRepository();
  const results = [];
  let allLive = true;

  console.log("Synthetic evaluation only. Up to 12 NVIDIA requests (two attempts per call, one repair per pair).");
  console.log("");

  for (const pair of PAIRS) {
    const target = await loadReadingTarget(repo, pair.roleSlug, pair.candidateSlug);
    const live = await readEvidence(target.input, { bypassCache: true });
    const fallback = buildEvidenceReadingLocally(target.input);
    const liveMetrics = readingMetrics(live.reading, target.input);
    const fallbackMetrics = readingMetrics(fallback, target.input);
    const isLive = live.mode === "LIVE";
    if (!isLive) allLive = false;

    results.push({
      roleSlug: pair.roleSlug,
      candidateSlug: pair.candidateSlug,
      label: pair.label,
      live: {
        ok: isLive,
        mode: live.mode,
        engine: live.engine,
        fallbackReason: live.fallbackReason ?? null,
        latencyMs: live.latencyMs ?? null,
        usage: live.usage ?? null,
        metrics: liveMetrics,
        reading: live.reading,
      },
      fallback: {
        metrics: fallbackMetrics,
        reading: fallback,
      },
    });

    console.log(
      [
        pair.candidateSlug.padEnd(20),
        (isLive ? "LIVE" : "FALLBACK").padEnd(9),
        String(live.latencyMs ?? "-").padStart(6) + "ms",
        "covered " + liveMetrics.covered + "/" + liveMetrics.requirements,
        "questions " + liveMetrics.questions,
        "represented " + (liveMetrics.representedExactlyOnce ? "yes" : "no"),
        "grounded " + (liveMetrics.quotesGrounded && liveMetrics.unknownFactIds.length === 0 ? "yes" : "no"),
        "ranking " + (liveMetrics.noRankingLanguage ? "no" : "YES"),
      ].join("  "),
    );
  }

  const artifact = {
    generatedAt: new Date().toISOString(),
    note:
      "Three synthetic role/candidate pairs. The live readings were produced by the configured NVIDIA Nemotron surface with a cache bypass; the fallback readings were produced by the deterministic local builder. No model-vs-fallback superiority is claimed. A single reviewer may fill the rubric; ratings are directional, not a benchmark.",
    live: allLive,
    pairs: results,
    reviewerRubric: {
      reviewer: null,
      notes: null,
      ratings: PAIRS.map((pair) => ({
        candidateSlug: pair.candidateSlug,
        liveUsefulness: null,
        fallbackUsefulness: null,
        liveSpecificity: null,
        fallbackSpecificity: null,
      })),
    },
  };

  const outputPath = path.join(process.cwd(), "audit/live/reading-eval.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log("");
  console.log("Evaluation written to audit/live/reading-eval.json");
  console.log("Fill reviewerRubric by hand; do not invent ratings.");
  if (!allLive) {
    console.error("At least one pair fell back. Do not describe the whole run as live.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nReading evaluation failed: " + message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
