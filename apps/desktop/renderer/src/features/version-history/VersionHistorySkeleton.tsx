import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * VersionHistorySkeleton mimics the version history timeline layout during loading.
 *
 * Renders time group headers and version card skeletons matching the real component.
 */
export function VersionHistorySkeleton(): JSX.Element {
  return (
    <div data-testid="version-history-skeleton" className="p-3 space-y-3">
      {/* Time group header */}
      <Skeleton variant="text" width="30%" height="10px" />
      {/* Version cards */}
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-separator)] p-3 space-y-2"
        >
          <div className="flex justify-between items-center">
            <Skeleton variant="text" width="40%" height="12px" />
            <Skeleton variant="rectangular" width={48} height={18} />
          </div>
          <Skeleton variant="text" width="50%" height="11px" />
          <Skeleton variant="text" width="90%" height="13px" />
          <Skeleton variant="text" width="70%" height="13px" />
        </div>
      ))}
      {/* Second time group */}
      <Skeleton variant="text" width="25%" height="10px" />
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={`g2-${i}`}
          className="rounded-lg border border-[var(--color-separator)] p-3 space-y-2"
        >
          <div className="flex justify-between items-center">
            <Skeleton variant="text" width="35%" height="12px" />
            <Skeleton variant="rectangular" width={48} height={18} />
          </div>
          <Skeleton variant="text" width="55%" height="11px" />
          <Skeleton variant="text" width="80%" height="13px" />
        </div>
      ))}
    </div>
  );
}
