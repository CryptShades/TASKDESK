import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateTaskStatus } from '@/services/task.service';
import { withErrorHandler } from '@/lib/api-handler';

const VALID_TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const;
type TaskStatus = typeof VALID_TASK_STATUSES[number];

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
) => {
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_STATUS, message: 'Status is required' } },
      { status: 400 },
    );
  }

  if (!(VALID_TASK_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.INVALID_STATUS, message: 'Status must be not_started, in_progress, completed, or blocked' } },
      { status: 400 },
    );
  }

  const currentUser = await getCurrentUser();
  const result = await updateTaskStatus(params.id, status as TaskStatus, currentUser.id, currentUser.org_id);

  return NextResponse.json({ data: result, error: null }, { status: 200 });
});
