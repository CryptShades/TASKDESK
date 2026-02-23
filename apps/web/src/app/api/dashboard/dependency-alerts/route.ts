import { NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getDependencyAlerts } from '@/services/dashboard/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const alerts = await getDependencyAlerts(user.org_id);
    return NextResponse.json({ data: alerts, error: null });
  } catch (error: any) {
    if (error.code === ErrorCode.NO_USER || error.code === ErrorCode.NOT_AUTHENTICATED) {
      return NextResponse.json(
        { data: null, error: { code: error.code, message: 'Not authenticated.' } },
        { status: 401 },
      );
    }
    logger.error('GET /api/dashboard/dependency-alerts failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } },
      { status: 500 },
    );
  }
}
