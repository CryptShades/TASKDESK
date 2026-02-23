// apps/web/src/app/api/auth/reset-password/route.ts
// Reset password endpoint - updates password with validation

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseServer = (authToken: string) =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json();

    if (!password || !token) {
      return NextResponse.json(
        { error: 'Password and token are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number',
        },
        { status: 400 }
      );
    }

    // Use token to authenticate and update password
    const supabase = supabaseServer(token);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to reset password' },
        { status: 400 }
      );
    }

    // Sign out user from all devices after password reset (security best practice)
    await supabase.auth.signOut({ scope: 'global' });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successful. Please log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}