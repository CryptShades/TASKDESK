import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getEscalations, VALID_ESCALATION_STAGES, type EscalationStage } from '@/services/escalation.service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Role gate: founder only
    if (currentUser.role !== 'founder') {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.FORBIDDEN, message: 'Only founders can access the Escalations Center' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawStage = searchParams.get('stage');

    if (rawStage !== null && !(VALID_ESCALATION_STAGES as readonly string[]).includes(rawStage)) {
      return NextResponse.json(
        { error: 'Invalid stage parameter. Must be 1, 2, or 3.' },
        { status: 400 }
      );
    }

    const stage = (rawStage ?? undefined) as EscalationStage | undefined;
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