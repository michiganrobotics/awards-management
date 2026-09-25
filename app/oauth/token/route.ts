import { NextRequest, NextResponse } from 'next/server';
import {
  isMcpConfigured,
  issueTokens,
  readClient,
  redeemAuthorizationCode,
  redeemRefreshToken,
} from '@/lib/mcp-auth';

// OAuth token endpoint. Called by Claude's servers (not a browser), so the auth
// proxy lets it through without a U-M login; the code/refresh token is the proof.

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readParams(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
  }
  const form = await request.formData();
  return Object.fromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

export async function POST(request: NextRequest) {
  if (!isMcpConfigured()) return oauthError('temporarily_unavailable', 'MCP is not configured', 503);

  let params: Record<string, string>;
  try {
    params = await readParams(request);
  } catch {
    return oauthError('invalid_request', 'Could not read request body');
  }

  const clientId = params.client_id;
  if (!clientId || !(await readClient(clientId))) return oauthError('invalid_client', 'Unknown client', 401);

  if (params.grant_type === 'authorization_code') {
    if (!params.code || !params.code_verifier || !params.redirect_uri) {
      return oauthError('invalid_request', 'code, code_verifier and redirect_uri are required');
    }
    const user = await redeemAuthorizationCode({
      code: params.code,
      clientId,
      redirectUri: params.redirect_uri,
      codeVerifier: params.code_verifier,
    });
    if (!user) return oauthError('invalid_grant', 'Authorization code is invalid, expired or already used');
    return NextResponse.json(await issueTokens(user, clientId), { headers: { 'Cache-Control': 'no-store' } });
  }

  if (params.grant_type === 'refresh_token') {
    if (!params.refresh_token) return oauthError('invalid_request', 'refresh_token is required');
    const user = await redeemRefreshToken(params.refresh_token, clientId);
    if (!user) return oauthError('invalid_grant', 'Refresh token is invalid or expired');
    return NextResponse.json(await issueTokens(user, clientId), { headers: { 'Cache-Control': 'no-store' } });
  }

  return oauthError('unsupported_grant_type', 'Use authorization_code or refresh_token');
}
