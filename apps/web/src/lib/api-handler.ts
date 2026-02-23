/**
 * API error boundary for Next.js App Router route handlers.
 *
 * Wraps a handler in a top-level try/catch. On unhandled error:
 *   - Logs the full error detail internally (URL, method, stack trace)
 *   - Returns a generic 500 response to the caller so internal details
 *     are never leaked to clients
 *
 * Usage (no dynamic params):
 *   export const GET = withErrorHandler(async (request) => {
 *     const data = await fetchSomething();
 *     return NextResponse.json({ data });
 *   });
 *
 * Usage (with dynamic params):
 *   export const PATCH = withErrorHandler(async (request, { params }) => {
 *     const result = await updateSomething(params.id);
 *     return NextResponse.json({ data: result });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// Covers both no-param handlers and dynamic-segment handlers
type Handler<TContext = any> = (
  request: NextRequest,
  context: TContext,
) => Promise<NextResponse>;

export function withErrorHandler<TContext = any>(
  handler: Handler<TContext>,
): Handler<TContext> {
  return async (request: NextRequest, context: TContext): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      const isError = error instanceof Error;
      logger.error('Unhandled API error', {
        method: request.method,
        url: request.url,
        error: isError ? error.message : String(error),
        stack: isError ? error.stack : undefined,
        // Preserve application error codes for internal triage without
        // exposing them in the response body
        code: (error as any)?.code,
      });

      return NextResponse.json(
        { error: 'An internal error occurred. Our team has been notified.' },
        { status: 500 },
      );
    }
  };
}
