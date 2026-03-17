import { useTranslation } from "react-i18next";
import { Toggle } from "../../components/primitives/Toggle";
import { Button, Text } from "../../components/primitives";

import { File, FileCode, FileText } from "lucide-react";
/**
 * Export format types
 */
export type ExportFormat = "pdf" | "markdown" | "word" | "txt";

/**
 * Export settings state
 */
export interface ExportSettings {
  defaultFormat: ExportFormat;
  includeMetadata: boolean;
  autoGenerateFilename: boolean;
}

/**
 * SettingsExport page props
 */
export interface SettingsExportProps {
  /** Current settings values */
  settings: ExportSettings;
  /** Callback when settings change */
  onSettingsChange: (settings: ExportSettings) => void;
}

/**
 * Section label styles
 */
const sectionLabelStyles = [
  "text-[10px]",
  "uppercase",
  "tracking-[0.15em]",
  "text-[var(--color-fg-placeholder)]",
  "font-semibold",
  "mb-6",
].join(" ");

/**
 * Divider styles
 */
const dividerStyles = [
  "w-full",
  "h-px",
  "bg-[var(--color-separator)]",
  "my-12",
].join(" ");

/**
 * Format icon component
 */
function FormatIcon({ format }: { format: ExportFormat }): JSX.Element {
  const iconMap: Record<ExportFormat, JSX.Element> = {
    pdf: <FileText size={24} strokeWidth={1.5} />,
    markdown: <FileCode size={24} strokeWidth={1.5} />,
    word: <FileText size={24} strokeWidth={1.5} />,
    txt: <File size={24} strokeWidth={1.5} />,
  };

  return iconMap[format];
}

/**
 * Format card button styles
 */
const formatCardBaseStyles = [
  "flex",
  "flex-col",
  "items-center",
  "gap-2",
  "p-4",
  "rounded-[var(--radius-md)]",
  "border",
  "cursor-pointer",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "text-[var(--color-fg-muted)]",
].join(" ");

/**
 * SettingsExport page component
 *
 * Export & Share settings page with format selection and export options.
 */
export function SettingsExport({
  settings,
  onSettingsChange,
}: SettingsExportProps): JSX.Element {
  const { t } = useTranslation();
  const updateSetting = <K extends keyof ExportSettings>(
    key: K,
    value: ExportSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const formats: { value: ExportFormat; label: string; sublabel: string }[] = [
    {
      value: "pdf",
      label: t("settingsDialog.export.formatPdf"),
      sublabel: t("settingsDialog.export.formatPdfSub"),
    },
    {
      value: "markdown",
      label: t("settingsDialog.export.formatMarkdown"),
      sublabel: ".md",
    },
    {
      value: "word",
      label: t("settingsDialog.export.formatWord"),
      sublabel: ".docx",
    },
    {
      value: "txt",
      label: t("settingsDialog.export.formatTxt"),
      sublabel: ".txt",
    },
  ];

  return (
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- settings content width per design spec
    <div className="max-w-[560px]">
      {/* Header */}
      <h1 className="text-2xl font-normal text-[var(--color-fg-default)] mb-2 tracking-tight">
        {t("settingsDialog.export.title")}
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        {t("settingsDialog.export.subtitle")}
      </p>

      {/* Default Export Format */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.export.defaultFormat")}
        </h4>

        <div className="grid grid-cols-2 gap-4">
          {formats.map(({ value, label, sublabel }) => {
            const isSelected = settings.defaultFormat === value;
            return (
              <Button
                key={value}
                variant="ghost"
                onClick={() => updateSetting("defaultFormat", value)}
                className={`${formatCardBaseStyles} ${
                  isSelected
                    ? "border-[var(--color-fg-default)] bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]"
                    : "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <FormatIcon format={value} />
                <div className="flex flex-col items-center">
                  <Text
                    size="small"
                    color={isSelected ? "default" : "muted"}
                    weight="medium"
                  >
                    {label}
                  </Text>
                  <Text size="tiny" color="subtle">
                    {sublabel}
                  </Text>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Export Options */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.export.options")}
        </h4>

        <div className="flex flex-col gap-8">
          <Toggle
            label={t("settingsDialog.export.includeMetadata")}
            description={t("settingsDialog.export.includeMetadataDescription")}
            checked={settings.includeMetadata}
            onCheckedChange={(checked) =>
              updateSetting("includeMetadata", checked)
            }
          />

          <Toggle
            label={t("settingsDialog.export.autoGenerateFilename")}
            description={t(
              "settingsDialog.export.autoGenerateFilenameDescription",
            )}
            checked={settings.autoGenerateFilename}
            onCheckedChange={(checked) =>
              updateSetting("autoGenerateFilename", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Default export settings
 */
export const defaultExportSettings: ExportSettings = {
  defaultFormat: "pdf",
  includeMetadata: true,
  autoGenerateFilename: true,
};
