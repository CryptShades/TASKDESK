import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { revokeInvitation } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

type Params = { params: { id: string } };

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();

  // Auth check: only founder/manager can revoke
  if (!['founder', 'manager'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const result = await revokeInvitation(params.id, currentUser.org_id);

  return NextResponse.json({ data: result, error: null });
});
