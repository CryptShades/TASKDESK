import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { inviteMember, getCurrentUser } from '@/services/auth/server';
import { createInvitation } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

const VALID_USER_ROLES = ['founder', 'manager', 'member'] as const;
type UserRole = typeof VALID_USER_ROLES[number];

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'Email and role are required' } },
      { status: 400 },
    );
  }

  if (!(VALID_USER_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.INVALID_ROLE, message: 'Role must be founder, manager, or member' } },
      { status: 400 },
    );
  }

  const currentUser = await getCurrentUser();

  // 1. Create Supabase Auth invite and capture the hashed token
  const authResult = await inviteMember({ email, role: role as UserRole, orgId: currentUser.org_id });

  // 2. Track in our invitations table with token_hash and 72h expiry
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await createInvitation(
    currentUser.org_id,
    email,
    role as UserRole,
    currentUser.id,
    authResult.token,
    expiresAt,
  );

  return NextResponse.json(
    { data: authResult, error: null },
    { status: 201 },
  );
});
