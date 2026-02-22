import { NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getDependencyAlerts } from '@/services/dashboard/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const alerts = await getDependencyAlerts(user.org_id);
    return NextResponse.json({ data: alerts, error: null });
  } catch (error: any) {
    const status = error.code === ErrorCode.NO_USER ? 401 : 500;
    return NextResponse.json(
      { data: null, error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message } },
      { status }
    );
  }
}
