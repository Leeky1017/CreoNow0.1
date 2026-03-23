import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * SearchPanelSkeleton mimics the search results layout during loading.
 *
 * Matches the document result item structure: icon + title + snippet.
 */
export function SearchPanelSkeleton(): JSX.Element {
  return (
    <div data-testid="search-panel-skeleton" className="p-4 space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton variant="rectangular" width={32} height={32} />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="text" width="60%" height="14px" />
            <Skeleton variant="text" width="90%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}
