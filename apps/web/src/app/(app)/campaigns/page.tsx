import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/services/auth.service';
import { getCampaigns } from '@/services/campaign.service';
import { CampaignListTable } from '@/components/campaigns/campaign-list-table';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  const campaigns = await getCampaigns(user.org_id);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Track all active campaigns and their risk status.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          + New Campaign
        </Link>
      </div>

      <CampaignListTable initialData={campaigns} />
    </div>
  );
}
