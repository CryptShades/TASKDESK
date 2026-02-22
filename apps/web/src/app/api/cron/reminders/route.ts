import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runReminderEngine } from '@/workers/reminder-engine';
import { validateCronRequest } from '@/lib/cron-auth';
import { readCursorState } from '@/lib/worker-lock';

export async function GET(request: NextRequest) {
  const auth = validateCronRequest(request);
  if (!auth.authorized) return auth.response;

  try {
    const supabase = createClient();

    // Read cursor state before running to log pagination progress
    const { lastProcessedOrgId: previousCursor, pageSize } = await readCursorState(supabase, 'reminders');
    const estimatedProgressMsg = previousCursor
      ? `Continuing from org ${previousCursor}`
      : 'Starting from beginning';

    const result = await runReminderEngine(supabase);

    return NextResponse.json({
      success: true,
      stats: result,
      pagination: {
        pageSize,
        previousCursor,
        estimatedProgress: estimatedProgressMsg,
      },
    });
  } catch (error: any) {
    console.error('Reminder Engine Cron Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
