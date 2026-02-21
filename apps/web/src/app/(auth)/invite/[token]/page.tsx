import { AlertCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { InviteForm } from './invite-form';

interface InviteData {
  email: string;
  orgName: string;
}

interface PageProps {
  params: { token: string };
  searchParams: { email?: string; org?: string };
}

/**
 * Attempt to look up invite metadata using the admin client.
 * Queries auth.users for a pending invite matching the given email.
 * Falls back to the search param values if admin lookup fails.
 */
async function resolveInviteData(
  emailHint: string,
  orgHint: string | undefined
): Promise<InviteData | null> {
  try {
    const admin = createAdminClient();

    // Use listUsers and filter for the pending invite by email.
    // The admin API v2 does not support getUserByEmail, so we paginate and match.
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
      // Admin lookup failed — fall through to hint-only path
      return { email: emailHint, orgName: orgHint ?? 'your workspace' };
    }

    const user = data.users.find((u) => u.email === emailHint);

    // Valid pending invite: has invited_at, email not yet confirmed
    if (!user || !user.invited_at || user.email_confirmed_at) {
      return null;
    }

    const orgName = orgHint ?? (user.user_metadata?.org_name as string | undefined) ?? 'your workspace';
    return { email: user.email!, orgName };
  } catch {
    // Admin client unavailable (no service role key) — trust the hint data
    return { email: emailHint, orgName: orgHint ?? 'your workspace' };
  }
}

function InvalidInvite() {
  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-risk-hard-bg">
          <AlertCircle className="h-6 w-6 text-risk-hard" aria-hidden="true" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Invitation invalid</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          This invitation is invalid or has expired. Contact your workspace admin to
          request a new invite.
        </p>
      </div>
    </div>
  );
}

export default async function InviteAcceptPage({ params, searchParams }: PageProps) {
  const { token } = params;

  // Token must be present in the path
  if (!token) {
    return <InvalidInvite />;
  }

  // Email must be present — invite URLs are constructed as /invite/[token]?email=...&org=...
  const emailHint = searchParams.email;
  if (!emailHint) {
    return <InvalidInvite />;
  }

  const inviteData = await resolveInviteData(emailHint, searchParams.org);

  if (!inviteData) {
    return <InvalidInvite />;
  }

  return (
    <InviteForm
      token={token}
      email={inviteData.email}
      orgName={inviteData.orgName}
    />
  );
}
