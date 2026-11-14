import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Demo-only password hashing. This is deliberately not production auth:
 * there is no email verification, reset flow, rate limit or account recovery.
 */
export function hashDemoPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyDemoPassword(password: string, hash: string, salt: string): boolean {
  try {
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export const SAMPLE_ACCOUNTS = {
  candidate: {
    email: "aino@demo.rivet",
    password: "demo-candidate",
    label: "Aino Vikström",
    description: "Product-minded frontend engineer with completed assessments and profile evidence.",
  },
  employer: {
    email: "mikko@northwind.demo",
    password: "demo-recruiter",
    label: "Northwind Labs",
    description: "Civic technology studio with a live Product Engineer role card.",
  },
} as const;

export type DemoSide = keyof typeof SAMPLE_ACCOUNTS;
