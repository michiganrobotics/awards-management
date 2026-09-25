/**
 * OAuth 2.1 for the MCP server (app/mcp), so Claude connectors can sign in.
 *
 * The app is its own authorization server, but people never type a password
 * here: /oauth/authorize sits behind the U-M auth proxy like every other page,
 * so reaching it means the proxy has already logged the person in and checked
 * their MCommunity group. We just ask them to confirm and hand Claude a code.
 *
 * Everything is stateless signed JWTs (HS256, MCP_TOKEN_SECRET) — client IDs
 * from dynamic registration, authorization codes, access and refresh tokens —
 * because the app has no database. Rotating MCP_TOKEN_SECRET revokes every
 * connector at once; people then just reconnect.
 */
import { createHash, randomUUID } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const ISSUER = 'awards-mcp';
export const MCP_SCOPE = 'nominations';
const CODE_TTL = '5m';
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL = '30d';

type TokenType = 'client' | 'code' | 'access' | 'refresh';

export interface McpUser {
  email: string;
  name?: string;
}

export function isMcpConfigured(): boolean {
  return (process.env.MCP_TOKEN_SECRET || '').length >= 32;
}

function secretKey(): Uint8Array {
  if (!isMcpConfigured()) {
    throw new Error('MCP_TOKEN_SECRET is not set (needs at least 32 characters)');
  }
  return new TextEncoder().encode(process.env.MCP_TOKEN_SECRET);
}

/** Public origin of the app, e.g. https://awards.robotics.umich.edu */
export function getBaseUrl(request: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

/**
 * Only Claude's own callback URLs may receive codes: claude.ai / claude.com for
 * web, desktop and mobile connectors, and localhost for Claude Code. This stops
 * anyone from registering a client that sends a committee member's code to
 * their own site.
 */
export function isAllowedRedirectUri(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol === 'https:' && ['claude.ai', 'claude.com'].includes(url.hostname)) return true;
  if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) return true;
  return false;
}

async function sign(type: TokenType, claims: Record<string, unknown>, expiresIn?: string | number) {
  let jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(type)
    .setIssuedAt()
    .setJti(randomUUID());
  if (expiresIn !== undefined) jwt = jwt.setExpirationTime(expiresIn);
  return jwt.sign(secretKey());
}

async function verify(type: TokenType, token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, audience: type });
    return payload;
  } catch {
    return null;
  }
}

function hashClientId(clientId: string): string {
  return createHash('sha256').update(clientId).digest('base64url');
}

// --- Dynamic client registration --------------------------------------------

export async function registerClient(redirectUris: string[], clientName?: string) {
  return sign('client', { redirect_uris: redirectUris, client_name: clientName || 'MCP client' });
}

export async function readClient(clientId: string) {
  const payload = await verify('client', clientId);
  if (!payload || !Array.isArray(payload.redirect_uris)) return null;
  return {
    redirectUris: payload.redirect_uris as string[],
    clientName: String(payload.client_name || 'MCP client'),
  };
}

// --- Authorization codes -----------------------------------------------------

// Codes are single-use. Remembered per process only, which is enough while the
// app runs as one replica; with more, a code could be replayed within its
// 5-minute life on another pod (it's still bound to the client's PKCE secret).
const usedCodes = new Map<string, number>();

export async function issueAuthorizationCode(params: {
  user: McpUser;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
}) {
  return sign(
    'code',
    {
      sub: params.user.email,
      name: params.user.name,
      cid: hashClientId(params.clientId),
      redirect_uri: params.redirectUri,
      code_challenge: params.codeChallenge,
    },
    CODE_TTL
  );
}

export async function redeemAuthorizationCode(params: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<McpUser | null> {
  const payload = await verify('code', params.code);
  if (!payload || !payload.jti || !payload.exp) return null;

  const now = Date.now() / 1000;
  for (const [jti, exp] of usedCodes) {
    if (exp < now) usedCodes.delete(jti);
  }
  if (usedCodes.has(payload.jti)) return null;

  if (payload.cid !== hashClientId(params.clientId)) return null;
  if (payload.redirect_uri !== params.redirectUri) return null;
  const challenge = createHash('sha256').update(params.codeVerifier).digest('base64url');
  if (payload.code_challenge !== challenge) return null;

  usedCodes.set(payload.jti, payload.exp);
  return { email: String(payload.sub), name: payload.name ? String(payload.name) : undefined };
}

// --- Access and refresh tokens -----------------------------------------------

export async function issueTokens(user: McpUser, clientId: string) {
  const claims = { sub: user.email, name: user.name, cid: hashClientId(clientId), scope: MCP_SCOPE };
  return {
    access_token: await sign('access', claims, `${ACCESS_TTL_SECONDS}s`),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: await sign('refresh', claims, REFRESH_TTL),
    scope: MCP_SCOPE,
  };
}

export async function redeemRefreshToken(token: string, clientId: string): Promise<McpUser | null> {
  const payload = await verify('refresh', token);
  if (!payload || payload.cid !== hashClientId(clientId)) return null;
  return { email: String(payload.sub), name: payload.name ? String(payload.name) : undefined };
}

export async function verifyAccessToken(request: Request): Promise<McpUser | null> {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const payload = await verify('access', match[1].trim());
  if (!payload?.sub) return null;
  return { email: String(payload.sub), name: payload.name ? String(payload.name) : undefined };
}
