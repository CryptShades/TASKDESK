import { createClient } from '@/lib/supabase/client';
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

/**
 * Fetches the organization record for the given org ID.
 * @security Open to any authenticated org member. Access is restricted to the
 * caller's own organization via Row-Level Security on the organizations table.
 * No privileged role required.
 */
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

/**
 * Fetches all members (users) in the given organization.
 * @security Open to any authenticated org member. RLS restricts results to
 * users within the caller's own organization. No privileged role required.
 */
export async function getOrganizationMembers(orgId: string) {
  const supabase = createClient();
  const { data: members, error } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new OrganizationError(ErrorCode.MEMBERS_FETCH_FAILED, 'Failed to fetch organization members');
  }

  return members;
}

/**
 * Updates the role of an organization member.
 * @security Requires founder role. Enforced server-side via the
 * PATCH /api/org/members/[id] route, which verifies the caller is a founder
 * before applying the change. This function does NOT call Supabase directly —
 * it delegates to the API route to guarantee server-side authorization.
 * Do NOT call this outside an authenticated founder session.
 */
export async function updateMemberRole(userId: string, role: UserRole) {
  const res = await fetch(`/api/org/members/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new OrganizationError(ErrorCode.FORBIDDEN, 'Only founders can update member roles');
  }

  if (!res.ok) {
    throw new OrganizationError(ErrorCode.ROLE_UPDATE_FAILED, 'Failed to update member role');
  }

  const json = await res.json();
  return json.data;
}

/**
 * Removes a member from the organization.
 * @security Requires founder role. Enforced server-side via the
 * DELETE /api/org/members/[id] route, which verifies the caller is a founder
 * and prevents self-removal before executing the delete. This function does NOT
 * call Supabase directly — it delegates to the API route to guarantee
 * server-side authorization. Do NOT call this outside an authenticated founder session.
 */
export async function removeMember(userId: string) {
  const res = await fetch(`/api/org/members/${userId}`, {
    method: 'DELETE',
  });

  if (res.status === 401 || res.status === 403) {
    throw new OrganizationError(ErrorCode.FORBIDDEN, 'Only founders can remove members');
  }

  if (!res.ok) {
    throw new OrganizationError(ErrorCode.MEMBER_REMOVAL_FAILED, 'Failed to remove member');
  }
}
