import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getOrganization } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await getCurrentUser();
  const result = await getOrganization(currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});
