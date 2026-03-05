import { useTranslation } from "react-i18next";
import { Button } from "../primitives/Button";
import { Text } from "../primitives/Text";

const regionLabelKeys: Record<string, string> = {
  sidebar: "patterns.regionFallback.sidebar",
  editor: "patterns.regionFallback.editor",
  panel: "patterns.regionFallback.panel",
};

export interface RegionFallbackProps {
  /** Which region crashed */
  region: "sidebar" | "editor" | "panel";
  /** Optional error message for debugging context */
  errorMessage?: string;
  /** Callback to retry/reset the region */
  onRetry?: () => void;
}

export function RegionFallback({
  region,
  errorMessage,
  onRetry,
}: RegionFallbackProps): JSX.Element {
  const { t } = useTranslation();
  const label = t(regionLabelKeys[region] ?? region);

  return (
    <div
      data-testid={`region-fallback-${region}`}
      className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <Text size="small" color="muted">
        {t("patterns.regionFallback.errorMessage", { label })}
      </Text>
      {errorMessage && (
        <Text size="small" color="placeholder" className="max-w-xs break-words">
          {errorMessage}
        </Text>
      )}
      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onRetry}
          data-testid={`region-fallback-retry-${region}`}
        >
          {t("patterns.regionFallback.reloadLabel", { label })}
        </Button>
      )}
    </div>
  );
}
