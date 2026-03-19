import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives/Button";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { TimeGroupSection } from "./VersionCard";

// Re-export all types for backward compatibility
export type {
  VersionAuthorType,
  WordChange,
  VersionEntry,
  TimeGroup,
  VersionHistoryPanelProps,
  VersionHistoryPanelContentProps,
} from "./versionHistoryTypes";

import type {
  VersionHistoryPanelProps,
  VersionHistoryPanelContentProps,
} from "./versionHistoryTypes";

// ============================================================================
// Styles
// ============================================================================

const panelContentStyles = [
  "bg-[var(--color-bg-surface)]",
  "flex",
  "flex-col",
  "h-full",
].join(" ");

const panelStyles = [
  "bg-[var(--color-bg-surface)]",
  "border-l",
  "border-[var(--color-separator)]",
  "flex",
  "flex-col",
  "h-full",
  "shadow-[var(--shadow-xl)]",
  "shrink-0",
].join(" ");

const scrollAreaStyles = ["flex-1", "overflow-y-auto", "p-3", "space-y-2"].join(
  " ",
);

const footerStyles = [
  "px-5",
  "py-4",
  "border-t",
  "border-[var(--color-separator)]",
  "bg-[var(--color-bg-surface)]",
].join(" ");

// ============================================================================
// Main Components
// ============================================================================

export function VersionHistoryPanelContent({
  documentTitle = "Untitled Document",
  timeGroups,
  selectedId,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  onClose,
  onConfigureAutoSave,
  lastSavedText = "2m ago",
  autoSaveEnabled = true,
  showAiMarks = false,
  showCloseButton = true,
}: VersionHistoryPanelContentProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div
      className={panelContentStyles}
      data-testid="version-history-panel-content"
    >
      {/* Header */}
      <PanelHeader
        title={t("versionHistory.panel.title")}
        subtitle={documentTitle}
        actions={
          showCloseButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t("versionHistory.panel.closeAriaLabel")}
            >
              <X size={16} strokeWidth={1.5} />
            </Button>
          ) : undefined
        }
      />

      {/* Scrollable content */}
      <div className={scrollAreaStyles}>
        {timeGroups.map((group, index) => (
          <TimeGroupSection
            key={group.label || `group-${index}`}
            group={group}
            selectedId={selectedId}
            onSelect={onSelect}
            onRestore={onRestore}
            onCompare={onCompare}
            onPreview={onPreview}
            showAiMarks={showAiMarks}
          />
        ))}
        <div className="h-2" />
      </div>

      {/* Footer */}
      <div className={footerStyles}>
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${autoSaveEnabled ? "bg-[var(--color-success)]" : "bg-[var(--color-fg-placeholder)]"}`}
          />
          <span className="text-xs text-[var(--color-fg-muted)]">
            {autoSaveEnabled
              ? t("versionHistory.panel.autoSaveOn", { time: lastSavedText })
              : t("versionHistory.panel.autoSaveOff")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onConfigureAutoSave}
          className="!p-0 !h-auto !text-[11px] text-[var(--color-accent-muted)] hover:text-[var(--color-accent)] hover:underline"
        >
          {t("versionHistory.panel.configureAutoSave")}
        </Button>
      </div>
    </div>
  );
}

/**
 * VersionHistoryPanel — standalone panel with container styles.
 * For use inside layout containers, prefer VersionHistoryPanelContent.
 */
export function VersionHistoryPanel({
  documentTitle = "Untitled Document",
  timeGroups,
  selectedId,
  onSelect,
  onRestore,
  onCompare,
  onPreview,
  onClose,
  onConfigureAutoSave,
  lastSavedText = "2m ago",
  autoSaveEnabled = true,
  showAiMarks = false,
  width = 320,
}: VersionHistoryPanelProps): JSX.Element {
  return (
    <aside
      className={panelStyles}
      style={{ width }}
      data-testid="version-history-panel"
    >
      <VersionHistoryPanelContent
        documentTitle={documentTitle}
        timeGroups={timeGroups}
        selectedId={selectedId}
        onSelect={onSelect}
        onRestore={onRestore}
        onCompare={onCompare}
        onPreview={onPreview}
        onClose={onClose}
        onConfigureAutoSave={onConfigureAutoSave}
        lastSavedText={lastSavedText}
        autoSaveEnabled={autoSaveEnabled}
        showAiMarks={showAiMarks}
        showCloseButton={true}
      />
    </aside>
  );
}
