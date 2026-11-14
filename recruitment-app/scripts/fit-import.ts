import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";
import { buildFitSummary } from "@/lib/fit";

const themeSchema = z.object({
  theme: z.string().min(1),
  factIds: z.array(z.string()).default([]),
});

const payloadSchema = z.object({
  generatedBy: z.string().optional(),
  summaries: z
    .array(
      z.object({
        roleId: z.string().min(1),
        candidateId: z.string().min(1),
        digest: z.string().min(1),
        sharedThemes: z.array(themeSchema).default([]),
        questions: z.array(z.string()).default([]),
        evidenceCoverage: z.number().int().min(0),
      }),
    )
    .min(1),
});

async function main() {
  const input = process.argv[2];
  if (!input) {
    throw new Error("Usage: npm run fit:import -- modal/data/fit-summaries.json");
  }
  const file = path.resolve(input);
  const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
  const payload = payloadSchema.parse(raw);
  const repo = getRepository();
  const inputs = await repo.getFitInputs();
  const candidates = new Map(inputs.candidates.map((candidate) => [candidate.id, candidate]));
  const roles = new Map(inputs.roles.map((role) => [role.id, role]));

  const rows = payload.summaries.map((summary) => {
    const candidate = candidates.get(summary.candidateId);
    const role = roles.get(summary.roleId);
    if (!candidate || !role) {
      throw new Error("Batch output references an unknown candidate or role: " + summary.candidateId + " / " + summary.roleId);
    }
    const local = buildFitSummary({
      candidateName: candidate.name,
      candidateTags: candidate.tags,
      facts: candidate.facts,
      role,
    });
    const allowedIds = new Set(candidate.facts.map((fact) => fact.id));
    for (const theme of summary.sharedThemes) {
      if (!theme.factIds.every((id) => allowedIds.has(id))) {
        throw new Error("Batch output cited a fact outside the candidate's master record.");
      }
    }
    return {
      roleId: summary.roleId,
      candidateId: summary.candidateId,
      digest: summary.digest,
      sharedThemes: summary.sharedThemes.length > 0 ? summary.sharedThemes : local.sharedThemes,
      questions: summary.questions.length > 0 ? summary.questions : local.questions,
      evidenceCoverage: Math.min(summary.evidenceCoverage, candidate.facts.length),
    };
  });

  const count = await repo.saveFitSummaries(rows, "modal");
  console.log("Imported " + count + " advisory fit briefs as generatedBy=modal.");
  console.log("No ranking or decision data was changed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
