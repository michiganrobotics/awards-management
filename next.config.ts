import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the container image.
  output: "standalone",
  // Pin the tracing root to this project so server.js lands at the standalone
  // root (otherwise Next infers a higher workspace root and nests the output).
  outputFileTracingRoot: import.meta.dirname,
  // OAuth discovery documents for the MCP server's Claude connector.
  async rewrites() {
    return [
      { source: '/.well-known/oauth-authorization-server', destination: '/oauth/metadata/authorization-server' },
      { source: '/.well-known/oauth-protected-resource', destination: '/oauth/metadata/protected-resource' },
      { source: '/.well-known/oauth-protected-resource/mcp', destination: '/oauth/metadata/protected-resource' },
    ];
  },
};

export default nextConfig;
