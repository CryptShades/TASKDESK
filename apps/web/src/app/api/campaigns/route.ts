import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { getCurrentUser } from '@/services/auth/server';
import { getCampaigns, createCampaign } from '@/services/campaign.service';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const currentUser = await getCurrentUser();
  const result = await getCampaigns(currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { client_id, name, launch_date } = body;

  if (!client_id || !name || !launch_date) {
    return NextResponse.json(
      { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'Client ID, name, and launch date are required' } },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUser();
  const result = await createCampaign(
    { client_id, name, launch_date },
    currentUser.org_id,
    currentUser.id
  );

  return NextResponse.json(
    { data: result, error: null },
    { status: 201 }
  );
});
