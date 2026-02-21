import { MyTasksSkeleton } from '@/components/layout/shared-skeletons';

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-48 bg-surface-raised animate-pulse rounded-md mb-2" />
        <div className="h-4 w-96 bg-surface-raised animate-pulse rounded-md" />
      </div>
      <MyTasksSkeleton />
    </div>
  );
}
