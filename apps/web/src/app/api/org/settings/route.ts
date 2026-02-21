import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { updateOrganizationName } from '@/services/organization.service';

export async function PATCH(request: Request) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
