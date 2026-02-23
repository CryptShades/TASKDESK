import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { updateUserProfile } from '@/services/organization/server';
import { withErrorHandler } from '@/lib/api-handler';

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const updatedUser = await updateUserProfile(user.id, name);
  return NextResponse.json({ data: updatedUser });
});
