import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * FileTreeSkeleton mimics the file tree layout during loading.
 *
 * Renders indented rows of varying widths to approximate a folder/file hierarchy.
 */
export function FileTreeSkeleton(): JSX.Element {
  return (
    <div data-testid="file-tree-skeleton" className="p-3 space-y-2.5">
      <Skeleton variant="text" width="45%" height="14px" />
      <div className="pl-4 space-y-2.5">
        <Skeleton variant="text" width="70%" height="13px" />
        <Skeleton variant="text" width="55%" height="13px" />
      </div>
      <Skeleton variant="text" width="40%" height="14px" />
      <div className="pl-4 space-y-2.5">
        <Skeleton variant="text" width="60%" height="13px" />
      </div>
    </div>
  );
}
