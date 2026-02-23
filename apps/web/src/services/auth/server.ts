import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '../../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  orgName: string;
}

export interface InviteData {
  email: string;
  role: UserRole;
  orgId: string;
}

export interface AcceptInviteData {
  token: string;
  name: string;
  password: string;
}

export class AuthError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function signUp(data: SignUpData) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  // Start transaction by creating org first using admin client
  const { data: org, error: orgError } = await adminSupabase
    .from('organizations')
    .insert({ name: data.orgName })
    .select()
    .single();

  if (orgError) {
    throw new AuthError(ErrorCode.ORG_CREATE_FAILED, 'Failed to create organization');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (authError) {
    // Clean up org if auth fails
    await adminSupabase.from('organizations').delete().eq('id', org.id);
    throw new AuthError(ErrorCode.AUTH_SIGNUP_FAILED, authError.message);
  }

  if (!authData.user) {
    await adminSupabase.from('organizations').delete().eq('id', org.id);
    throw new AuthError(ErrorCode.AUTH_SIGNUP_FAILED, 'No user returned from signup');
  }

  // Auto-confirm the user email for development
  if (authData.user && !authData.session) {
    await adminSupabase.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
    });
  }

  // Create user record using admin client
  const { data: user, error: userError } = await adminSupabase
    .from('users')
    .insert({
      id: authData.user.id,
      org_id: org.id,
      name: data.name,
      email: data.email,
      role: 'founder',
    })
    .select()
    .single();

  if (userError) {
    // Clean up
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    await adminSupabase.from('organizations').delete().eq('id', org.id);
    throw new AuthError(ErrorCode.USER_CREATE_FAILED, 'Failed to create user record');
  }

  return { user, org, session: authData.session };
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(ErrorCode.SIGNIN_FAILED, error.message);
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(ErrorCode.SIGNOUT_FAILED, error.message);
  }
}

export async function getSession() {
  const supabase = createClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw new AuthError(ErrorCode.SESSION_ERROR, error.message);
  }

  return session;
}

export async function getCurrentUser() {
  const supabase = createClient();

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new AuthError(ErrorCode.AUTH_ERROR, authError.message);
  }

  if (!authUser) {
    throw new AuthError(ErrorCode.NO_USER, 'No authenticated user');
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError) {
    throw new AuthError(ErrorCode.USER_NOT_FOUND, 'User record not found');
  }

  return user;
}

export async function inviteMember(data: InviteData) {
  const supabase = createClient();

  // Verify actor has permission (founder or manager)
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single();

  if (!actor || !['founder', 'manager'].includes(actor.role)) {
    throw new AuthError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only founders and managers can invite members');
  }

  // Generate invite token (using Supabase auth admin)
  const { data: inviteData, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: data.email,
    options: {
      data: {
        org_id: data.orgId,
        role: data.role,
        invited_by: (await supabase.auth.getUser()).data.user!.id,
      },
    },
  });

  if (error) {
    throw new AuthError(ErrorCode.INVITE_FAILED, error.message);
  }

  return {
    token: inviteData.properties?.hashed_token,
    email: data.email,
  };
}

export async function acceptInvite(data: AcceptInviteData) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  // --- Pre-flight: look up our invitation record by token_hash ---
  // Enforces expiry and attempt throttling before hitting Supabase Auth
  const { data: invite } = await adminSupabase
    .from('invitations')
    .select('id, expires_at, revoked_at, accepted_at, attempt_count')
    .eq('token_hash', data.token)
    .single();

  if (invite) {
    if (invite.revoked_at) {
      throw new AuthError(ErrorCode.INVITE_REVOKED, 'This invitation has been revoked');
    }
    if (invite.accepted_at) {
      throw new AuthError(ErrorCode.INVITE_ALREADY_USED, 'This invitation has already been used');
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new AuthError(ErrorCode.INVITE_EXPIRED, 'This invitation has expired');
    }
  }

  // Verify token with Supabase Auth
  const { data: inviteData, error: inviteError } = await supabase.auth.verifyOtp({
    token_hash: data.token,
    type: 'invite',
  });

  if (inviteError) {
    // Track failed attempt; auto-revoke after 3 failures
    if (invite) {
      const newCount = (invite.attempt_count ?? 0) + 1;
      const updates: Record<string, unknown> = { attempt_count: newCount };
      if (newCount >= 3) {
        updates.revoked_at = new Date().toISOString();
      }
      await adminSupabase.from('invitations').update(updates).eq('id', invite.id);
    }
    throw new AuthError(ErrorCode.INVALID_TOKEN, 'Invalid or expired invite token');
  }

  if (!inviteData.user) {
    throw new AuthError(ErrorCode.INVALID_TOKEN, 'No user data in token');
  }

  // Get org_id and role from user metadata
  const orgId = inviteData.user.user_metadata?.org_id;
  const role = inviteData.user.user_metadata?.role as UserRole;

  if (!orgId || !role) {
    throw new AuthError(ErrorCode.INVALID_TOKEN, 'Missing organization or role data');
  }

  // Update auth user with password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.password,
  });

  if (updateError) {
    throw new AuthError(ErrorCode.PASSWORD_UPDATE_FAILED, updateError.message);
  }

  // Create user record
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: inviteData.user.id,
      org_id: orgId,
      name: data.name,
      email: inviteData.user.email!,
      role,
    })
    .select()
    .single();

  if (userError) {
    throw new AuthError(ErrorCode.USER_CREATE_FAILED, 'Failed to create user record');
  }

  // Mark invitation as accepted
  if (invite) {
    await adminSupabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  return user;
}