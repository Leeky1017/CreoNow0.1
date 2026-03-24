import { useTranslation } from "react-i18next";
import { Toggle } from "../../components/primitives/Toggle";
import { Slider } from "../../components/primitives/Slider";
import { Button, Select } from "../../components/primitives";
import { FormField } from "../../components/composites/FormField";
import type { GeneralSettings } from "./SettingsGeneral";

const sectionLabelStyles =
  "text-(--text-label) uppercase tracking-[0.15em] text-[var(--color-fg-placeholder)] font-semibold mb-6";

const BACKUP_INTERVAL_VALUES = ["5min", "15min", "1hour"] as const;

interface WritingSectionProps {
  settings: GeneralSettings;
  onUpdate: <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => void;
}

export function WritingExperienceSection({
  settings,
  onUpdate,
}: WritingSectionProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="mb-14">
      <h4 className={sectionLabelStyles}>
        {t("settingsDialog.general.writingExperience")}
      </h4>
      <div className="flex flex-col gap-8">
        <Toggle
          label={t("settings.general.focusMode")}
          description={t("settings.general.focusModeDescription")}
          checked={settings.focusMode}
          onCheckedChange={(checked) => onUpdate("focusMode", checked)}
        />
        <Toggle
          label={t("settings.general.typewriterScroll")}
          description={t("settings.general.typewriterScrollDescription")}
          checked={settings.typewriterScroll}
          onCheckedChange={(checked) => onUpdate("typewriterScroll", checked)}
        />
        <Toggle
          label={t("settings.general.smartPunctuation")}
          description={t("settings.general.smartPunctuationDescription")}
          checked={settings.smartPunctuation}
          onCheckedChange={(checked) => onUpdate("smartPunctuation", checked)}
        />
      </div>
    </div>
  );
}

interface DataStorageSectionProps {
  settings: GeneralSettings;
  onUpdate: <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => void;
  onManualBackup?: () => void | Promise<void>;
  onManualRestore?: () => void | Promise<void>;
  manualBackupLoading: boolean;
  manualRestoreLoading: boolean;
  backupActionsDisabled: boolean;
}

export function DataStorageSection({
  settings,
  onUpdate,
  onManualBackup,
  onManualRestore,
  manualBackupLoading,
  manualRestoreLoading,
  backupActionsDisabled,
}: DataStorageSectionProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="mb-14">
      <h4 className={sectionLabelStyles}>
        {t("settingsDialog.general.dataAndStorage")}
      </h4>
      <div className="flex flex-col gap-6">
        <Toggle
          label={t("settings.general.localAutoSave")}
          description={t("settings.general.localAutoSaveDescription")}
          checked={settings.localAutoSave}
          onCheckedChange={(checked) => onUpdate("localAutoSave", checked)}
        />
        <FormField
          label={t("settings.general.backupInterval")}
          htmlFor="backup-interval"
          help={t("settings.general.backupIntervalHelp")}
        >
          <Select
            options={BACKUP_INTERVAL_VALUES.map((v) => ({
              value: v,
              label: t(`settings.general.backupOption_${v}`),
            }))}
            value={settings.backupInterval}
            onValueChange={(value) => onUpdate("backupInterval", value)}
            fullWidth
          />
        </FormField>
        <FormField
          label={t("settings.general.manualBackup")}
          htmlFor="manual-backup-actions"
          help={t("settings.general.manualBackupHelp")}
        >
          <div
            id="manual-backup-actions"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <Button
              variant="secondary"
              onClick={() => {
                void onManualBackup?.();
              }}
              loading={manualBackupLoading}
              disabled={backupActionsDisabled}
            >
              {t("settings.general.backupNow")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void onManualRestore?.();
              }}
              loading={manualRestoreLoading}
              disabled={backupActionsDisabled}
            >
              {t("settings.general.restoreLatest")}
            </Button>
          </div>
        </FormField>
      </div>
    </div>
  );
}

const typographyOptions = [
  { value: "inter", label: "Inter (Sans-Serif)" },
  { value: "merriweather", label: "Merriweather (Serif)" },
  { value: "jetbrains", label: "JetBrains Mono (Monospace)" },
];

interface EditorDefaultsSectionProps {
  settings: GeneralSettings;
  showAiMarks: boolean;
  onShowAiMarksChange: (enabled: boolean) => void;
  onUpdate: <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => void;
}

export function EditorDefaultsSection({
  settings,
  showAiMarks,
  onShowAiMarksChange,
  onUpdate,
}: EditorDefaultsSectionProps): JSX.Element {
  const { t } = useTranslation();
  return (
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
            onValueChange={(value) => onUpdate("defaultTypography", value)}
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
            onValueChange={(value) => onUpdate("interfaceScale", value)}
            showLabels
          />
        </FormField>
      </div>
    </div>
  );
}
