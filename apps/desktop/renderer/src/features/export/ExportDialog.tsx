import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";
import { Button, Checkbox, Select, Tooltip } from "../../components/primitives";
import { invoke } from "../../lib/ipcClient";

import { Check, File, FileCode, FileOutput, FileText, X } from "lucide-react";
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
 * ExportDialog props
 */
export interface ExportDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current project ID (required for export IPC) */
  projectId?: string | null;
  /** Current document ID (optional; backend resolves current doc when omitted) */
  documentId?: string | null;
  /** Document title to export */
  documentTitle?: string;
  /** Estimated file size */
  estimatedSize?: string;
  /** Initial export options */
  initialOptions?: Partial<ExportOptions>;
  /** Callback when export is triggered */
  onExport?: (options: ExportOptions) => void;
  /** Callback when export is cancelled */
  onCancel?: () => void;
  /** Current view state (for controlled mode/stories) */
  view?: ExportView;
  /** Current progress (0-100) for progress view */
  progress?: number;
  /** Current step label for progress view */
  progressStep?: string;
  /** Export result for controlled success view (stories) */
  result?: { relativePath: string; bytesWritten: number };
  /** Error for controlled error display (stories) */
  error?: IpcError;
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
function getProgressSteps(t: TFunction): ProgressStep[] {
  return [
    { label: t('export.progress.preparing'), threshold: 30 },
    { label: t('export.progress.exporting'), threshold: 70 },
    { label: t('export.progress.finalizing'), threshold: 100 },
  ];
}

/**
 * Get current step label based on progress
 */
function getProgressStepLabel(progress: number, steps: ProgressStep[]): string {
  for (const step of steps) {
    if (progress < step.threshold) {
      return step.label;
    }
  }
  return steps[steps.length - 1].label;
}

/**
 * Format option configuration
 */
interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/**
 * Format options
 */
function getFormatOptions(t: TFunction): FormatOption[] {
  return [
    {
      value: "pdf",
      label: "PDF",
      description: t('export.format.pdfPlainTextHint'),
      icon: <FileText size={20} strokeWidth={1.5} />,
    },
    {
      value: "markdown",
      label: "Markdown",
      description: ".md",
      icon: <FileCode size={20} strokeWidth={1.5} />,
    },
    {
      value: "docx",
      label: "Word",
      description: t('export.format.docxPlainTextHint'),
      icon: <FileText size={20} strokeWidth={1.5} />,
    },
    {
      value: "txt",
      label: t('export.format.plainText'),
      description: ".txt",
      icon: <File size={20} strokeWidth={1.5} />,
    },
  ];
}

/**
 * Format-specific unsupported reasons.
 * Empty map means all formats are supported.
 */
const UNSUPPORTED_FORMAT_REASONS: Partial<Record<ExportFormat, string>> = {
  // All formats now supported
};

function getUnsupportedReason(format: ExportFormat): string | null {
  return UNSUPPORTED_FORMAT_REASONS[format] ?? null;
}

/**
 * Page size options for Select
 */
function getPageSizeOptions(t: TFunction) {
  return [
    { value: "a4", label: "A4" },
    { value: "letter", label: t('export.pageSize.letter') },
    { value: "legal", label: t('export.pageSize.legal') },
  ];
}

// ============================================================================
// Styles
// ============================================================================

const overlayStyles = [
  "fixed",
  "inset-0",
  "z-[var(--z-modal)]",
  "bg-[var(--color-scrim)]",
  "backdrop-blur-sm",
  "transition-opacity",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=closed]:opacity-0",
].join(" ");

const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  "w-[480px]",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-[var(--shadow-xl)]",
  "flex",
  "flex-col",
  "max-h-[90vh]",
  "overflow-hidden",
  // Animation
  "transition-[opacity,transform]",
  "duration-[var(--duration-normal)]",
  "ease-[var(--ease-default)]",
  "data-[state=open]:opacity-100",
  "data-[state=open]:scale-100",
  "data-[state=closed]:opacity-0",
  "data-[state=closed]:scale-95",
  "focus:outline-none",
].join(" ");

const closeButtonStyles = [
  "p-1",
  "rounded-[var(--radius-sm)]",
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

const labelStyles = [
  "text-[10px]",
  "font-semibold",
  "text-[var(--color-fg-placeholder)]",
  "uppercase",
  "tracking-[0.1em]",
  "mb-3",
  "block",
].join(" ");

const formatCardStyles = (args: { isSelected: boolean; disabled: boolean }) =>
  [
    "p-3",
    "rounded-[var(--radius-md)]",
    "border",
    "transition-colors",
    "duration-[var(--duration-fast)]",
    "h-full",
    "flex",
    "flex-col",
    "justify-center",
    "items-center",
    "text-center",
    "relative",
    args.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
    args.isSelected
      ? [
          "border-[var(--color-accent)]",
          "bg-[var(--color-accent-subtle)]",
        ].join(" ")
      : [
          "border-[var(--color-border-default)]",
          "bg-[var(--color-bg-disabled)]",
          args.disabled ? "" : "hover:bg-[var(--color-bg-hover)]",
        ].join(" "),
  ].join(" ");

const radioIndicatorStyles = (isSelected: boolean) =>
  isSelected
    ? "w-4 h-4 rounded-full bg-[var(--color-fg-on-accent)]"
    : "w-4 h-4 rounded-full border border-[var(--color-border-default)] opacity-0";

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Format card radio button
 */
function FormatCard({
  option,
  isSelected,
  disabledReason,
}: {
  option: FormatOption;
  isSelected: boolean;
  disabledReason?: string;
}) {
  const { t } = useTranslation();
  const disabled =
    typeof disabledReason === "string" && disabledReason.length > 0;

  const item = (
    <RadioGroupPrimitive.Item
      value={option.value}
      disabled={disabled}
      data-testid={`export-format-${option.value}`}
      className={formatCardStyles({ isSelected, disabled })}
    >
      {disabled ? (
        <div className="absolute top-3 left-3 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-hover)] text-[var(--color-fg-muted)]">
          {t('export.format.unsupported')}
        </div>
      ) : null}

      {/* 单选指示器 - 绝对定位在右上角，选中时为实心白色圆 */}
      <div
        className={`absolute top-3 right-3 ${radioIndicatorStyles(isSelected)}`}
      />

      {/* 图标 */}
      <div
        className={`mb-2 ${
          isSelected
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-fg-muted)]"
        }`}
      >
        {option.icon}
      </div>

      {/* 标签 */}
      <div className="font-medium text-sm text-[var(--color-fg-default)]">
        {option.label}
      </div>

      {/* 描述 */}
      <div
        className={`text-xs mt-0.5 ${
          option.value === "markdown" ? "font-mono" : ""
        } text-[var(--color-fg-muted)]`}
      >
        {option.description}
      </div>
    </RadioGroupPrimitive.Item>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip content={disabledReason}>
        <div className="h-full">{item}</div>
      </Tooltip>
    );
  }

  return item;
}

/**
 * Preview thumbnail
 */
function PreviewThumbnail({
  format,
  pageSize,
}: {
  format: ExportFormat;
  pageSize: PageSize;
}) {
  const { t } = useTranslation();
  const formatLabel = format.toUpperCase();
  const pageSizeLabel = pageSize.toUpperCase();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className={labelStyles}>{t('export.config.previewLabel')}</span>
        <span className="text-[10px] text-[var(--color-fg-placeholder)] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
          {formatLabel} • {pageSizeLabel}
        </span>
      </div>
      <div className="w-full h-32 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] p-4 overflow-hidden relative">
        <div className="opacity-50 select-none pointer-events-none transform scale-[0.8] origin-top-left w-[120%]">
          <div className="h-4 w-3/4 bg-[var(--color-fg-placeholder)]/40 rounded mb-3" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-5/6 bg-[var(--color-fg-placeholder)]/20 rounded mb-3" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-4/5 bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="w-full h-16 bg-[var(--color-fg-placeholder)]/10 rounded mt-4 border border-[var(--color-separator)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--color-bg-base)] to-transparent" />
      </div>
    </div>
  );
}

/**
 * Config view - format selection and options
 */
function ConfigView({
  options,
  onOptionsChange,
  onExport,
  onCancel,
  estimatedSize,
  exportDisabledReason,
  error,
  onDismissError,
}: {
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onExport: () => void;
  onCancel: () => void;
  estimatedSize: string;
  exportDisabledReason: string | null;
  error: IpcError | null;
  onDismissError: () => void;
}) {
  const { t } = useTranslation();
  const isPdfFormat = options.format === "pdf";

  return (
    <>
      <div className="overflow-y-auto p-6 space-y-6">
        {error ? (
          <div
            data-testid="export-error"
            className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-xs text-[var(--color-fg-muted)]">
                <div data-testid="export-error-code" className="font-mono">
                  {error.code}
                </div>
                <div data-testid="export-error-message">{error.message}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissError}
                className="shrink-0"
              >
                {t('export.action.dismiss')}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Format Selection */}
        <div>
          <span className={labelStyles}>{t('export.config.formatLabel')}</span>
          <RadioGroupPrimitive.Root
            value={options.format}
            onValueChange={(value) =>
              onOptionsChange({ ...options, format: value as ExportFormat })
            }
            className="grid grid-cols-2 gap-3 auto-rows-[100px]"
          >
            {getFormatOptions(t).map((option) => (
              <FormatCard
                key={option.value}
                option={option}
                isSelected={options.format === option.value}
                disabledReason={getUnsupportedReason(option.value) ?? undefined}
              />
            ))}
          </RadioGroupPrimitive.Root>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Settings Column */}
          <div className="space-y-3">
            <span className={labelStyles}>{t('export.config.settingsLabel')}</span>

            <Checkbox
              checked={options.includeMetadata}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  includeMetadata: checked === true,
                })
              }
              label={t('export.config.includeMetadata')}
            />

            <Checkbox
              checked={options.versionHistory}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  versionHistory: checked === true,
                })
              }
              label={t('export.config.versionHistory')}
            />

            <Checkbox
              checked={options.embedImages}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  embedImages: checked === true,
                })
              }
              label={t('export.config.embedImages')}
            />
          </div>

          {/* Page Size Column */}
          <div className="space-y-3">
            <span className={labelStyles}>{t('export.config.pageSizeLabel')}</span>
            <Select
              value={options.pageSize}
              onValueChange={(value) =>
                onOptionsChange({ ...options, pageSize: value as PageSize })
              }
              options={getPageSizeOptions(t)}
              disabled={!isPdfFormat}
              fullWidth
            />
          </div>
        </div>

        {/* Preview */}
        <PreviewThumbnail format={options.format} pageSize={options.pageSize} />
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-[var(--color-separator)] flex items-center bg-[var(--color-bg-surface)]">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[var(--color-fg-muted)]">
            {estimatedSize}
          </span>
          {exportDisabledReason ? (
            <span className="text-xs text-[var(--color-fg-muted)]">
              {exportDisabledReason}
            </span>
          ) : null}
        </div>
        <div className="flex-1" />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            {t('export.action.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onExport}
            data-testid="export-submit"
            disabled={exportDisabledReason !== null}
          >
            {t('export.action.export')}
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Progress view - export in progress
 */
function ProgressView({
  documentTitle,
  format,
  progress,
  progressStep,
  onCancel,
}: {
  documentTitle: string;
  format: ExportFormat;
  progress: number;
  progressStep: string;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const formatLabel = format.toUpperCase();

  return (
    <div className="flex flex-col h-[400px] items-center justify-center p-8 text-center">
      {/* Icon with pulse animation */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)] mb-6 relative">
        <FileOutput size={24} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-medium text-[var(--color-fg-default)] mb-2">
        {t('export.progress.title')}
      </h3>
      <p className="text-[var(--color-fg-muted)] text-sm mb-8">
        {t('export.progress.converting', { title: documentTitle, format: formatLabel })}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-2">
        <div className="h-1.5 w-full bg-[var(--color-bg-hover)] rounded-[var(--radius-full)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-[var(--radius-full)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between w-full max-w-xs text-xs text-[var(--color-fg-placeholder)] font-mono">
        <span>{progressStep}</span>
        <span>{Math.floor(progress)}%</span>
      </div>

      <Button variant="ghost" onClick={onCancel} className="mt-8">
        {t('export.action.cancel')}
      </Button>
    </div>
  );
}

/**
 * Success view - export complete
 */
function SuccessView(props: {
  result: { relativePath: string; bytesWritten: number };
  onDone: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="export-success"
      className="flex flex-col h-[400px] items-center justify-center p-8 text-center"
    >
      {/* Success icon */}
      <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)] mb-6 border border-[var(--color-success)]/20">
        <Check size={24} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-medium text-[var(--color-fg-default)] mb-2">
        {t('export.success.title')}
      </h3>
      <p className="text-[var(--color-fg-muted)] text-sm mb-8">
        {t('export.success.description')}
      </p>

      <div className="w-full max-w-sm mb-8 text-left">
        <div className="text-[10px] font-semibold text-[var(--color-fg-placeholder)] uppercase tracking-[0.1em] mb-2">
          {t('export.success.resultLabel')}
        </div>
        <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] space-y-1">
          <div className="text-xs text-[var(--color-fg-muted)]">
            <span className="font-mono">{t('workbench.export.fieldRelativePath')}</span>:{" "}
            <span
              data-testid="export-success-relative-path"
              className="font-mono"
            >
              {props.result.relativePath}
            </span>
          </div>
          <div className="text-xs text-[var(--color-fg-muted)]">
            <span className="font-mono">{t('workbench.export.fieldBytesWritten')}</span>:{" "}
            <span
              data-testid="export-success-bytes-written"
              className="font-mono"
            >
              {props.result.bytesWritten}
            </span>
          </div>
        </div>
      </div>

      <Button
        data-testid="export-done"
        variant="primary"
        onClick={props.onDone}
        className="!bg-[var(--color-bg-base)] !text-[var(--color-fg-default)] hover:!bg-[var(--color-bg-hover)]"
      >
        {t('export.action.done')}
      </Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ExportDialog component
 *
 * A dialog for exporting documents with format selection, options configuration,
 * progress tracking, and success feedback.
 *
 * Features:
 * - 3 format options: PDF, Markdown, Word
 * - Export settings: metadata, version history, embed images
 * - Page size selection (PDF only)
 * - Live preview thumbnail
 * - Progress bar with step labels
 * - Success confirmation
 *
 * @example
 * ```tsx
 * <ExportDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   documentTitle="The Architecture of Silence"
 *   onExport={(options) => handleExport(options)}
 * />
 * ```
 */
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
  const displayTitle = documentTitle ?? t('export.defaultDocumentTitle');
  // Internal state for uncontrolled mode
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

  // Use controlled or internal values
  const view = controlledView ?? internalView;
  const progress = controlledProgress ?? internalProgress;
  const steps = getProgressSteps(t);
  const progressStep = controlledProgressStep ?? getProgressStepLabel(progress, steps);
  const error = controlledError ?? lastError;
  const exportResult = controlledResult ?? result;

  const dismissError = React.useCallback(() => {
    if (controlledError) {
      return;
    }
    setLastError(null);
  }, [controlledError]);

  // Reset state when dialog opens
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
      return t('export.error.noProject');
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

      setLastError({
        code: "IO_ERROR",
        message:
          error instanceof Error
            ? error.message
            : t('export.error.unknown'),
      });
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
                    {t('export.dialog.title')}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm text-[var(--color-fg-muted)]">
                    {displayTitle}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  className={closeButtonStyles}
                  aria-label={t('export.dialog.close')}
                >
                  <X size={20} strokeWidth={1.5} aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>

              <ConfigView
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
                {t('export.progress.title')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {t('export.progress.description')}
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
                {t('export.success.title')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                {t('export.success.srDescription')}
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
