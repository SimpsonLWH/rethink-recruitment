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
  async headers() {
    return [
      {
        // Set only widely recognised Permissions-Policy features. Some browser
        // extensions inject browsing-topics=(), which Chrome reports as an
        // unrecognised feature. The app does not need those APIs.
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
