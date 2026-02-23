import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runRiskEngine } from '@/workers/risk-engine';
import { validateCronRequest } from '@/lib/cron-auth';
import { readCursorState } from '@/lib/worker-lock';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = validateCronRequest(request);
  if (!auth.authorized) return auth.response;

  const supabase = createClient();

  // Read cursor state before running to log pagination progress
  const { lastProcessedOrgId: previousCursor, pageSize } = await readCursorState(supabase, 'risk_engine');

  const result = await runRiskEngine(supabase);

  return NextResponse.json({
    success: true,
    stats: result,
    pagination: {
      batchSize: result.processedOrgs,
      pageSize,
      previousCursor,
      estimatedProgress: previousCursor
        ? `Continuing from org ${previousCursor}`
        : 'Starting from beginning',
    },
  });
});
