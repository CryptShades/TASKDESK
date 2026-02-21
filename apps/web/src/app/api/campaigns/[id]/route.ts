import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth.service';
import { getCampaignById, updateCampaign, deleteCampaign } from '@/services/campaign.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getCampaignById(params.id, currentUser.org_id);

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const currentUser = await getCurrentUser();
    const result = await updateCampaign(params.id, body, currentUser.org_id, currentUser.id);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    const result = await deleteCampaign(params.id, currentUser.org_id, currentUser.id);

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