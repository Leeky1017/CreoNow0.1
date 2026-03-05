import React from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { Text } from "../../components/primitives";
import { AnalyticsPageContent } from "../analytics/AnalyticsPage";
import { AppearanceSection } from "../settings/AppearanceSection";
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
import { useVersionPreferencesStore } from "../../stores/versionPreferencesStore";

import { X } from "lucide-react";
/**
 * Settings tab values.
 */
export type SettingsTab =
  | "general"
  | "appearance"
  | "ai"
  | "judge"
  | "analytics"
  | "account";

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

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Nav item configuration.
 */
function getNavItems(t: TFunction): Array<{ value: SettingsTab; label: string }> {
  return [
    { value: "general", label: t('settingsDialog.dialog.navGeneral') },
    { value: "appearance", label: t('settingsDialog.dialog.navAppearance') },
    { value: "ai", label: t('settingsDialog.dialog.navAi') },
    { value: "judge", label: t('settingsDialog.dialog.navJudge') },
    { value: "analytics", label: t('settingsDialog.dialog.navAnalytics') },
    { value: "account", label: t('settingsDialog.dialog.navAccount') },
  ];
}

/**
 * Overlay styles.
 */
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

/**
 * Content styles.
 */
const contentStyles = [
  "fixed",
  "left-1/2",
  "top-1/2",
  "-translate-x-1/2",
  "-translate-y-1/2",
  "z-[var(--z-modal)]",
  "w-[1000px]",
  "h-[700px]",
  "bg-[var(--color-bg-surface)]",
  "border",
  "border-[var(--color-border-default)]",
  "rounded-[var(--radius-lg)]",
  "shadow-2xl",
  "flex",
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

/**
 * Sidebar styles.
 */
const sidebarStyles = [
  "w-[260px]",
  "bg-[var(--color-bg-base)]",
  "border-r",
  "border-[var(--color-separator)]",
  "flex",
  "flex-col",
  "py-8",
  "shrink-0",
].join(" ");

/**
 * Nav button styles.
 */
const navButtonBaseStyles = [
  "w-full",
  "text-left",
  "px-8",
  "py-3",
  "text-[13px]",
  "border-r-2",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

/**
 * Close button styles.
 * Positioned at dialog's top-right corner (outside content padding).
 */
const closeButtonStyles = [
  "absolute",
  "top-4",
  "right-4",
  "p-2",
  "text-[var(--color-fg-placeholder)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "z-[var(--z-overlay)]",
  "hover:bg-[var(--color-bg-hover)]",
  "rounded-full",
].join(" ");

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
  const navItems = getNavItems(t);
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(defaultTab);
  const [generalSettings, setGeneralSettings] = React.useState<GeneralSettings>(
    defaultGeneralSettings,
  );
  const [accountSettings] = React.useState<AccountSettings>(
    defaultAccountSettings,
  );
  const showAiMarks = useVersionPreferencesStore((s) => s.showAiMarks);
  const setShowAiMarks = useVersionPreferencesStore((s) => s.setShowAiMarks);

  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, open]);

  function renderContent(): JSX.Element {
    switch (activeTab) {
      case "general":
        return (
          <SettingsGeneral
            settings={generalSettings}
            showAiMarks={showAiMarks}
            onShowAiMarksChange={setShowAiMarks}
            onSettingsChange={setGeneralSettings}
          />
        );
      case "appearance":
        return <AppearanceSection />;
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
          {/* Sidebar Navigation */}
          <div className={sidebarStyles}>
            <div className="px-8 mb-8">
              <Text
                size="label"
                color="placeholder"
                weight="semibold"
                className="tracking-[0.15em]"
              >
                {t('settingsDialog.dialog.title')}
              </Text>
            </div>

            <nav className="flex flex-col w-full">
              {navItems.map(({ value, label }) => {
                const isActive = activeTab === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    data-testid={`settings-nav-${value}`}
                    className={`${navButtonBaseStyles} ${
                      isActive
                        ? "text-[var(--color-fg-default)] bg-[var(--color-bg-hover)] border-[var(--color-fg-default)]"
                        : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-surface)] border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-[var(--color-bg-surface)] flex flex-col relative min-w-0">
            {/* Close button */}
            <DialogPrimitive.Close className={closeButtonStyles}>
              <X size={20} strokeWidth={1.5} />
              <span className="sr-only">{t('settingsDialog.dialog.close')}</span>
            </DialogPrimitive.Close>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-12 py-10">
              <div className="flex flex-col gap-3.5">{renderContent()}</div>
            </div>

            {/* Hidden title for accessibility */}
            <DialogPrimitive.Title className="sr-only">
              {t('settingsDialog.dialog.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {t('settingsDialog.dialog.description')}
            </DialogPrimitive.Description>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
