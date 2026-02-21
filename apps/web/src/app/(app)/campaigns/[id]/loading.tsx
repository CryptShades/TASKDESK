import { CampaignDetailSkeleton } from '@/components/campaigns/campaign-skeletons';

export default function Loading() {
  return (
    <div className="p-6">
      <CampaignDetailSkeleton />
    </div>
  );
}
