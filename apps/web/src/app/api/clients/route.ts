import { ErrorCode } from '@taskdesk/types';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/services/auth/server';
import { getClients, createClient } from '@/services/client.service';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const result = await getClients(currentUser.org_id);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.MISSING_NAME, message: 'Client name is required' } },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();
    const result = await createClient({ name }, currentUser.org_id);

    return NextResponse.json(
      { data: result, error: null },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}