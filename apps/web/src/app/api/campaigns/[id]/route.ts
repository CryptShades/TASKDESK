import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getCampaignById, updateCampaign, deleteCampaign } from '@/services/campaign.service';
import { withErrorHandler } from '@/lib/api-handler';

type Params = { params: { id: string } };

export const GET = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await getCampaignById(params.id, currentUser.org_id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const PATCH = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const body = await request.json();
  const currentUser = await getCurrentUser();
  const result = await updateCampaign(params.id, body, currentUser.org_id, currentUser.id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: Params) => {
  const currentUser = await getCurrentUser();
  const result = await deleteCampaign(params.id, currentUser.org_id, currentUser.id);

  return NextResponse.json(
    { data: result, error: null },
    { status: 200 }
  );
});
