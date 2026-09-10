import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Build produksi ke folder terpisah (.next-prod) agar tidak bentrok dengan dev server (.next).
  // Diatur lewat env STRUK_DIST_DIR oleh scripts/prod-build.ps1 dan prod-start.ps1.
  distDir: process.env.STRUK_DIST_DIR || ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
