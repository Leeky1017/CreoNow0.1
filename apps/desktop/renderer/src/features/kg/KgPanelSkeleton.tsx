import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * KgPanelSkeleton mimics the knowledge graph list view layout during loading.
 *
 * Renders entity card and relation card skeletons matching the real component.
 */
export function KgPanelSkeleton(): JSX.Element {
  return (
    <div data-testid="kg-panel-skeleton" className="p-3 space-y-3">
      {/* Section header */}
      <Skeleton variant="text" width="20%" height="11px" />
      {/* Entity cards */}
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-separator)] p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={24} height={24} />
            <Skeleton variant="text" width="50%" height="14px" />
          </div>
          <Skeleton variant="text" width="80%" height="12px" />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={48} height={18} />
            <Skeleton variant="rectangular" width={48} height={18} />
          </div>
        </div>
      ))}
      {/* Relations section header */}
      <Skeleton variant="text" width="20%" height="11px" />
      {/* Relation cards */}
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={`rel-${i}`}
          className="rounded-lg border border-[var(--color-separator)] p-2 flex items-center gap-2"
        >
          <Skeleton variant="text" width="25%" height="12px" />
          <Skeleton variant="rectangular" width={20} height={12} />
          <Skeleton variant="text" width="25%" height="12px" />
        </div>
      ))}
    </div>
  );
}
