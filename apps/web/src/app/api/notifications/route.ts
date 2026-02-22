import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getNotifications, registerPushToken } from '@/services/notification.service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getNotifications(currentUser.id);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.MISSING_TOKEN, message: 'Push token is required' } },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const result = await registerPushToken(currentUser.id, token);

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