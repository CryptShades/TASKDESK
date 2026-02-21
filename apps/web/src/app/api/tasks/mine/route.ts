import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { getMyTasks } from '@/services/task.service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getMyTasks(currentUser.id, currentUser.org_id);

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