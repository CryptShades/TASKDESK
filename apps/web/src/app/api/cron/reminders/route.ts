import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runReminderEngine } from '@/workers/reminder-engine';
import { validateCronRequest } from '@/lib/cron-auth';
import { readCursorState } from '@/lib/worker-lock';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = validateCronRequest(request);
  if (!auth.authorized) return auth.response;

  const supabase = createClient();

  // Read cursor state before running to log pagination progress
  const { lastProcessedOrgId: previousCursor, pageSize } = await readCursorState(supabase, 'reminders');

  const result = await runReminderEngine(supabase);

  return NextResponse.json({
    success: true,
    stats: result,
    pagination: {
      pageSize,
      previousCursor,
      estimatedProgress: previousCursor
        ? `Continuing from org ${previousCursor}`
        : 'Starting from beginning',
    },
  });
});
