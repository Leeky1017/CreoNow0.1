import React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { DiffHeader, type DiffViewMode, type VersionInfo } from "./DiffHeader";
import { DiffFooter } from "./DiffFooter";
import {
  UnifiedDiffView,
  parseDiffLines,
  getChangePositions,
  type DiffStats,
} from "./DiffView";
import { SplitDiffView } from "./SplitDiffView";

type DiffViewPanelProps = {
  /** The unified diff text */
  diffText: string;
  /** Available versions for comparison */
  versions?: VersionInfo[];
  /** Initial view mode */
  initialViewMode?: DiffViewMode;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Callback when restore is requested */
  onRestore?: () => void;
  /** Whether restore is in progress */
  restoreInProgress?: boolean;
  /** Panel width (for responsive layout) */
  width?: number;
  /** Panel height */
  height?: number | string;
  /** Compare source */
  mode?: "version" | "ai";
  /** Current per-hunk decision state */
  hunkDecisions?: Array<"pending" | "accepted" | "rejected">;
  /** Callback to accept current hunk */
  onAcceptHunk?: (hunkIndex: number) => void;
  /** Callback to reject current hunk */
  onRejectHunk?: (hunkIndex: number) => void;
  /** Callback to accept all changes */
  onAcceptAll?: () => void;
  /** Callback to reject all changes */
  onRejectAll?: () => void;
  /** Optional underline style for added/removed lines. */
  lineUnderlineStyle?: "none" | "solid" | "dashed";
};

/**
 * Default mock versions for demonstration.
 */
function getDefaultVersions(t: TFunction): VersionInfo[] {
  return [
    { id: "2h", label: t('diff.panel.version2hAgo'), type: "auto" },
    { id: "yesterday", label: t('diff.panel.versionYesterday'), type: "manual" },
    { id: "current", label: t('diff.panel.versionCurrent'), type: "current" },
  ];
}

/**
 * DiffViewPanel is the complete diff viewer component.
 *
 * Combines:
 * - DiffHeader (version selection, view toggle, navigation)
 * - UnifiedDiffView or SplitDiffView (content)
 * - DiffFooter (statistics, action buttons)
 */
export function DiffViewPanel(props: DiffViewPanelProps): JSX.Element {
  const { t } = useTranslation();
  const defaultVersions = React.useMemo(() => getDefaultVersions(t), [t]);
  const versions = props.versions ?? defaultVersions;

  // Parse diff
  const { lines, stats } = React.useMemo(
    () => parseDiffLines(props.diffText),
    [props.diffText],
  );

  // Get change positions for navigation
  const changePositions = React.useMemo(
    () => getChangePositions(lines),
    [lines],
  );

  // State
  const [viewMode, setViewMode] = React.useState<DiffViewMode>(
    props.initialViewMode ?? "unified",
  );
  const [currentChangeIndex, setCurrentChangeIndex] = React.useState(0);
  const [selectedBeforeVersion, setSelectedBeforeVersion] = React.useState(
    versions.find((v) => v.type !== "current")?.id ?? versions[0]?.id ?? "",
  );
  const [selectedAfterVersion] = React.useState(
    versions.find((v) => v.type === "current")?.id ?? "current",
  );

  // Navigation handlers
  const handlePreviousChange = (): void => {
    setCurrentChangeIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextChange = (): void => {
    if (changePositions.length === 0) {
      return;
    }
    setCurrentChangeIndex((prev) =>
      Math.min(changePositions.length - 1, prev + 1),
    );
  };

  // Close handler
  const handleClose = (): void => {
    props.onClose?.();
  };

  // Restore handler
  const handleRestore = (): void => {
    props.onRestore?.();
  };

  const handleAcceptCurrentHunk = (): void => {
    if (changePositions.length === 0) {
      return;
    }
    props.onAcceptHunk?.(currentChangeIndex);
  };

  const handleRejectCurrentHunk = (): void => {
    if (changePositions.length === 0) {
      return;
    }
    props.onRejectHunk?.(currentChangeIndex);
  };

  React.useEffect(() => {
    if (changePositions.length === 0 && currentChangeIndex !== 0) {
      setCurrentChangeIndex(0);
      return;
    }
    if (
      currentChangeIndex >= changePositions.length &&
      changePositions.length > 0
    ) {
      setCurrentChangeIndex(changePositions.length - 1);
    }
  }, [changePositions.length, currentChangeIndex]);

  return (
    <div
      className="flex flex-col bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden"
      style={{
        width: props.width ?? "100%",
        height: props.height ?? "100%",
      }}
    >
      {/* Header */}
      <DiffHeader
        versions={versions}
        selectedBeforeVersion={selectedBeforeVersion}
        selectedAfterVersion={selectedAfterVersion}
        onBeforeVersionChange={setSelectedBeforeVersion}
        onAfterVersionChange={() => {}}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentChangeIndex={currentChangeIndex}
        totalChanges={changePositions.length}
        onPreviousChange={handlePreviousChange}
        onNextChange={handleNextChange}
        onClose={handleClose}
      />

      {/* Content */}
      {viewMode === "unified" ? (
        <UnifiedDiffView
          lines={lines}
          currentChangeIndex={currentChangeIndex}
          changePositions={changePositions}
          lineUnderlineStyle={props.lineUnderlineStyle}
        />
      ) : (
        <SplitDiffView
          lines={lines}
          currentChangeIndex={currentChangeIndex}
          changePositions={changePositions}
          lineUnderlineStyle={props.lineUnderlineStyle}
        />
      )}

      {/* Footer */}
      <DiffFooter
        stats={stats}
        onClose={handleClose}
        onRestore={handleRestore}
        restoreInProgress={props.restoreInProgress}
        onAcceptAll={props.onAcceptAll}
        onRejectAll={props.onRejectAll}
        onAcceptHunk={props.onAcceptHunk ? handleAcceptCurrentHunk : undefined}
        onRejectHunk={props.onRejectHunk ? handleRejectCurrentHunk : undefined}
        currentChangeIndex={currentChangeIndex}
        totalChanges={changePositions.length}
        currentHunkDecision={props.hunkDecisions?.[currentChangeIndex]}
      />
    </div>
  );
}

// Re-export types for external use
export type { DiffViewMode, VersionInfo, DiffStats };
