import { NextRequest, NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/mcp-server';
import { getBaseUrl, isMcpConfigured, verifyAccessToken } from '@/lib/mcp-auth';

// Remote MCP server for Claude connectors. The auth proxy lets /mcp through
// without a U-M login; instead every request needs a Bearer token this app
// issued via /oauth/authorize (which *is* behind the U-M login).
//
// Stateless: a fresh server + transport per request, JSON responses, no
// sessions — nothing to share between replicas.

export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  if (!isMcpConfigured()) {
    return NextResponse.json({ error: 'MCP is not configured on this server' }, { status: 503 });
  }

  const user = await verifyAccessToken(request);
  if (!user) {
    const metadata = `${getBaseUrl(request)}/.well-known/oauth-protected-resource/mcp`;
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Sign in to connect' },
      { status: 401, headers: { 'WWW-Authenticate': `Bearer resource_metadata="${metadata}"` } }
    );
  }

  const server = createMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: 16 * 1024 * 1024, // room for a 10 MB file as base64
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}

export const POST = handle;

// No server-initiated streams or sessions to open or close.
export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
export const DELETE = GET;
