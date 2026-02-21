import { Skeleton } from '@/components/ui/skeleton';

export function TaskDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Left Column */}
        <div className="flex-1 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <Skeleton className="h-4 w-20" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        {/* Right Column */}
        <div className="lg:w-80 xl:w-96 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyTasksSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map(section => (
        <div key={section} className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="rounded-lg border border-border bg-surface overflow-hidden divide-y divide-border">
            {[1, 2].map(row => (
              <div key={row} className="flex p-4 gap-4 items-center">
                <Skeleton className="h-10 w-44" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface divide-y divide-border overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          <Skeleton className="h-2 w-2 rounded-full mt-2" />
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="divide-y divide-border">
          <div className="bg-surface-raised h-10 px-6 flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex px-6 py-4 gap-4 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
