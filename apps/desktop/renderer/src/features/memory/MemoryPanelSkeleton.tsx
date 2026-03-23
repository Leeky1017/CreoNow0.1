import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * MemoryPanelSkeleton mimics the memory panel layout during loading.
 *
 * Renders memory rule card skeletons with icon + title + snippet pattern.
 */
export function MemoryPanelSkeleton(): JSX.Element {
  return (
    <div data-testid="memory-panel-skeleton" className="p-3 space-y-3">
      {/* Scope tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={72} height={28} />
        <Skeleton variant="rectangular" width={72} height={28} />
        <Skeleton variant="rectangular" width={72} height={28} />
      </div>
      {/* Memory rule card skeletons */}
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-start gap-2.5 p-2.5">
          <Skeleton variant="circular" width={24} height={24} />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" width="55%" height="13px" />
            <Skeleton variant="text" width="80%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}
