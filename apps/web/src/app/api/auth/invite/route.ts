import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { inviteMember, getCurrentUser } from '@/services/auth/server';
import { createInvitation } from '@/services/organization/server';

const VALID_USER_ROLES = ['founder', 'manager', 'member'] as const;
type UserRole = typeof VALID_USER_ROLES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'Email and role are required' } },
        { status: 400 }
      );
    }

    if (!(VALID_USER_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.INVALID_ROLE, message: 'Role must be founder, manager, or member' } },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    
    // 1. Create Supabase Auth invite
    const authResult = await inviteMember({ email, role, orgId: currentUser.org_id });
    
    // 2. Track in our invitations table
    await createInvitation(currentUser.org_id, email, role, currentUser.id);

    return NextResponse.json(
      { data: authResult, error: null },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}