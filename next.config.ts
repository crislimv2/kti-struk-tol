import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Untuk Docker/VPS (Dockerfile menyalin .next/standalone). `next start` lokal tetap jalan.
  output: "standalone",
  // Vercel: pelacak file tidak ikut menyalin libvips (dependensi .so dari sharp) ke bundle
  // function -> "libvips-cpp.so: cannot open shared object file". Paksa disertakan.
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/@img/sharp-libvips-linux-x64/**",
      "./node_modules/@img/sharp-linux-x64/**",
    ],
  },
  // Build produksi ke folder terpisah (.next-prod) agar tidak bentrok dengan dev server (.next).
  // Diatur lewat env STRUK_DIST_DIR oleh scripts/prod-build.ps1 dan prod-start.ps1.
  distDir: process.env.STRUK_DIST_DIR || ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Skrip agen disajikan sebagai teks agar `irm <url>/agent/install.ps1 | iex` mendapat string,
  // bukan octet-stream, dan browser menampilkan/mengunduhnya dengan benar.
  async headers() {
    return [
      {
        source: "/agent/:file*",
        headers: [
          { key: "Content-Type", value: "text/plain; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
