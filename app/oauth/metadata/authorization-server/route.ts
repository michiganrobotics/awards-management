import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, MCP_SCOPE } from '@/lib/mcp-auth';

// Served at /.well-known/oauth-authorization-server (RFC 8414) via the rewrite in next.config.ts.
export function GET(request: NextRequest) {
  const base = getBaseUrl(request);
  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [MCP_SCOPE],
  });
}
