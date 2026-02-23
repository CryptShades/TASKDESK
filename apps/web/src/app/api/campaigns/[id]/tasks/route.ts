import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getTasksByCampaign, createTask } from '@/services/task.service';
import { withErrorHandler } from '@/lib/api-handler';

const VALID_RISK_FLAGS = ['soft_risk', 'hard_risk'] as const;
type TaskRiskFlag = typeof VALID_RISK_FLAGS[number];

type Params = { params: { id: string } };

export const GET = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await getTasksByCampaign(params.id, currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const POST = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const body = await request.json();
  const { title, owner_id, due_date, dependency_id, risk_flag } = body;

  if (!title || !owner_id || !due_date) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'Title, owner ID, and due date are required' } },
      { status: 400 }
    );
  }

  if (risk_flag && !['soft_risk', 'hard_risk'].includes(risk_flag)) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.INVALID_RISK_FLAG, message: 'risk_flag must be soft_risk or hard_risk' } },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUser();
  const result = await createTask(
    { title, owner_id, due_date, dependency_id, risk_flag: risk_flag as TaskRiskFlag | undefined },
    params.id,
    currentUser.org_id,
    currentUser.id
  );

  return NextResponse.json(
    { data: result, error: null },
    { status: 201 }
  );
});
