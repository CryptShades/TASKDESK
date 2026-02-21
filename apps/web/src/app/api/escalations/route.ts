import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { getEscalations } from '@/services/escalation.service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Role gate: founder only
    if (currentUser.role !== 'founder') {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Only founders can access the Escalations Center' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || undefined;

    const result = await getEscalations(currentUser.org_id, stage);

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