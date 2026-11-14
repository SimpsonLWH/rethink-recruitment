import type { EmployerReview, RecruitmentRepository } from "@/lib/repo";
import { buildReadingInput } from "@/lib/ai/reading";
import type { ReadingInput } from "@/lib/ai/reading-types";

const DEFAULT_ROLE = "northwind-product-engineer";
const DEFAULT_CANDIDATE = "noor-salmi";

export function getArg(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("Missing value for " + name);
  }
  return value;
}

export function requireLiveConfirmation() {
  if (!process.argv.includes("--confirm-live")) {
    throw new Error(
      "Refusing to spend provider quota without --confirm-live. Add it only when you are authorised to make a real NVIDIA call.",
    );
  }
  if (!process.env.NVIDIA_API_KEY?.trim()) {
    throw new Error("NVIDIA_API_KEY is not set. Add it to recruitment-app/.env.local or the shell; never commit it.");
  }
}

export async function loadReadingTarget(
  repo: RecruitmentRepository,
  roleSlug = DEFAULT_ROLE,
  candidateSlug = DEFAULT_CANDIDATE,
): Promise<{ review: EmployerReview; input: ReadingInput }> {
  const employers = await repo.getEmployerDirectory();
  let employer = null;
  let roleSummary = null;
  for (const entry of employers) {
    const found = entry.roles.find((role) => role.slug === roleSlug || role.id === roleSlug);
    if (found) {
      employer = entry;
      roleSummary = found;
      break;
    }
  }
  if (!employer || !roleSummary) {
    throw new Error("No seeded employer owns the role " + roleSlug + ". Run npm run seed first.");
  }

  const role = await repo.getRoleById(roleSummary.id);
  if (!role) throw new Error("Could not load the role " + roleSlug + ".");

  const candidateSummary = (await repo.getCandidateDirectory()).find(
    (candidate) => candidate.slug === candidateSlug || candidate.id === candidateSlug,
  );
  if (!candidateSummary) {
    throw new Error("No seeded candidate matches " + candidateSlug + ". Run npm run seed first.");
  }
  const candidate = await repo.getCandidateById(candidateSummary.id);
  if (!candidate) throw new Error("Could not load the candidate " + candidateSlug + ".");

  const review = await repo.getEmployerReview(role.id, candidate.id, employer.id);
  if (!review) {
    throw new Error("The seeded candidate " + candidateSlug + " is not reviewable for " + roleSlug + ".");
  }

  return {
    review,
    input: buildReadingInput({
      role: review.role,
      candidate: review.candidate,
      signals: review.signals,
    }),
  };
}
