import path from "node:path";

import type { NextConfig } from "next";

/**
 * This repo lives inside a multi-project workspace whose root also carries a
 * package-lock.json. Next would otherwise infer *that* directory as the project
 * root and trace output files from the wrong place, producing a broken
 * standalone bundle. Pin both roots to this project explicitly.
 */
const projectRoot = path.resolve(process.cwd());

/**
 * Public routes are rendered per request against a local Postgres and
 * revalidated on demand from admin mutations, so a visitor's request never
 * waits on a cache lookup that could be stale.
 */
const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  reactStrictMode: true,
  poweredByHeader: false,

  // Native / heavy server-only packages must stay outside the bundler.
  serverExternalPackages: [
    "@react-pdf/renderer",
    "playwright-core",
    "sharp",
    "bcryptjs",
    "@prisma/client",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [64, 96, 128, 200, 256, 384, 512],
    remotePatterns: [],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "react-markdown"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Render surfaces are internal only — never index them.
        source: "/render/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
