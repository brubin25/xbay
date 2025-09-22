/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        // Enable cross-origin isolation for the DuckDB WASM worker
        {
          source: "/duckdb-dist/:path*",
          headers: [
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
            // optional but nice: cache the worker + wasm forever (filenames are content-addressed in your repo)
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        // Ensure proper MIME for any .wasm file served from /public
        {
          source: "/:all*\\.wasm",
          headers: [
            { key: "Content-Type", value: "application/wasm" },
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
      ];
    },
  };
  
  module.exports = nextConfig;
  