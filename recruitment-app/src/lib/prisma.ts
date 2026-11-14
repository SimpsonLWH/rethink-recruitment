import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel functions have a read-only deployment filesystem apart from /tmp.
 * The demo ships a seeded SQLite file through outputFileTracingIncludes and
 * copies it into /tmp on first use. This keeps the sample accounts and data
 * available without a hosted database, at the cost of per-instance writes.
 */
function runtimeDatabaseUrl(): string {
  if (!process.env.VERCEL) return "file:./dev.db";

  const target = "/tmp/rivet-demo.db";
  if (!existsSync(target)) {
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "recruitment-app", "prisma", "dev.db"),
      path.join(process.cwd(), "..", "prisma", "dev.db"),
    ];
    const source = candidates.find((candidate) => existsSync(candidate));
    if (source) {
      copyFileSync(source, target);
    } else {
      console.error("[prisma] No seeded SQLite file found for Vercel runtime.");
    }
  }
  return "file:" + target;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: runtimeDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
