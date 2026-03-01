import React from "react";

import { Button } from "../primitives/Button";
import { Text } from "../primitives/Text";

export interface RegionFallbackProps {
  /** Which region crashed */
  region: "sidebar" | "editor" | "panel";
  /** Callback to retry/reset the region */
  onRetry?: () => void;
}

export function RegionFallback({
  region,
  onRetry,
}: RegionFallbackProps): JSX.Element {
  const regionLabels: Record<string, string> = {
    sidebar: "Sidebar",
    editor: "Editor",
    panel: "Panel",
  };
  const label = regionLabels[region] ?? region;

  return (
    <div
      data-testid={`region-fallback-${region}`}
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <Text size="small" color="muted">
        {label} encountered an error
      </Text>
      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onRetry}
          data-testid={`region-fallback-retry-${region}`}
        >
          Reload {label}
        </Button>
      )}
    </div>
  );
}
