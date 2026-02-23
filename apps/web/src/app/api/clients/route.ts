import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getClients, createClient } from '@/services/client.service';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await getCurrentUser();
  const result = await getClients(currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_NAME, message: 'Client name is required' } },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUser();
  const result = await createClient({ name }, currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 201 }
  );
});
