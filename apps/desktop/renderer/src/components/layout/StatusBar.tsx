import React from "react";
import { useTranslation } from "react-i18next";
import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";
import { useEditorStore } from "../../stores/editorStore";
import { useProjectStore } from "../../stores/projectStore";
import { useFileStore } from "../../stores/fileStore";
import { SaveIndicator } from "./SaveIndicator";
import "../../i18n";

function formatCurrentTime(value: Date): string {
  return value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * StatusBar renders the fixed 28px bottom bar for project/document context.
 *
 * Why: users need persistent writing context plus save feedback without opening
 * side panels.
 */
export function StatusBar(): JSX.Element {
  const { t } = useTranslation();
  const currentProjectId = useProjectStore((s) => s.current?.projectId ?? null);
  const projectItems = useProjectStore((s) => s.items);
  const documentId = useEditorStore((s) => s.documentId);
  const fileItems = useFileStore((s) => s.items);
  const currentDocumentId = useFileStore((s) => s.currentDocumentId);
  const documentCharacterCount = useEditorStore(
    (s) => s.documentCharacterCount,
  );
  const autosaveStatus = useEditorStore((s) => s.autosaveStatus);
  const retryLastAutosave = useEditorStore((s) => s.retryLastAutosave);
  const capacityWarning = useEditorStore((s) => s.capacityWarning);

  const [currentTime, setCurrentTime] = React.useState(() =>
    formatCurrentTime(new Date()),
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatCurrentTime(new Date()));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const projectName = React.useMemo(() => {
    if (!currentProjectId) {
      return t("workbench.statusBar.unnamedProject");
    }
    return (
      projectItems.find((item) => item.projectId === currentProjectId)?.name ??
      t("workbench.statusBar.unnamedProject")
    );
  }, [currentProjectId, projectItems, t]);

  const activeDocumentId = documentId ?? currentDocumentId;
  const documentName = React.useMemo(() => {
    if (!activeDocumentId) {
      return t("workbench.statusBar.unnamedDocument");
    }
    return (
      fileItems.find((item) => item.documentId === activeDocumentId)?.title ??
      t("workbench.statusBar.unnamedDocument")
    );
  }, [activeDocumentId, fileItems, t]);

  const documentCharacterCountSafe = Math.max(0, documentCharacterCount);
  const wordCountText = t("workbench.statusBar.wordCount", {
    count: documentCharacterCountSafe,
  }).replace(
    String(documentCharacterCountSafe),
    documentCharacterCountSafe.toLocaleString("en-US"),
  );

  return (
    <div
      data-testid="layout-statusbar"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="shrink-0 flex items-center justify-between gap-3 px-3 text-(--text-status) font-[var(--font-family-ui)] text-[var(--color-fg-muted)] bg-[var(--color-bg-surface)] border-t border-[var(--color-separator-bold)]"
      style={{ height: LAYOUT_DEFAULTS.statusBarHeight }}
    >
      <div className="min-w-0 flex items-center gap-2">
        <span data-testid="status-project-name" className="truncate">
          {projectName}
        </span>
        <span aria-hidden="true">/</span>
        <span data-testid="status-document-name" className="truncate">
          {documentName}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span
          key={documentCharacterCountSafe}
          data-testid="status-word-count"
          className="countup tabular-nums"
        >
          {wordCountText}
        </span>
        <SaveIndicator
          autosaveStatus={autosaveStatus}
          onRetry={() => {
            void retryLastAutosave();
          }}
        />
        <span data-testid="status-current-time">{currentTime}</span>
        {capacityWarning ? (
          <span
            data-testid="editor-capacity-warning"
            className="text-[var(--color-warning)]"
            role="status"
          >
            {capacityWarning}
          </span>
        ) : null}
      </div>
    </div>
  );
}
