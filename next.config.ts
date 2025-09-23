// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep images simple on static/CDN
  images: { unoptimized: true },

  // Skip ESLint during CI builds
  eslint: { ignoreDuringBuilds: true },

  // Allow build to succeed even if type errors exist
  typescript: { ignoreBuildErrors: true },

  // COOP/COEP so DuckDB-WASM can run reliably
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
