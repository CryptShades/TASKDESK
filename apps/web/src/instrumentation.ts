/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use this to validate required environment variables at startup so that
 * misconfigured deployments fail immediately with a clear error message
 * rather than silently misbehaving on the first request that needs them.
 */
export async function register() {
  // Only validate on the Node.js runtime (not the Edge runtime used by middleware).
  // Server-side secrets like SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET are not
  // available in the Edge runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateRequiredEnv } = await import('@/lib/env');
    validateRequiredEnv();
  }
}
