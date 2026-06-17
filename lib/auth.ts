import { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import { logger } from './logger';

const OIDC_CONFIG = {
  issuer: 'https://shibboleth.umich.edu',
  jwksUri: 'https://shibboleth.umich.edu/oidc/keyset.jwk',
  clientId: process.env.UMICH_AWARDS_CLIENT_ID!,
};

// Cache JWKS to avoid repeated fetches
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

function getJWKS() {
  const now = Date.now();
  if (!jwksCache || now - jwksCacheTime > JWKS_CACHE_TTL) {
    jwksCache = createRemoteJWKSet(new URL(OIDC_CONFIG.jwksUri));
    jwksCacheTime = now;
  }
  return jwksCache;
}

export interface AuthUser extends JWTPayload {
  email?: string;
  name?: string;
  sub?: string;
  groups?: string[];
}

/**
 * Verify the caller's identity for one request.
 *
 * Two trust models, selected by deployment:
 *  - Behind the OpenShift mod_auth_openidc proxy (TRUST_PROXY_AUTH=true): the
 *    proxy has already authenticated and group-gated the request, so we trust
 *    the X-Remote-* headers it injects. This is gated behind an explicit env
 *    flag so a directly-reachable deployment can never be spoofed by a client
 *    sending forged X-Remote-* headers.
 *  - Otherwise (e.g. the Netlify edge-function deployment): verify the
 *    umich_awards_token JWT cookie against the U-M JWKS.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  // Proxy-trusted headers
  if (process.env.TRUST_PROXY_AUTH === 'true') {
    const remoteUser = request.headers.get('x-remote-user');
    if (!remoteUser) {
      return null;
    }
    const groups = (request.headers.get('x-remote-groups') || '')
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    return {
      sub: remoteUser,
      email: remoteUser,
      name: request.headers.get('x-remote-name') || undefined,
      groups,
    } as AuthUser;
  }

  try {
    // Get token from cookie
    const token = request.cookies.get('umich_awards_token')?.value;

    if (!token) {
      return null;
    }

    // Verify token using cached JWKS
    const JWKS = getJWKS();
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: OIDC_CONFIG.issuer,
      audience: OIDC_CONFIG.clientId,
      clockTolerance: '5 minutes',
    });

    return payload as AuthUser;
  } catch (error) {
    logger.error('Token verification failed', error);
    return null;
  }
}

/**
 * Middleware helper for API routes
 * Usage: const user = await requireAuth(request);
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(request);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Check if running in development mode (bypass auth)
 * SECURITY: Explicitly checks that we're NOT in production to prevent accidental bypass
 */
export function isDevelopment(): boolean {
  // Double-check we're NOT in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // Log warning when auth is bypassed
  if (isDev) {
    logger.warn('AUTH BYPASSED - Development mode active');
  }

  return isDev;
}
