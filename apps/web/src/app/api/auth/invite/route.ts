import { NextRequest, NextResponse } from 'next/server';
import { inviteMember, getCurrentUser } from '@/services/auth.service';
import { createInvitation } from '@/services/organization.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_FIELDS', message: 'Email and role are required' } },
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