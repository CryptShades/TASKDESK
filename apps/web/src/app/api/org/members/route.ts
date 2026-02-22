import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getMembers, getPendingInvites } from '@/services/organization/server';

export async function GET(request: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}