import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * CharacterPanelSkeleton mimics character card list during loading.
 */
export function CharacterPanelSkeleton(): JSX.Element {
  return (
    <div data-testid="character-panel-skeleton" className="flex flex-col gap-3 p-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="text" width="60%" height="14px" />
            <Skeleton variant="text" width="80%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}
