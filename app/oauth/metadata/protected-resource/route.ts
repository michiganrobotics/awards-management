import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, MCP_SCOPE } from '@/lib/mcp-auth';

// Served at /.well-known/oauth-protected-resource[/mcp] (RFC 9728) via the rewrites in next.config.ts.
export function GET(request: NextRequest) {
  const base = getBaseUrl(request);
  return NextResponse.json({
    resource: `${base}/mcp`,
    authorization_servers: [base],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Award Nominations',
  });
}
