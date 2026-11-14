import { buildFitSummary } from "@/lib/fit";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/lib/repo";

async function main() {
  const repo = getRepository();
  const inputs = await repo.getFitInputs();
  const rows = [];
  for (const candidate of inputs.candidates) {
    for (const role of inputs.roles) {
      const fit = buildFitSummary({
        candidateName: candidate.name,
        candidateTags: candidate.tags,
        facts: candidate.facts,
        role,
      });
      rows.push({
        roleId: role.id,
        candidateId: candidate.id,
        digest: fit.digest,
        sharedThemes: fit.sharedThemes,
        questions: fit.questions,
        evidenceCoverage: fit.evidenceCoverage,
      });
    }
  }
  const count = await repo.saveFitSummaries(rows, "local-fallback");
  console.log("Computed " + count + " local advisory fit briefs across " + inputs.candidates.length + " candidates × " + inputs.roles.length + " roles.");
  console.log("These are advisory text derived from tags and evidence presence. No score, no ranking.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
