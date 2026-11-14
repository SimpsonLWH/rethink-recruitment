import { repository } from "./prisma-repository";
import type { RecruitmentRepository } from "./types";

export function getRepository(): RecruitmentRepository {
  return repository;
}

export { RepositoryError } from "./types";
export type * from "./types";
