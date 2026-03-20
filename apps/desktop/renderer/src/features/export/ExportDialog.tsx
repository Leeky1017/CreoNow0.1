import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import type { IpcError } from "@shared/types/ipc-generated";

import { X } from "lucide-react";
import { useExportConfig } from "./useExportConfig";
import { ExportFormatTab } from "./ExportFormatTab";
import { ProgressView, SuccessView } from "./ExportPreview";

// Re-export types and constants so existing imports keep working
export { defaultExportOptions } from "./useExportConfig";
export type {
  ExportFormat,
  ExportOptions,
  ExportView,
  PageSize,
  ProgressStep,
} from "./useExportConfig";

import type { ExportOptions, ExportView } from "./useExportConfig";

/**
 * ExportDialog props
 */
export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  documentId?: string | null;
  documentTitle?: string;
  estimatedSize?: string;
  initialOptions?: Partial<ExportOptions>;
  onExport?: (options: ExportOptions) => void;
  onCancel?: () => void;
  view?: ExportView;
  progress?: number;
  progressStep?: string;
  result?: { relativePath: string; bytesWritten: number };
  error?: IpcError;
}

// ============================================================================
// Styles
// ============================================================================

const overlayStyles = "fixed inset-0 z-[var(--z-modal)] bg-[var(--color-scrim)] backdrop-blur-sm transition-opacity duration-[var(--duration-normal)] ease-[var(--ease-default)] data-[state=open]:opacity-100 data-[state=closed]:opacity-0";

const contentStyles = "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] max-w-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] flex flex-col max-h-[90vh] overflow-hidden transition-[opacity,transform] duration-[var(--duration-normal)] ease-[var(--ease-default)] data-[state=open]:opacity-100 data-[state=open]:scale-100 data-[state=closed]:opacity-0 data-[state=closed]:scale-95 focus:outline-none";

const closeButtonStyles = "p-1 rounded-[var(--radius-sm)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]";

/** ExportDialog — dialog shell with tab switching and export button. */
export function ExportDialog({
  open,
  onOpenChange,
  projectId = null,
  documentId = null,
  documentTitle,
  estimatedSize = "~2.4 MB",
  initialOptions,
  onExport,
  onCancel,
  view: controlledView,
  progress: controlledProgress,
  progressStep: controlledProgressStep,
  result: controlledResult,
  error: controlledError,
}: ExportDialogProps): JSX.Element {
  const { t } = useTranslation();
  const displayTitle = documentTitle ?? t("export.defaultDocumentTitle");

  const {
    view,
    progress,
    progressStep,
    error,
    exportResult,
    options,
    setOptions,
    exportDisabledReason,
    dismissError,
    handleExport,
    handleCancel,
    handleDone,
    handleOpenChange,
  } = useExportConfig({
    open,
    projectId,
    documentId,
    initialOptions,
    onExport,
    onCancel,
    onOpenChange,
    controlledView,
    controlledProgress,
    controlledProgressStep,
    controlledResult,
    controlledError,
    t,
  });

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content
          data-testid="export-dialog"
          className={contentStyles}
        >
          {view === "config" && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--color-separator)]">
                <div>
                  <DialogPrimitive.Title className="text-lg font-medium text-[var(--color-fg-default)] mb-1">
                    {t("export.dialog.title")}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm text-[var(--color-fg-muted)]">
                    {displayTitle}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  className={closeButtonStyles}
                  aria-label={t("export.dialog.close")}
                >
                  <X size={20} strokeWidth={1.5} aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>

              <ExportFormatTab
                options={options}
                onOptionsChange={setOptions}
                onExport={handleExport}
                onCancel={handleCancel}
                estimatedSize={estimatedSize}
                exportDisabledReason={exportDisabledReason}
                error={error}
                onDismissError={dismissError}
              />
            </>
          )}

          {view === "progress" && (
            <>
              <DialogPrimitive.Title className="sr-only">
                {t("export.progress.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {t("export.progress.description")}
              </DialogPrimitive.Description>
              <ProgressView
                documentTitle={displayTitle}
                format={options.format}
                progress={progress}
                progressStep={progressStep}
                onCancel={handleCancel}
              />
            </>
          )}

          {view === "success" && (
            <>
              <DialogPrimitive.Title className="sr-only">
                {t("export.success.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {t("export.success.srDescription")}
              </DialogPrimitive.Description>
              {exportResult ? (
                <SuccessView result={exportResult} onDone={handleDone} />
              ) : null}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
