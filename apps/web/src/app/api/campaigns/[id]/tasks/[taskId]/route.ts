import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getTaskById } from '@/services/task.service';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const task = await getTaskById(params.taskId, currentUser.org_id);

    return NextResponse.json(
      { data: task, error: null },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.code === ErrorCode.TASK_NOT_FOUND) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.TASK_NOT_FOUND, message: 'Task not found.' } },
        { status: 404 },
      );
    }
    logger.error('GET /api/campaigns/[id]/tasks/[taskId] failed', {
      task_id: params.taskId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } },
      { status: 500 },
    );
  }
}
