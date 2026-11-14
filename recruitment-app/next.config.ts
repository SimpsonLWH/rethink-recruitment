import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // The Vercel runtime has a read-only filesystem apart from /tmp. Include the
  // seeded SQLite demo database in the server trace; src/lib/prisma.ts copies it
  // to /tmp on first use.
  outputFileTracingIncludes: {
    "/**/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
