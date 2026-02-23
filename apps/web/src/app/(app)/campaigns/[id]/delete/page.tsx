import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth/server';
import { getCampaignById } from '@/services/campaign.service';
import { DeleteCampaignForm } from './delete-campaign-form';

interface PageProps {
  params: { id: string };
}

export default async function DeleteCampaignPage({ params }: PageProps) {
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    currentUser = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  if (currentUser.role !== 'founder') {
    redirect(`/campaigns/${params.id}`);
  }

  let campaign: Awaited<ReturnType<typeof getCampaignById>>;
  try {
    campaign = await getCampaignById(params.id, currentUser.org_id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-risk-hard font-semibold">Danger Zone</p>
        <h1 className="text-2xl font-semibold text-foreground">Delete Campaign</h1>
        <p className="text-sm text-foreground-muted">
          You are about to permanently delete <strong>{campaign.name}</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-risk-hard-border bg-risk-hard-bg p-5 space-y-4">
        <p className="text-sm text-risk-hard">
          This action is irreversible. All tasks and related activity under this campaign will be removed.
        </p>
        <DeleteCampaignForm campaignId={campaign.id} />
      </div>

      <div>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-sm text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Cancel and return to campaign
        </Link>
      </div>
    </div>
  );
}
