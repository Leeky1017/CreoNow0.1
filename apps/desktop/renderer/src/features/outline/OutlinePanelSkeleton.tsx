import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * OutlinePanelSkeleton mimics the outline tree layout during loading.
 *
 * Renders indented heading-level rows matching the outline hierarchy.
 */
export function OutlinePanelSkeleton(): JSX.Element {
  const indents = [0, 0, 16, 16, 32, 0, 16];
  return (
    <div data-testid="outline-panel-skeleton" className="p-3 space-y-2">
      {indents.map((indent, i) => (
        <div
          key={i}
          className="flex items-center gap-2"
          style={{ paddingLeft: `${indent}px` }}
        >
          <Skeleton variant="rectangular" width={14} height={14} />
          <Skeleton
            variant="text"
            width={`${50 + (i % 3) * 15}%`}
            height="14px"
          />
        </div>
      ))}
    </div>
  );
}
