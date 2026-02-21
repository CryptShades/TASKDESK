import { NextRequest, NextResponse } from 'next/server';
import { acceptInvite } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { data: null, error: { code: 'MISSING_FIELDS', message: 'Token, name, and password are required' } },
        { status: 400 }
      );
    }

    const result = await acceptInvite({ token, name, password });

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