import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Select, Tooltip } from "../../components/primitives";
import type {
  ExportFormat,
  ExportOptions,
  PageSize,
} from "./useExportConfig";
import type { FormatOption } from "./useExportConfig";
import {
  formatExportErrorDisplay,
  getPageSizeOptions,
  getUnsupportedReason,
} from "./useExportConfig";
import type { IpcError } from "@shared/types/ipc-generated";
import { File, FileCode, FileText } from "lucide-react";
import { ExportPreview } from "./ExportPreview";

// ============================================================================
// Styles
// ============================================================================

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

/**
 * Format options
 */
export function getFormatOptions(t: TFunction): FormatOption[] {
  return [
    {
      value: "pdf",
      label: "PDF",
      description: t("export.format.pdfStructuredHint"),
      icon: <FileText size={20} strokeWidth={1.5} />,
    },
    {
      value: "markdown",
      label: "Markdown",
      description: t("export.format.markdownStructuredHint"),
      icon: <FileCode size={20} strokeWidth={1.5} />,
    },
    {
      value: "docx",
      label: "Word",
      description: t("export.format.docxStructuredHint"),
      icon: <FileText size={20} strokeWidth={1.5} />,
    },
    {
      value: "txt",
      label: t("export.format.plainText"),
      description: t("export.format.txtBoundaryHint"),
      icon: <File size={20} strokeWidth={1.5} />,
    },
  ];
}

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
          {t("export.format.unsupported")}
        </div>
      ) : null}

      <div
        className={`absolute top-3 right-3 ${radioIndicatorStyles(isSelected)}`}
      />

      <div
        className={`mb-2 ${
          isSelected
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-fg-muted)]"
        }`}
      >
        {option.icon}
      </div>

      <div className="font-medium text-sm text-[var(--color-fg-default)]">
        {option.label}
      </div>

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

// ============================================================================
// ConfigView (ExportFormatTab)
// ============================================================================

interface ExportFormatTabProps {
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onExport: () => void;
  onCancel: () => void;
  estimatedSize: string;
  exportDisabledReason: string | null;
  error: IpcError | null;
  onDismissError: () => void;
}

/**
 * Config view - format selection, options, and preview
 */
export function ExportFormatTab({
  options,
  onOptionsChange,
  onExport,
  onCancel,
  estimatedSize,
  exportDisabledReason,
  error,
  onDismissError,
}: ExportFormatTabProps) {
  const { t } = useTranslation();
  const isPdfFormat = options.format === "pdf";
  const errorDisplayMessage = error ? formatExportErrorDisplay(t, error) : null;

  return (
    <>
      <div className="overflow-y-auto p-6 space-y-6">
        {error ? (
          <div
            data-testid="export-error"
            role="alert"
            className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-xs text-[var(--color-text-error)]">
                <div data-testid="export-error-message">
                  {errorDisplayMessage}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissError}
                className="shrink-0"
              >
                {t("export.action.dismiss")}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Format Selection */}
        <div>
          <span className={labelStyles}>{t("export.config.formatLabel")}</span>
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
          <div className="space-y-3">
            <span className={labelStyles}>
              {t("export.config.settingsLabel")}
            </span>

            <Checkbox
              checked={options.includeMetadata}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  includeMetadata: checked === true,
                })
              }
              label={t("export.config.includeMetadata")}
            />

            <Checkbox
              checked={options.versionHistory}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  versionHistory: checked === true,
                })
              }
              label={t("export.config.versionHistory")}
            />

            <Checkbox
              checked={options.embedImages}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  embedImages: checked === true,
                })
              }
              label={t("export.config.embedImages")}
            />
          </div>

          <div className="space-y-3">
            <span className={labelStyles}>
              {t("export.config.pageSizeLabel")}
            </span>
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
        <ExportPreview format={options.format} pageSize={options.pageSize} />
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
            {t("export.action.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={onExport}
            data-testid="export-submit"
            disabled={exportDisabledReason !== null}
          >
            {t("export.action.export")}
          </Button>
        </div>
      </div>
    </>
  );
}
