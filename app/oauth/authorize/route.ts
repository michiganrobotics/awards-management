import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isDevelopment } from '@/lib/auth';
import {
  getBaseUrl,
  isMcpConfigured,
  isAllowedRedirectUri,
  issueAuthorizationCode,
  readClient,
  McpUser,
} from '@/lib/mcp-auth';
import { logger } from '@/lib/logger';

// OAuth authorization endpoint. Unlike the other /oauth paths this one stays
// behind the U-M auth proxy, so the person has already signed in with U-M and
// passed the committee group check by the time they see the consent page.

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 48px 16px; }
  main { max-width: 440px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; }
  h1 { font-size: 1.25rem; margin: 0 0 12px; }
  p, li { line-height: 1.5; color: #334155; }
  .actions { display: flex; gap: 12px; margin-top: 24px; }
  button { flex: 1; padding: 10px; border-radius: 8px; font-size: 1rem; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; }
  button[value=allow] { background: #00274c; color: #fff; border-color: #00274c; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #e2e8f0; }
    main { background: #1e293b; border-color: #334155; }
    p, li { color: #cbd5e1; }
    button { background: #1e293b; color: #e2e8f0; border-color: #475569; }
    button[value=allow] { background: #ffcb05; color: #00274c; border-color: #ffcb05; }
  }
</style></head><body><main>${body}</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' },
  });
}

async function currentUser(request: NextRequest): Promise<McpUser | null> {
  if (isDevelopment()) return { email: 'dev@localhost', name: 'Local developer' };
  const user = await verifyAuth(request);
  if (!user?.email) return null;
  return { email: user.email, name: user.name };
}

type Params = Record<string, string>;

/** Validate the request; returns an error page, a redirect with an error, or the checked values. */
async function check(params: Params) {
  const client = params.client_id ? await readClient(params.client_id) : null;
  if (!client) {
    return { error: page('Invalid request', '<h1>Unknown client</h1><p>Remove the connector in Claude and add it again.</p>', 400) };
  }
  const redirectUri = params.redirect_uri || (client.redirectUris.length === 1 ? client.redirectUris[0] : '');
  if (!client.redirectUris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    return { error: page('Invalid request', '<h1>Invalid redirect</h1><p>This client isn’t allowed to receive access.</p>', 400) };
  }

  const fail = (error: string, description: string) => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', error);
    url.searchParams.set('error_description', description);
    if (params.state) url.searchParams.set('state', params.state);
    return { error: NextResponse.redirect(url.toString(), 303) };
  };
  if (params.response_type !== 'code') return fail('unsupported_response_type', 'response_type must be code');
  if (!params.code_challenge || params.code_challenge_method !== 'S256') {
    return fail('invalid_request', 'PKCE with S256 is required');
  }
  return { client, redirectUri };
}

export async function GET(request: NextRequest) {
  if (!isMcpConfigured()) return page('Unavailable', '<h1>Claude connector isn’t set up yet</h1><p>MCP_TOKEN_SECRET is missing.</p>', 503);

  const params = Object.fromEntries(request.nextUrl.searchParams) as Params;
  const checked = await check(params);
  if ('error' in checked) return checked.error;

  const user = await currentUser(request);
  if (!user) return page('Sign in required', '<h1>Sign in required</h1><p>Open the awards app and sign in with your U-M account, then try connecting again.</p>', 401);

  const hidden = ['client_id', 'redirect_uri', 'state', 'code_challenge', 'code_challenge_method', 'response_type', 'scope']
    .filter((key) => params[key] !== undefined)
    .map((key) => `<input type="hidden" name="${key}" value="${escapeHtml(params[key])}">`)
    .join('');

  return page(
    'Connect Claude to Award Nominations',
    `<h1>Connect ${escapeHtml(checked.client.clientName)} to Award Nominations?</h1>
<p>Signed in as <strong>${escapeHtml(user.email)}</strong>. Claude will be able to, as you:</p>
<ul><li>look up awards and nominations</li><li>create and update nominations</li><li>add documents to nomination folders</li></ul>
<p>It can’t delete anything. Access lasts until you remove the connector in Claude, or at most 30 days without use.</p>
<form method="post">${hidden}
<div class="actions"><button type="submit" name="action" value="deny">Cancel</button><button type="submit" name="action" value="allow">Allow</button></div>
</form>`
  );
}

export async function POST(request: NextRequest) {
  if (!isMcpConfigured()) return page('Unavailable', '<h1>Claude connector isn’t set up yet</h1>', 503);

  // CSRF: the form must be posted from this app's own consent page.
  const origin = request.headers.get('origin');
  if (origin && origin !== getBaseUrl(request)) {
    return page('Invalid request', '<h1>Invalid request</h1><p>Start the connection again from Claude.</p>', 403);
  }

  const form = await request.formData();
  const params = Object.fromEntries(
    [...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  ) as Params;
  const checked = await check(params);
  if ('error' in checked) return checked.error;

  const user = await currentUser(request);
  if (!user) return page('Sign in required', '<h1>Sign in required</h1>', 401);

  const url = new URL(checked.redirectUri);
  if (params.state) url.searchParams.set('state', params.state);

  if (params.action !== 'allow') {
    url.searchParams.set('error', 'access_denied');
    return NextResponse.redirect(url.toString(), 303);
  }

  const code = await issueAuthorizationCode({
    user,
    clientId: params.client_id,
    redirectUri: checked.redirectUri,
    codeChallenge: params.code_challenge,
  });
  url.searchParams.set('code', code);
  logger.audit('MCP connector authorized', { user: user.email, client: checked.client.clientName });
  return NextResponse.redirect(url.toString(), 303);
}
