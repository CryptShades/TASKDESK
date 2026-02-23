import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getMembers, getPendingInvites } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await getCurrentUser();

  // Fetch both members and pending invites
  const [members, invites] = await Promise.all([
    getMembers(currentUser.org_id),
    getPendingInvites(currentUser.org_id),
  ]);

  return NextResponse.json(
    { data: { members, invites }, error: null },
    { status: 200 }
  );
});
