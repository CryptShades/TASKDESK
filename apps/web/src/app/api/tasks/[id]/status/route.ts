import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { updateTaskStatus } from '@/services/task.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_STATUS', message: 'Status is required' } },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const result = await updateTaskStatus(params.id, status, currentUser.id, currentUser.org_id);

    return NextResponse.json(
      { data: result, error: null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}