/**
 * Health check endpoint — no authentication required.
 *
 * Returns 200 when all subsystems are healthy, 503 when any check fails.
 * Add this URL to Vercel health checks or your uptime monitor (e.g. Better
 * Uptime, Pingdom) to get alerted before users notice a problem.
 *
 * Checks performed:
 *   environment — all required env vars are present (via validateRequiredEnv)
 *   database    — a lightweight Supabase query confirms DB connectivity
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateRequiredEnv } from '@/lib/env';

type CheckStatus = 'ok' | 'error';

export async function GET() {
  const checks: { environment: CheckStatus; database: CheckStatus } = {
    environment: 'ok',
    database: 'ok',
  };

  // 1. Environment variable check
  try {
    validateRequiredEnv();
  } catch {
    checks.environment = 'error';
  }

  // 2. Database connectivity check — SELECT 1 equivalent via a head-only query
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) throw error;
  } catch {
    checks.database = 'error';
  }

  const allOk = Object.values(checks).every((s) => s === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
