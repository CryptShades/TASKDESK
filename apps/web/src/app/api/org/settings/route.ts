import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateOrganizationName } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can update organization settings' }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
  }

  const updatedOrg = await updateOrganizationName(user.org_id, name);
  return NextResponse.json({ data: updatedOrg });
});
