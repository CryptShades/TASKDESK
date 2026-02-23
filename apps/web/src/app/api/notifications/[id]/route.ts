import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { markAsRead } from '@/services/notification.service';
import { withErrorHandler } from '@/lib/api-handler';

type Params = { params: { id: string } };

// Backward-compatible endpoint for older clients that PATCH /api/notifications/:id.
export const PATCH = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await markAsRead(params.id, currentUser.id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});
