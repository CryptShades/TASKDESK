import { Skeleton } from '@/components/ui/skeleton';

export function CampaignListSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex px-6 py-4 gap-4 items-center">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex px-6 py-5 gap-4 items-center">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
