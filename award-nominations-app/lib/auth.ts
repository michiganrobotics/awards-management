import { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';

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
}

/**
 * Verify JWT token from cookie - called ONCE per request
 * This avoids the "repeated auth DDoS" issue by caching JWKS
 * and only verifying once per API call
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
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
    console.error('Token verification failed:', error);
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
    console.warn('⚠️  AUTH BYPASSED - Development mode active');
  }

  return isDev;
}
