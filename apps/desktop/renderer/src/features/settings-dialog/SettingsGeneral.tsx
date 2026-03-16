import React from "react";
import { useTranslation } from "react-i18next";

import { Toggle } from "../../components/primitives/Toggle";
import { Slider } from "../../components/primitives/Slider";
import { Select } from "../../components/primitives";
import { FormField } from "../../components/composites/FormField";
import { i18n } from "../../i18n";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "../../i18n/languagePreference";

/**
 * Settings state for General page
 */
export interface GeneralSettings {
  focusMode: boolean;
  typewriterScroll: boolean;
  smartPunctuation: boolean;
  localAutoSave: boolean;
  backupInterval: string;
  defaultTypography: string;
  interfaceScale: number;
}

/**
 * SettingsGeneral page props
 */
export interface SettingsGeneralProps {
  /** Current settings values */
  settings: GeneralSettings;
  /** Whether to distinguish AI edits in version history */
  showAiMarks: boolean;
  /** Callback for AI mark preference updates */
  onShowAiMarksChange: (enabled: boolean) => void;
  /** Callback when settings change */
  onSettingsChange: (settings: GeneralSettings) => void;
}

/**
 * Section label styles (uppercase label from design spec)
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
 * Backup interval options — retained for v0.2 (A0-17: hidden in v0.1)
 */
// const backupIntervalOptions = [
//   { value: "5min", label: "Every 5 minutes" },
//   { value: "15min", label: "Every 15 minutes" },
//   { value: "1hour", label: "Every hour" },
// ];

/**
 * Typography options
 */
const typographyOptions = [
  { value: "inter", label: "Inter (Sans-Serif)" },
  { value: "merriweather", label: "Merriweather (Serif)" },
  { value: "jetbrains", label: "JetBrains Mono (Monospace)" },
];

/**
 * SettingsGeneral page component
 *
 * General settings page with Writing Experience, Data & Storage, and Editor Defaults sections.
 * Uses real content from the design spec.
 */
export function SettingsGeneral({
  settings,
  showAiMarks,
  onShowAiMarksChange,
  onSettingsChange,
}: SettingsGeneralProps): JSX.Element {
  const { t } = useTranslation();

  const languageOptions = React.useMemo(
    () => [
      { value: "zh-CN", label: t("settingsDialog.general.zhCN") },
      { value: "en", label: "English" },
    ],
    [t],
  );

  const [currentLanguage, setCurrentLanguage] = React.useState(() =>
    getLanguagePreference(),
  );

  const handleLanguageChange = React.useCallback((value: string) => {
    setCurrentLanguage(value);
    setLanguagePreference(value);
    void i18n.changeLanguage(value);
  }, []);

  const updateSetting = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="max-w-[560px]">
      {/* Header */}
      <h1 className="text-2xl font-normal text-[var(--color-fg-default)] mb-2 tracking-tight">
        {t("settingsDialog.general.title")}
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        {t("settingsDialog.general.subtitle")}
      </p>

      {/* Language Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.general.language")}
        </h4>
        <FormField
          label={t("settings.general.displayLanguage")}
          htmlFor="display-language"
          help={t("settings.general.displayLanguageHelp")}
        >
          <Select
            options={languageOptions}
            value={currentLanguage}
            onValueChange={handleLanguageChange}
            fullWidth
          />
        </FormField>
      </div>

      <div className={dividerStyles} />

      {/* Writing Experience Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.general.writingExperience")}
        </h4>

        <div className="flex flex-col gap-8">
          <Toggle
            label={t("settings.general.focusMode")}
            description={t("settings.general.focusModeDescription")}
            checked={settings.focusMode}
            onCheckedChange={(checked) => updateSetting("focusMode", checked)}
          />

          <Toggle
            label={t("settings.general.typewriterScroll")}
            description={t("settings.general.typewriterScrollDescription")}
            checked={settings.typewriterScroll}
            onCheckedChange={(checked) =>
              updateSetting("typewriterScroll", checked)
            }
          />

          <Toggle
            label={t("settings.general.smartPunctuation")}
            description={t("settings.general.smartPunctuationDescription")}
            checked={settings.smartPunctuation}
            onCheckedChange={(checked) =>
              updateSetting("smartPunctuation", checked)
            }
          />
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Data & Storage Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.general.dataAndStorage")}
        </h4>

        <div className="flex flex-col gap-6">
          <Toggle
            label={t("settings.general.localAutoSave")}
            description={t("settings.general.localAutoSaveDescription")}
            checked={settings.localAutoSave}
            onCheckedChange={(checked) =>
              updateSetting("localAutoSave", checked)
            }
          />

          {/* A0-17: Backup interval hidden — no backend in v0.1 (see openspec/changes/archive/a0-17-backup-entry-resolution/decision.md) */}
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Editor Defaults Section */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>
          {t("settingsDialog.general.editorDefaults")}
        </h4>

        <div className="flex flex-col gap-8 mb-8">
          <Toggle
            label={t("settings.general.differentiateAiEdits")}
            description={t(
              "settingsDialog.general.differentiateAiEditsDescription",
              { marker: t("settingsDialog.general.aiModifyMarker") },
            )}
            checked={showAiMarks}
            onCheckedChange={onShowAiMarksChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <FormField
            label={t("settings.general.defaultTypography")}
            htmlFor="default-typography"
          >
            <Select
              options={typographyOptions}
              value={settings.defaultTypography}
              onValueChange={(value) =>
                updateSetting("defaultTypography", value)
              }
              fullWidth
            />
          </FormField>

          <FormField
            label={t("settings.general.interfaceScale")}
            htmlFor="interface-scale"
          >
            <Slider
              min={80}
              max={120}
              step={10}
              value={settings.interfaceScale}
              onValueChange={(value) => updateSetting("interfaceScale", value)}
              showLabels
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}

/**
 * Default settings values
 */
export const defaultGeneralSettings: GeneralSettings = {
  focusMode: true,
  typewriterScroll: false,
  smartPunctuation: true,
  localAutoSave: true,
  backupInterval: "5min",
  defaultTypography: "inter",
  interfaceScale: 100,
};
