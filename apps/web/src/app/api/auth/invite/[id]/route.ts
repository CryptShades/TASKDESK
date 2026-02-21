import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { revokeInvitation } from '@/services/organization.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    // Auth check: only founder/manager can revoke
    if (!['founder', 'manager'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await revokeInvitation(params.id, currentUser.org_id);

    return NextResponse.json({ data: result, error: null });
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
