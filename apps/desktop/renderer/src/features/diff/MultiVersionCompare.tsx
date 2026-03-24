import React from "react";
import { VersionPane, type VersionContent } from "./VersionPane";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
type MultiVersionCompareProps = {
  /** Versions to compare (2-4) */
  versions: VersionContent[];
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Panel width */
  width?: number | string;
  /** Panel height */
  height?: number | string;
  /** Enable synchronized scrolling */
  syncScroll?: boolean;
};

/**
 * MultiVersionCompare displays 2-4 versions in a grid layout.
 *
 * Layout:
 * - 2 versions: 1x2 horizontal
 * - 3 versions: 2+1 (2 on top, 1 spanning bottom)
 * - 4 versions: 2x2 grid
 */
export function MultiVersionCompare(
  props: MultiVersionCompareProps,
): JSX.Element {
  const { t } = useTranslation();
  const { versions, syncScroll = true } = props;
  const count = Math.min(versions.length, 4);

  // Shared scroll position for sync
  const [scrollTop, setScrollTop] = React.useState(0);

  // Handle scroll from any pane
  const handleScroll = React.useCallback(
    (newScrollTop: number) => {
      if (syncScroll) {
        setScrollTop(newScrollTop);
      }
    },
    [syncScroll],
  );

  // Grid layout classes based on count
  const getGridClasses = (): string => {
    switch (count) {
      case 2:
        return "grid-cols-2 grid-rows-1";
      case 3:
        return "grid-cols-2 grid-rows-2";
      case 4:
        return "grid-cols-2 grid-rows-2";
      default:
        return "grid-cols-1";
    }
  };

  return (
    <div
      data-testid="multi-version-compare"
      className="flex flex-col bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-xl shadow-xl overflow-hidden"
      style={{
        width: props.width ?? "100%",
        height: props.height ?? "100%",
      }}
    >
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-[var(--color-separator)] bg-[var(--color-bg-raised)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-fg-default)]">
            {t("diff.multiVersion.comparingVersions", { count })}
          </span>
          {syncScroll && (
            <span className="text-(--text-label) text-[var(--color-fg-subtle)] px-2 py-0.5 bg-[var(--color-bg-hover)] rounded">
              {t("diff.multiVersion.syncScroll")}
            </span>
          )}
        </div>
        {props.onClose && (
          <Button
            type="button"
            onClick={props.onClose}
            className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] transition-colors p-1.5 rounded hover:bg-[var(--color-bg-hover)]"
            aria-label={t("diff.header.close")}
          >
            <X size={16} strokeWidth={1.5} />
          </Button>
        )}
      </header>

      {/* Grid content */}
      <div
        className={`flex-1 grid ${getGridClasses()} gap-2 p-2 overflow-hidden`}
      >
        {versions.slice(0, 4).map((version, index) => {
          // For 3 versions, make the last one span full width
          const spanFull = count === 3 && index === 2;

          return (
            <div
              key={version.id}
              className={`${spanFull ? "col-span-2" : ""} min-h-0`}
            >
              <VersionPane
                version={version}
                onScroll={handleScroll}
                scrollTop={syncScroll ? scrollTop : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export types
export type { VersionContent };
