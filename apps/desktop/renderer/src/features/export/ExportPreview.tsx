import { useTranslation } from "react-i18next";
import { Button } from "../../components/primitives";
import type { ExportFormat, PageSize } from "./useExportConfig";
import { Check, FileOutput } from "lucide-react";

// ============================================================================
// Styles
// ============================================================================

const labelStyles = [
  "text-(--text-label)",
  "font-semibold",
  "text-[var(--color-fg-placeholder)]",
  "uppercase",
  "tracking-(--tracking-wider)",
  "mb-3",
  "block",
].join(" ");

// ============================================================================
// Preview Thumbnail
// ============================================================================

/**
 * Preview thumbnail showing a miniature document preview
 */
export function ExportPreview({
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
        <span className={labelStyles}>{t("export.config.previewLabel")}</span>
        <span className="text-(--text-label) text-[var(--color-fg-placeholder)] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
          {formatLabel} • {pageSizeLabel}
        </span>
      </div>
      <div className="w-full h-32 bg-[var(--color-bg-elevated,var(--color-bg-base))] border border-[var(--color-border-subtle,var(--color-border-default))] rounded-[var(--radius-md)] p-4 overflow-hidden relative">
        <div className="opacity-50 select-none pointer-events-none transform scale-[0.8] origin-top-left w-[120%]">
          <div className="h-4 w-3/4 bg-[var(--color-fg-placeholder)]/40 rounded mb-3" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-5/6 bg-[var(--color-fg-placeholder)]/20 rounded mb-3" />
          <div className="h-2 w-full bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="h-2 w-4/5 bg-[var(--color-fg-placeholder)]/20 rounded mb-1.5" />
          <div className="w-full h-16 bg-[var(--color-fg-placeholder)]/10 rounded mt-4 border border-[var(--color-separator)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--color-bg-elevated,var(--color-bg-base))] to-transparent" />
      </div>
    </div>
  );
}

// ============================================================================
// Progress View
// ============================================================================

interface ProgressViewProps {
  documentTitle: string;
  format: ExportFormat;
  progress: number;
  progressStep: string;
  onCancel: () => void;
}

/**
 * Progress view - export in progress
 */
export function ProgressView({
  documentTitle,
  format,
  progress,
  progressStep,
  onCancel,
}: ProgressViewProps) {
  const { t } = useTranslation();
  const formatLabel = format.toUpperCase();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)] mb-6 relative">
        <FileOutput size={24} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-medium text-[var(--color-fg-default)] mb-2">
        {t("export.progress.title")}
      </h3>
      <p className="text-[var(--color-fg-muted)] text-sm mb-8">
        {t("export.progress.converting", {
          title: documentTitle,
          format: formatLabel,
        })}
      </p>

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
        {t("export.action.cancel")}
      </Button>
    </div>
  );
}

// ============================================================================
// Success View
// ============================================================================

interface SuccessViewProps {
  result: { relativePath: string; bytesWritten: number };
  onDone: () => void;
}

/**
 * Success view - export complete
 */
export function SuccessView({ result, onDone }: SuccessViewProps) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="export-success"
      className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)] mb-6 border border-[var(--color-success)]/20">
        <Check size={24} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-medium text-[var(--color-fg-default)] mb-2">
        {t("export.success.title")}
      </h3>
      <p className="text-[var(--color-fg-muted)] text-sm mb-8">
        {t("export.success.description")}
      </p>

      <div className="w-full max-w-sm mb-8 text-left">
        <div className="text-(--text-label) font-semibold text-[var(--color-fg-placeholder)] uppercase tracking-(--tracking-wider) mb-2">
          {t("export.success.resultLabel")}
        </div>
        <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] space-y-1">
          <div className="text-xs text-[var(--color-fg-muted)]">
            <span className="font-mono">
              {t("workbench.export.fieldRelativePath")}
            </span>
            :{" "}
            <span
              data-testid="export-success-relative-path"
              className="font-mono"
            >
              {result.relativePath}
            </span>
          </div>
          <div className="text-xs text-[var(--color-fg-muted)]">
            <span className="font-mono">
              {t("workbench.export.fieldBytesWritten")}
            </span>
            :{" "}
            <span
              data-testid="export-success-bytes-written"
              className="font-mono"
            >
              {result.bytesWritten}
            </span>
          </div>
        </div>
      </div>

      <Button
        data-testid="export-done"
        variant="primary"
        onClick={onDone}
        className="!bg-[var(--color-bg-base)] !text-[var(--color-fg-default)] hover:!bg-[var(--color-bg-hover)]"
      >
        {t("export.action.done")}
      </Button>
    </div>
  );
}
