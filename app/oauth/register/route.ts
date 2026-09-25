import { NextRequest, NextResponse } from 'next/server';
import { isMcpConfigured, isAllowedRedirectUri, registerClient } from '@/lib/mcp-auth';

// OAuth dynamic client registration (RFC 7591). Reached without a U-M login —
// the auth proxy lets this path through; see robotics-auth-proxy's oidc.conf.
export async function POST(request: NextRequest) {
  if (!isMcpConfigured()) {
    return NextResponse.json({ error: 'temporarily_unavailable', error_description: 'MCP is not configured' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_client_metadata', error_description: 'Body must be JSON' }, { status: 400 });
  }

  const redirectUris = body.redirect_uris;
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || !redirectUris.every((u) => typeof u === 'string')) {
    return NextResponse.json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris is required' }, { status: 400 });
  }
  const rejected = redirectUris.filter((u) => !isAllowedRedirectUri(u));
  if (rejected.length > 0) {
    return NextResponse.json(
      { error: 'invalid_redirect_uri', error_description: `Only Claude clients may connect. Not allowed: ${rejected.join(', ')}` },
      { status: 400 }
    );
  }

  const clientName = typeof body.client_name === 'string' ? body.client_name.slice(0, 100) : undefined;
  const clientId = await registerClient(redirectUris, clientName);

  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
