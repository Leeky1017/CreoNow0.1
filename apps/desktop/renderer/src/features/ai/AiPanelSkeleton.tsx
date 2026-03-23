import { Skeleton } from "../../components/primitives/Skeleton";

/**
 * AiPanelSkeleton mimics the AI chat message layout during loading.
 *
 * Renders message bubble skeletons with rounded corners and multi-line text.
 */
export function AiPanelSkeleton(): JSX.Element {
  return (
    <div data-testid="ai-panel-skeleton" className="p-3 space-y-4">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <Skeleton variant="rectangular" width="70%" height={48} />
      </div>
      {/* AI response skeleton */}
      <div className="space-y-1.5">
        <Skeleton variant="text" width="90%" height="13px" />
        <Skeleton variant="text" width="80%" height="13px" />
        <Skeleton variant="text" width="60%" height="13px" />
      </div>
      {/* Second user message skeleton */}
      <div className="flex justify-end">
        <Skeleton variant="rectangular" width="50%" height={36} />
      </div>
      {/* Second AI response skeleton */}
      <div className="space-y-1.5">
        <Skeleton variant="text" width="85%" height="13px" />
        <Skeleton variant="text" width="70%" height="13px" />
      </div>
    </div>
  );
}
