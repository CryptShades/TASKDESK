import { createClient } from '@/lib/supabase/server';
import type { Database } from '../../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface UpdateMemberData {
  role: UserRole;
}

export class OrganizationError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'OrganizationError';
  }
}

export async function getOrganization(orgId: string) {
  const supabase = createClient();

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) {
    throw new OrganizationError(ErrorCode.ORG_NOT_FOUND, 'Organization not found');
  }

  return org;
}

export async function getMembers(orgId: string) {
  const supabase = createClient();

  const { data: members, error } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new OrganizationError(ErrorCode.MEMBERS_FETCH_FAILED, 'Failed to fetch organization members');
  }

  return members;
}

export async function getOrgMembers(orgId: string) {
  const supabase = createClient();

  const { data: members, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (error) {
    throw new OrganizationError(ErrorCode.MEMBERS_FETCH_FAILED, 'Failed to fetch organization members');
  }

  return members;
}

export async function updateMemberRole(userId: string, role: UserRole, actorId: string) {
  const supabase = createClient();

  // Verify actor is founder
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', actorId)
    .single();

  if (!actor || actor.role !== 'founder') {
    throw new OrganizationError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only founders can update member roles');
  }

  // Get target user to verify same org
  const { data: targetUser } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    throw new OrganizationError(ErrorCode.USER_NOT_FOUND, 'User not found');
  }

  // Update role
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new OrganizationError(ErrorCode.UPDATE_FAILED, 'Failed to update member role');
  }

  return updatedUser;
}

export async function removeMember(userId: string, actorId: string) {
  const supabase = createClient();

  // Verify actor is founder
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', actorId)
    .single();

  if (!actor || actor.role !== 'founder') {
    throw new OrganizationError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only founders can remove members');
  }

  // Cannot remove self
  if (userId === actorId) {
    throw new OrganizationError(ErrorCode.CANNOT_REMOVE_SELF, 'Cannot remove yourself from the organization');
  }

  // Get target user to verify same org
  const { data: targetUser } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single();

  if (!targetUser) {
    throw new OrganizationError(ErrorCode.USER_NOT_FOUND, 'User not found');
  }

  // Delete user record (this will cascade to auth.users due to RLS)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new OrganizationError(ErrorCode.DELETE_FAILED, 'Failed to remove member');
  }

  return { success: true };
}

export async function updateOrganizationName(orgId: string, name: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', orgId)
    .select()
    .single();

  if (error) {
    throw new OrganizationError(ErrorCode.ORG_UPDATE_FAILED, 'Failed to update organization name');
  }

  return data;
}

export async function updateUserProfile(userId: string, name: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new OrganizationError(ErrorCode.PROFILE_UPDATE_FAILED, 'Failed to update profile name');
  }

  return data;
}

export async function getPendingInvites(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new OrganizationError(ErrorCode.INVITES_FETCH_FAILED, 'Failed to fetch pending invitations');
  }

  return data;
}

export async function createInvitation(
  orgId: string,
  email: string,
  role: UserRole,
  invitedBy: string,
  tokenHash?: string,
  expiresAt?: Date,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id: orgId,
      email,
      role,
      invited_by: invitedBy,
      ...(tokenHash && { token_hash: tokenHash }),
      ...(expiresAt && { expires_at: expiresAt.toISOString() }),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new OrganizationError(ErrorCode.ALREADY_INVITED, 'An invitation has already been sent to this email');
    }
    throw new OrganizationError(ErrorCode.INVITE_CREATE_FAILED, 'Failed to create invitation record');
  }

  return data;
}

export async function revokeInvitation(inviteId: string, orgId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', inviteId)
    .eq('org_id', orgId);

  if (error) {
    throw new OrganizationError(ErrorCode.INVITE_REVOKE_FAILED, 'Failed to revoke invitation');
  }

  return { success: true };
}