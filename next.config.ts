import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the container image.
  output: "standalone",
  // Pin the tracing root to this project so server.js lands at the standalone
  // root (otherwise Next infers a higher workspace root and nests the output).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
