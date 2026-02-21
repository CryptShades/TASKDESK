import { NotificationsSkeleton } from '@/components/layout/shared-skeletons';

export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-surface-raised animate-pulse rounded-md" />
          <div className="h-4 w-96 bg-surface-raised animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-32 bg-surface-raised animate-pulse rounded-md" />
      </div>
      <NotificationsSkeleton />
    </div>
  );
}
