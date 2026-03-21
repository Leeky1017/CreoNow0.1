import React from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { AnalyticsPageContent } from "../analytics/AnalyticsPage";
import {
  SettingsAppearancePage,
  defaultAppearanceSettings,
  type AppearanceSettings,
} from "./SettingsAppearancePage";
import { useThemeStore } from "../../stores/themeStore";
import { AiSettingsSection } from "../settings/AiSettingsSection";
import { JudgeSection } from "../settings/JudgeSection";
import {
  SettingsGeneral,
  defaultGeneralSettings,
  type GeneralSettings,
} from "./SettingsGeneral";
import {
  SettingsAccount,
  defaultAccountSettings,
  type AccountSettings,
} from "./SettingsAccount";
import {
  SettingsExport,
  defaultExportSettings,
  type ExportSettings,
} from "./SettingsExport";
import { ShortcutsPanel } from "../shortcuts/ShortcutsPanel";
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";
import { useAppToast } from "../../components/providers/AppToastProvider";
import { usePreferences } from "../../contexts/PreferencesContext";
import type { PreferenceStore } from "../../lib/preferences";

import { X } from "lucide-react";
import { SettingsNavigation } from "./SettingsNavigation";
import {
  overlayStyles,
  contentStyles,
  closeButtonStyles,
} from "./settingsDialogStyles";
import { useSettingsBackup } from "./useSettingsBackup";
/**
 * Settings tab values.
 */
export type SettingsTab =
  | "general"
  | "appearance"
  | "ai"
  | "judge"
  | "analytics"
  | "account"
  | "export"
  | "shortcuts";

/**
 * SettingsDialog props.
 */
export interface SettingsDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Initial active tab */
  defaultTab?: SettingsTab;
}

/**
 * Read persisted GeneralSettings from PreferenceStore, falling back to defaults.
 */
function readGeneralSettings(prefs: PreferenceStore): GeneralSettings {
  return {
    focusMode:
      prefs.get<boolean>("creonow.settings.focusMode") ??
      defaultGeneralSettings.focusMode,
    typewriterScroll:
      prefs.get<boolean>("creonow.settings.typewriterScroll") ??
      defaultGeneralSettings.typewriterScroll,
    smartPunctuation:
      prefs.get<boolean>("creonow.settings.smartPunctuation") ??
      defaultGeneralSettings.smartPunctuation,
    localAutoSave:
      prefs.get<boolean>("creonow.settings.localAutoSave") ??
      defaultGeneralSettings.localAutoSave,
    backupInterval:
      prefs.get<string>("creonow.settings.backupInterval") ??
      defaultGeneralSettings.backupInterval,
    defaultTypography:
      prefs.get<string>("creonow.settings.defaultFont") ??
      defaultGeneralSettings.defaultTypography,
    interfaceScale:
      prefs.get<number>("creonow.settings.interfaceScale") ??
      defaultGeneralSettings.interfaceScale,
  };
}

/**
 * Write GeneralSettings to PreferenceStore.
 */
function writeGeneralSettings(
  prefs: PreferenceStore,
  settings: GeneralSettings,
): void {
  prefs.set("creonow.settings.focusMode", settings.focusMode);
  prefs.set("creonow.settings.typewriterScroll", settings.typewriterScroll);
  prefs.set("creonow.settings.smartPunctuation", settings.smartPunctuation);
  prefs.set("creonow.settings.localAutoSave", settings.localAutoSave);
  prefs.set("creonow.settings.backupInterval", settings.backupInterval);
  prefs.set("creonow.settings.defaultFont", settings.defaultTypography);
  prefs.set("creonow.settings.interfaceScale", settings.interfaceScale);
}

function readAppearancePrefs(prefs: PreferenceStore) {
  const d = defaultAppearanceSettings;
  return {
    accentColor:
      prefs.get<string>("creonow.settings.accentColor") ?? d.accentColor,
    fontSize: prefs.get<number>("creonow.settings.fontSize") ?? d.fontSize,
  };
}

/**
 * SettingsDialog is the single-path Settings surface.
 *
 * Why: Settings must be reachable via a single, testable entry point (Cmd/Ctrl+,,
 * CommandPalette, IconBar) and must absorb legacy SettingsPanel capabilities.
 */
export function SettingsDialog({
  open,
  onOpenChange,
  defaultTab = "general",
}: SettingsDialogProps): JSX.Element {
  const { t } = useTranslation();
  const { showToast } = useAppToast();
  const preferences = usePreferences();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(defaultTab);
  const [generalSettings, setGeneralSettings] = React.useState<GeneralSettings>(
    () => readGeneralSettings(preferences),
  );
  const [accountSettings] = React.useState<AccountSettings>(
    defaultAccountSettings,
  );
  const [exportSettings, setExportSettings] = React.useState<ExportSettings>(
    defaultExportSettings,
  );
  const {
    currentProjectId,
    manualBackupLoading,
    manualRestoreLoading,
    handleManualBackup,
    handleManualRestore,
  } = useSettingsBackup();
  const showAiMarks = useVersionPreferencesStore((s) => s.showAiMarks);
  const setShowAiMarks = useVersionPreferencesStore((s) => s.setShowAiMarks);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [appPrefs, setAppPrefs] = React.useState(() =>
    readAppearancePrefs(preferences),
  );

  const handleSettingsChange = React.useCallback(
    (settings: GeneralSettings) => {
      setGeneralSettings(settings);
      writeGeneralSettings(preferences, settings);
    },
    [preferences],
  );

  const handleShowAiMarksChange = React.useCallback(
    (enabled: boolean) => {
      const persisted = setShowAiMarks(enabled);
      if (persisted) {
        showToast({
          title: t("toast.settings.success.title"),
          variant: "success",
        });
      }
    },
    [setShowAiMarks, showToast, t],
  );

  const handleAppearanceChange = React.useCallback(
    (s: AppearanceSettings) => {
      setThemeMode(s.themeMode);
      setAppPrefs({ accentColor: s.accentColor, fontSize: s.fontSize });
      preferences.set("creonow.settings.accentColor", s.accentColor);
      preferences.set("creonow.settings.fontSize", s.fontSize);
    },
    [preferences, setThemeMode],
  );

  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setGeneralSettings(readGeneralSettings(preferences));
      setAppPrefs(readAppearancePrefs(preferences));
    }
  }, [defaultTab, open, preferences]);

  function renderContent(): JSX.Element {
    switch (activeTab) {
      case "general":
        return (
          <SettingsGeneral
            settings={generalSettings}
            showAiMarks={showAiMarks}
            onShowAiMarksChange={handleShowAiMarksChange}
            onSettingsChange={handleSettingsChange}
            onManualBackup={handleManualBackup}
            onManualRestore={handleManualRestore}
            manualBackupLoading={manualBackupLoading}
            manualRestoreLoading={manualRestoreLoading}
            backupActionsDisabled={currentProjectId === null}
          />
        );
      case "appearance":
        return (
          <SettingsAppearancePage
            settings={{ themeMode, ...appPrefs }}
            onSettingsChange={handleAppearanceChange}
          />
        );
      case "ai":
        return <AiSettingsSection />;
      case "judge":
        return <JudgeSection />;
      case "analytics":
        return <AnalyticsPageContent />;
      case "account":
        return (
          <SettingsAccount
            account={accountSettings}
            onUpgrade={() => {
              // TODO(#571): Implement upgrade flow when account system is ready
            }}
            onDeleteAccount={() => {
              // TODO(#571): Implement delete account when account system is ready
            }}
          />
        );
      case "export":
        return (
          <SettingsExport
            settings={exportSettings}
            onSettingsChange={setExportSettings}
          />
        );
      case "shortcuts":
        return <ShortcutsPanel />;
      default: {
        const _exhaustive: never = activeTab;
        return _exhaustive;
      }
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={overlayStyles} />
        <DialogPrimitive.Content
          data-testid="settings-dialog"
          className={contentStyles}
        >
          <SettingsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Main Content Area */}
          <div className="flex-1 bg-[var(--color-bg-surface)] flex flex-col relative min-w-0">
            {/* Close button */}
            <DialogPrimitive.Close className={closeButtonStyles}>
              <X size={20} strokeWidth={1.5} />
              <span className="sr-only">
                {t("settingsDialog.dialog.close")}
              </span>
            </DialogPrimitive.Close>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scroll-shadow-y px-12 py-10">
              <div className="flex flex-col gap-3.5">{renderContent()}</div>
            </div>

            {/* Hidden title for accessibility */}
            <DialogPrimitive.Title className="sr-only">
              {t("settingsDialog.dialog.title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {t("settingsDialog.dialog.description")}
            </DialogPrimitive.Description>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
