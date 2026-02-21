import { Skeleton } from '@/components/ui/skeleton';

export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CampaignRiskTableSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex px-6 py-4 gap-4">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DependencyAlertFeedSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <DashboardMetricsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr]">
        <CampaignRiskTableSkeleton />
        <DependencyAlertFeedSkeleton />
      </div>
    </div>
  );
}
