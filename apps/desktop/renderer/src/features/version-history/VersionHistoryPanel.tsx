import React from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "../../components/primitives/Button";
import { PanelHeader } from "../../components/patterns/PanelHeader";
import { TimeGroupSection, VersionCard } from "./VersionCard";

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
  VersionEntry,
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

const scrollAreaStyles = [
  "flex-1",
  "overflow-y-auto",
  "scroll-shadow-y",
  "p-3",
  "space-y-2",
].join(" ");

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

type VirtualVersionRow =
  | { type: "header"; label: string }
  | { type: "version"; version: VersionEntry };

const VERSION_ROW_HEIGHT = 100;
const HEADER_ROW_HEIGHT = 32;

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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const flatRows = React.useMemo(() => {
    const rows: VirtualVersionRow[] = [];
    for (const group of timeGroups) {
      if (group.label !== "") {
        rows.push({ type: "header", label: group.label });
      }
      for (const version of group.versions) {
        rows.push({ type: "version", version });
      }
    }
    return rows;
  }, [timeGroups]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      flatRows[index].type === "header"
        ? HEADER_ROW_HEIGHT
        : VERSION_ROW_HEIGHT,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const useVirtual = virtualItems.length > 0;

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
      <div ref={scrollRef} className={scrollAreaStyles}>
        {useVirtual ? (
          <div
            className="relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualRow) => {
              const row = flatRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute left-0 right-0 list-item-enter"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.type === "header" ? (
                    <div className="px-2 py-1">
                      <span className="text-[10px] font-medium text-[var(--color-fg-placeholder)] uppercase tracking-wider">
                        {row.label}
                      </span>
                    </div>
                  ) : (
                    <VersionCard
                      version={row.version}
                      isSelected={selectedId === row.version.id}
                      onSelect={onSelect}
                      onRestore={onRestore}
                      onCompare={onCompare}
                      onPreview={onPreview}
                      showAiMarks={showAiMarks}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
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
          </>
        )}
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
