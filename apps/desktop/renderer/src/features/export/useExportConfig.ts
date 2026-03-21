import React from "react";
import type { TFunction } from "i18next";
import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";
import { useAppToast } from "../../components/providers/AppToastProvider";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";

/**
 * Export format types
 */
export type ExportFormat = "pdf" | "markdown" | "docx" | "txt";

/**
 * Page size options (PDF only)
 */
export type PageSize = "a4" | "letter" | "legal";

/**
 * Export view states
 */
export type ExportView = "config" | "progress" | "success";

/**
 * Export options configuration
 */
export interface ExportOptions {
  format: ExportFormat;
  pageSize: PageSize;
  includeMetadata: boolean;
  versionHistory: boolean;
  embedImages: boolean;
}

/**
 * Progress step definition
 */
export interface ProgressStep {
  label: string;
  threshold: number;
}

/**
 * Default export options
 */
export const defaultExportOptions: ExportOptions = {
  format: "markdown",
  pageSize: "a4",
  includeMetadata: true,
  versionHistory: false,
  embedImages: true,
};

/**
 * Progress steps configuration
 */
export function getProgressSteps(t: TFunction): ProgressStep[] {
  return [
    { label: t("export.progress.preparing"), threshold: 30 },
    { label: t("export.progress.exporting"), threshold: 70 },
    { label: t("export.progress.finalizing"), threshold: 100 },
  ];
}

/**
 * Get current step label based on progress
 */
export function getProgressStepLabel(
  progress: number,
  steps: ProgressStep[],
): string {
  for (const step of steps) {
    if (progress < step.threshold) {
      return step.label;
    }
  }
  return steps[steps.length - 1].label;
}

/**
 * Format-specific unsupported reasons.
 */
const UNSUPPORTED_FORMAT_REASONS: Partial<Record<ExportFormat, string>> = {
  // All formats now supported
};

export function getUnsupportedReason(format: ExportFormat): string | null {
  return UNSUPPORTED_FORMAT_REASONS[format] ?? null;
}

export function formatExportError(t: TFunction, error: IpcError): IpcError {
  if (error.code !== "INVALID_ARGUMENT") {
    return error;
  }

  const unsupportedPrefix = "Export format does not yet support:";
  if (error.message.startsWith(unsupportedPrefix)) {
    const details = error.message.slice(unsupportedPrefix.length).trim();
    return {
      code: "INVALID_ARGUMENT",
      message: t("export.error.unsupportedStructure", { details }),
    };
  }

  return error;
}

/** Resolve the display message for an export error. */
export function formatExportErrorDisplay(
  t: TFunction,
  error: IpcError,
): string {
  const formatted = formatExportError(t, error);
  return formatted.message !== error.message
    ? formatted.message
    : getHumanErrorMessage(error);
}

/**
 * Page size options for Select
 */
export function getPageSizeOptions(t: TFunction) {
  return [
    { value: "a4", label: "A4" },
    { value: "letter", label: t("export.pageSize.letter") },
    { value: "legal", label: t("export.pageSize.legal") },
  ];
}

/**
 * Format option configuration
 */
export interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface UseExportConfigParams {
  open: boolean;
  projectId?: string | null;
  documentId?: string | null;
  initialOptions?: Partial<ExportOptions>;
  onExport?: (options: ExportOptions) => void;
  onCancel?: () => void;
  onOpenChange: (open: boolean) => void;
  controlledView?: ExportView;
  controlledProgress?: number;
  controlledProgressStep?: string;
  controlledResult?: { relativePath: string; bytesWritten: number };
  controlledError?: IpcError;
  t: TFunction;
}

/**
 * Hook encapsulating export config state management
 */
export function useExportConfig({
  open,
  projectId = null,
  documentId = null,
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
}: UseExportConfigParams) {
  const { showToast } = useAppToast();
  const [internalView, setInternalView] = React.useState<ExportView>("config");
  const [internalProgress, setInternalProgress] = React.useState(0);
  const [options, setOptions] = React.useState<ExportOptions>({
    ...defaultExportOptions,
    ...initialOptions,
  });
  const [lastError, setLastError] = React.useState<IpcError | null>(null);
  const [result, setResult] = React.useState<{
    relativePath: string;
    bytesWritten: number;
  } | null>(null);
  const requestIdRef = React.useRef(0);

  const view = controlledView ?? internalView;
  const progress = controlledProgress ?? internalProgress;
  const steps = getProgressSteps(t);
  const progressStep =
    controlledProgressStep ?? getProgressStepLabel(progress, steps);
  const error = controlledError ?? lastError;
  const exportResult = controlledResult ?? result;

  const dismissError = React.useCallback(() => {
    if (controlledError) {
      return;
    }
    setLastError(null);
  }, [controlledError]);

  React.useEffect(() => {
    if (open) {
      setInternalView("config");
      setInternalProgress(0);
      setLastError(null);
      setResult(null);
      const nextOptions = {
        ...defaultExportOptions,
        ...initialOptions,
      };
      setOptions({
        ...nextOptions,
        format: getUnsupportedReason(nextOptions.format)
          ? "markdown"
          : nextOptions.format,
      });
    }
  }, [open, initialOptions]);

  const exportDisabledReason = React.useMemo(() => {
    const trimmedProjectId = projectId?.trim() ?? "";
    if (trimmedProjectId.length === 0) {
      return t("export.error.noProject");
    }
    const unsupported = getUnsupportedReason(options.format);
    if (unsupported) {
      return `UNSUPPORTED: ${unsupported}`;
    }
    return null;
  }, [options.format, projectId, t]);

  const handleExport = async () => {
    setLastError(null);
    setResult(null);

    if (exportDisabledReason) {
      setLastError({
        code: exportDisabledReason.startsWith("UNSUPPORTED:")
          ? "UNSUPPORTED"
          : "INVALID_ARGUMENT",
        message: exportDisabledReason,
      });
      return;
    }

    const trimmedProjectId = projectId?.trim() ?? "";
    const trimmedDocumentId = documentId?.trim() ?? "";
    const payload = {
      projectId: trimmedProjectId,
      documentId: trimmedDocumentId.length > 0 ? trimmedDocumentId : undefined,
    };

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setInternalView("progress");
    setInternalProgress(30);

    let res: IpcResponse<{ relativePath: string; bytesWritten: number }>;
    try {
      res =
        options.format === "markdown"
          ? await invoke("export:document:markdown", payload)
          : options.format === "pdf"
            ? await invoke("export:document:pdf", payload)
            : options.format === "txt"
              ? await invoke("export:document:txt", payload)
              : await invoke("export:document:docx", payload);
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      const ioError = {
        code: "IO_ERROR" as const,
        message:
          error instanceof Error ? error.message : t("export.error.unknown"),
      };
      setLastError(ioError);
      setInternalView("config");
      setInternalProgress(0);
      return;
    }

    if (requestIdRef.current !== requestId) {
      return;
    }

    if (!res.ok) {
      setLastError(res.error);
      setInternalView("config");
      setInternalProgress(0);
      return;
    }

    setInternalProgress(100);
    setResult(res.data);
    setInternalView("success");
    showToast({ title: t("toast.export.success.title"), variant: "success" });
    onExport?.(options);
  };

  const handleCancel = () => {
    if (view === "progress") {
      requestIdRef.current += 1;
      setInternalView("config");
      setInternalProgress(0);
    } else {
      onCancel?.();
      onOpenChange(false);
    }
  };

  const handleDone = () => {
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      requestIdRef.current += 1;
    }
    onOpenChange(nextOpen);
  };

  return {
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
  };
}
