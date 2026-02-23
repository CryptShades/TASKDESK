import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { markAllAsRead } from '@/services/notification.service';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await getCurrentUser();
  await markAllAsRead(currentUser.id);

  return NextResponse.json(
    { data: { success: true }, error: null },
    { status: 200 }
  );
});
