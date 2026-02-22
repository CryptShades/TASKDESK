/**
 * Required environment variables for the Taskdesk web app.
 * These are checked at server startup via instrumentation.ts.
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
] as const;

/**
 * Validates that all required environment variables are set.
 * Throws an error listing every missing variable if any are absent.
 * Call this at server startup so misconfigured deployments fail fast
 * instead of silently misbehaving at runtime.
 */
export function validateRequiredEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Set these in your .env.local file or Vercel environment settings.`
    );
  }

  console.log('Environment: all required variables present');
}
