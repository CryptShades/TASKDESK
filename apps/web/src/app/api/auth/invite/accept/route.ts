import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { acceptInvite } from '@/services/auth/server';
import { withErrorHandler } from '@/lib/api-handler';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { token, name, password } = body;

  if (!token || !name || !password) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'Token, name, and password are required' } },
      { status: 400 },
    );
  }

  const result = await acceptInvite({ token, name, password });

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 },
  );
});