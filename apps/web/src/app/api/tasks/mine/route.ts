import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getMyTasks } from '@/services/task.service';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const currentUser = await getCurrentUser();
  const result = await getMyTasks(currentUser.id, currentUser.org_id);
  return NextResponse.json({ data: result, error: null }, { status: 200 });
});
