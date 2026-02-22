import { NextRequest, NextResponse } from 'next/server';
import { ErrorCode } from '@taskdesk/types';
import { signUp } from '@/services/auth/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, orgName } = body;

    if (!name || !email || !password || !orgName) {
      return NextResponse.json(
        { data: null, error: { code: ErrorCode.MISSING_FIELDS, message: 'All fields are required' } },
        { status: 400 }
      );
    }

    const result = await signUp({ name, email, password, orgName });

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