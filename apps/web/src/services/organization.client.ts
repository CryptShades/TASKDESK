import { createClient } from '@/lib/supabase/client';
import type { Database } from '../../supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface UpdateMemberData {
  role: UserRole;
}

export class OrganizationError extends Error {
  constructor(public code: string, message: string) {
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
    throw new OrganizationError('ORG_NOT_FOUND', 'Organization not found');
  }

  return org;
}

export async function getOrganizationMembers(orgId: string) {
  const supabase = createClient();
  const { data: members, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      role,
      avatar_url,
      created_at,
      updated_at
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new OrganizationError('MEMBERS_FETCH_FAILED', 'Failed to fetch organization members');
  }

  return members;
}

export async function updateMemberRole(userId: string, role: UserRole) {
  const supabase = createClient();
  const { data: member, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new OrganizationError('ROLE_UPDATE_FAILED', 'Failed to update member role');
  }

  return member;
}

export async function removeMember(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new OrganizationError('MEMBER_REMOVAL_FAILED', 'Failed to remove member');
  }
}