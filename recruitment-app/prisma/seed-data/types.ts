export type SeedProvenance = "SELF_CLAIMED" | "EMPLOYER_CONFIRMED";

export interface SeedFact {
  prompt: string;
  claim: string;
  skillTags: string[];
  evidenceUrl?: string | null;
  provenance?: SeedProvenance;
  confirmedByEmployerSlug?: string;
  origin?: "SEED" | "AI_EXTRACTED" | "MANUAL";
}

export interface SeedCandidate {
  slug: string;
  name: string;
  headline: string;
  location: string;
  bio: string;
  monogram: string;
  palette: string;
  tags: string[];
  order: number;
  facts: SeedFact[];
}

export interface SeedRole {
  slug: string;
  title: string;
  employmentType: string;
  workMode: string;
  location: string;
  summary: string;
  whyJoin: string;
  problemNow: string;
  first90: string;
  skills: string[];
  portfolioRequired?: boolean;
  order: number;
}

export interface SeedEmployerPrompt {
  prompt: string;
  answer: string;
  order: number;
}

export interface SeedEmployer {
  slug: string;
  name: string;
  tagline: string;
  about: string;
  industry: string;
  teamSize: string;
  location: string;
  logoMark: string;
  palette: string;
  order: number;
  prompts: SeedEmployerPrompt[];
  roles: SeedRole[];
}

export interface SeedMessage {
  sender: "candidate" | "employer";
  body: string;
  minutesAgo: number;
}

export interface SeedMatch {
  candidateSlug: string;
  roleSlug: string;
  messages: SeedMessage[];
}

export interface SeedRose {
  candidateSlug: string;
  roleSlug: string;
  sender: "candidate" | "employer";
  reason: string;
  hoursAgo: number;
}
