import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getTaskById } from '@/services/task.service';

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
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: error.code === ErrorCode.TASK_NOT_FOUND ? 404 : 500 }
    );
  }
}
