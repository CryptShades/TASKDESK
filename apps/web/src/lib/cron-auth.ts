import { NextResponse } from 'next/server';

type CronAuthResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Validates that a cron endpoint request is authenticated.
 *
 * Checks two things in order:
 *  1. CRON_SECRET env var is set — if not, returns 500 (server misconfiguration).
 *  2. Authorization header equals `Bearer <CRON_SECRET>` — if not, returns 401.
 *
 * Usage:
 *   const auth = validateCronRequest(request);
 *   if (!auth.authorized) return auth.response;
 */
export function validateCronRequest(request: Request): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      'CRON_SECRET environment variable is not set. Cron endpoint is unprotected.'
    );
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Service misconfiguration' },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
