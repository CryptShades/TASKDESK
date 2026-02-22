import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateMemberRole, removeMember } from '@/services/organization/server';

const VALID_USER_ROLES = ['founder', 'manager', 'member'] as const;
type UserRole = typeof VALID_USER_ROLES[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const result = await removeMember(params.id, currentUser.id);

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