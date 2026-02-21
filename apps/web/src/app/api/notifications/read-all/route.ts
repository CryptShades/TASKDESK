import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { markAllAsRead } from '@/services/notification.service';

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    await markAllAsRead(currentUser.id);

    return NextResponse.json(
      { data: { success: true }, error: null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
