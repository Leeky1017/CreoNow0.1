import React from "react";
import { useTranslation } from "react-i18next";

import { Select } from "../../components/primitives";
import { FormField } from "../../components/composites/FormField";
import { i18n } from "../../i18n";
import {
  getLanguagePreference,
  setLanguagePreference,
} from "../../i18n/languagePreference";
import {
  WritingExperienceSection,
  DataStorageSection,
  EditorDefaultsSection,
} from "./SettingsGeneralSections";

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
  settings: GeneralSettings;
  showAiMarks: boolean;
  onShowAiMarksChange: (enabled: boolean) => void;
  onSettingsChange: (settings: GeneralSettings) => void;
  onManualBackup?: () => void | Promise<void>;
  onManualRestore?: () => void | Promise<void>;
  manualBackupLoading?: boolean;
  manualRestoreLoading?: boolean;
  backupActionsDisabled?: boolean;
}

const sectionLabelStyles =
  "text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-placeholder)] font-semibold mb-6";
const dividerStyles = "w-full h-px bg-[var(--color-separator)] my-12";

export function SettingsGeneral({
  settings,
  showAiMarks,
  onShowAiMarksChange,
  onSettingsChange,
  onManualBackup,
  onManualRestore,
  manualBackupLoading = false,
  manualRestoreLoading = false,
  backupActionsDisabled = false,
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
    // 审计：v1-13 #004 KEEP
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- 技术原因：settings content width per design spec (max-w-[560px])
    <div className="max-w-[560px]">
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

      <WritingExperienceSection settings={settings} onUpdate={updateSetting} />

      <div className={dividerStyles} />

      <DataStorageSection
        settings={settings}
        onUpdate={updateSetting}
        onManualBackup={onManualBackup}
        onManualRestore={onManualRestore}
        manualBackupLoading={manualBackupLoading}
        manualRestoreLoading={manualRestoreLoading}
        backupActionsDisabled={backupActionsDisabled}
      />

      <div className={dividerStyles} />

      <EditorDefaultsSection
        settings={settings}
        showAiMarks={showAiMarks}
        onShowAiMarksChange={onShowAiMarksChange}
        onUpdate={updateSetting}
      />
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
