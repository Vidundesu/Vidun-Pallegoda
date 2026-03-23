import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow long-running serverless functions (scrape + 2 AI calls).
  // Route-level `maxDuration` exports do the actual capping per-function;
  // this just ensures the build doesn't strip that config.
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
