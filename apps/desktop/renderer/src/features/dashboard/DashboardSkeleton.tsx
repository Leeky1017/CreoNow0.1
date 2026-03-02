import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * DashboardSkeleton mimics the Dashboard layout during loading.
 *
 * Why: Provides spatial continuity instead of a centered spinner,
 * matching the hero card + project grid structure.
 */
export function DashboardSkeleton(): JSX.Element {
  return (
    <div data-testid="dashboard-skeleton" className="flex-1 p-6 space-y-6">
      {/* Hero card skeleton */}
      <Skeleton variant="rectangular" width="100%" height={280} />

      {/* Section title skeleton */}
      <Skeleton variant="text" width="120px" height="20px" />

      {/* Project cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={200} />
        ))}
      </div>
    </div>
  );
}
