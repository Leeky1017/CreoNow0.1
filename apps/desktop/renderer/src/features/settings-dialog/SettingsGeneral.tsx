import React from "react";

import { Toggle } from "../../components/primitives/Toggle";
import { Slider } from "../../components/primitives/Slider";
import { Select } from "../../components/primitives";
import { Text } from "../../components/primitives";
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
  "bg-[var(--color-border-default)]",
  "my-12",
].join(" ");

/**
 * Field label styles
 */
const fieldLabelStyles = ["text-[13px]", "text-[var(--color-fg-muted)]"].join(
  " ",
);

/**
 * Backup interval options
 */
const backupIntervalOptions = [
  { value: "5min", label: "Every 5 minutes" },
  { value: "15min", label: "Every 15 minutes" },
  { value: "1hour", label: "Every hour" },
];

/**
 * Typography options
 */
const typographyOptions = [
  { value: "inter", label: "Inter (Sans-Serif)" },
  { value: "merriweather", label: "Merriweather (Serif)" },
  { value: "jetbrains", label: "JetBrains Mono (Monospace)" },
];

/**
 * Language options
 */
const languageOptions = [
  { value: "zh-CN", label: "中文 (简体)" },
  { value: "en", label: "English" },
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
  const [currentLanguage, setCurrentLanguage] = React.useState(
    () => getLanguagePreference(),
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
        General
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        Customize your writing environment and workflow preferences.
      </p>

      {/* Language Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>Language</h4>
        <div className="flex flex-col gap-3">
          <label className={fieldLabelStyles}>Display Language</label>
          <Select
            options={languageOptions}
            value={currentLanguage}
            onValueChange={handleLanguageChange}
            fullWidth
          />
          <Text size="small" color="placeholder" className="mt-1">
            Changes take effect immediately.
          </Text>
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Writing Experience Section */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>Writing Experience</h4>

        <div className="flex flex-col gap-8">
          <Toggle
            label="Focus Mode"
            description="Dims all interface elements except the editor when you start typing to reduce distractions."
            checked={settings.focusMode}
            onCheckedChange={(checked) => updateSetting("focusMode", checked)}
          />

          <Toggle
            label="Typewriter Scroll"
            description="Keeps your active line of text vertically centered on the screen as you write."
            checked={settings.typewriterScroll}
            onCheckedChange={(checked) =>
              updateSetting("typewriterScroll", checked)
            }
          />

          <Toggle
            label="Smart Punctuation"
            description="Automatically convert straight quotes to curly quotes and double hyphens to em-dashes."
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
        <h4 className={sectionLabelStyles}>Data & Storage</h4>

        <div className="flex flex-col gap-6">
          <Toggle
            label="Local Auto-Save"
            description="Automatically save changes to your browser's local storage."
            checked={settings.localAutoSave}
            onCheckedChange={(checked) =>
              updateSetting("localAutoSave", checked)
            }
          />

          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-[14px] text-[var(--color-fg-default)] font-medium">
              Backup Interval
            </h3>
            <Select
              options={backupIntervalOptions}
              value={settings.backupInterval}
              onValueChange={(value) => updateSetting("backupInterval", value)}
              fullWidth
            />
            <Text size="small" color="placeholder" className="mt-1">
              Last backup: 2 minutes ago
            </Text>
          </div>
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Editor Defaults Section */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>Editor Defaults</h4>

        <div className="flex flex-col gap-8 mb-8">
          <Toggle
            label="Differentiate AI edits"
            description="When enabled, AI-generated entries in Version History show an extra “AI 修改” marker."
            checked={showAiMarks}
            onCheckedChange={onShowAiMarksChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className={fieldLabelStyles}>Default Typography</label>
            <Select
              options={typographyOptions}
              value={settings.defaultTypography}
              onValueChange={(value) =>
                updateSetting("defaultTypography", value)
              }
              fullWidth
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className={fieldLabelStyles}>Interface Scale</label>
            <Slider
              min={80}
              max={120}
              step={10}
              value={settings.interfaceScale}
              onValueChange={(value) => updateSetting("interfaceScale", value)}
              showLabels
            />
          </div>
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
