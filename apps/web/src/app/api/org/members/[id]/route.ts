import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateMemberRole, removeMember } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

const VALID_USER_ROLES = ['founder', 'manager', 'member'] as const;
type UserRole = typeof VALID_USER_ROLES[number];

type Params = { params: { id: string } };

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const body = await request.json();
  const { role } = body;

  if (!role) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_ROLE, message: 'Role is required' } },
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
  const result = await updateMemberRole(params.id, role as UserRole, currentUser.id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await removeMember(params.id, currentUser.id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});
