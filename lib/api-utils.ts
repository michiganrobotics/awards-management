import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isDevelopment } from './auth';
import { ZodError } from 'zod';

export interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Wrapper for API routes that handles auth and errors consistently
 */
export function withAuth<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      // Skip auth in development mode
      if (!isDevelopment()) {
        await requireAuth(request);
      }

      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wrapper for API routes without auth requirement (public endpoints)
 */
export function withErrorHandling<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Centralized error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Custom error with message
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message === 'Not found') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generic error
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('JSON parse error:', error, 'Value:', value);
    return fallback;
  }
}

/**
 * Validate that a redirect URL is safe (not an open redirect)
 */
export function validateRedirectUrl(url: string, allowedDomains: string[] = []): string {
  try {
    // If it's a relative path, it's safe
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // Parse the URL
    const parsed = new URL(url);

    // Check if domain is in allowed list
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );

      if (isAllowed) {
        return url;
      }
    }

    // Default to home page if URL is not safe
    return '/';
  } catch {
    // If URL parsing fails, return home page
    return '/';
  }
}

/**
 * Escape special characters for Google Drive query
 */
export function escapeDriveQuery(value: string): string {
  return value.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}
