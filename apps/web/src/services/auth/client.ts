import { createClient } from '@/lib/supabase/client';
import type { Database } from '../../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

type User = Database['public']['Tables']['users']['Row'];

export class AuthError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function getCurrentUser(): Promise<User> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthError(ErrorCode.NOT_AUTHENTICATED, 'User is not authenticated');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new AuthError(ErrorCode.USER_NOT_FOUND, 'User profile not found');
  }

  return userData;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(ErrorCode.SIGN_OUT_FAILED, 'Failed to sign out');
  }
}