import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getFounderDashboard } from '@/services/dashboard/server';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getFounderDashboard(currentUser.org_id);

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