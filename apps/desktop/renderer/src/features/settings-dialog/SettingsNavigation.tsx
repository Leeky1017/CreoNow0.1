import { useTranslation } from "react-i18next";
import { Button, Text } from "../../components/primitives";
import type { SettingsTab } from "./SettingsDialog";

/**
 * Sidebar styles.
 */
const sidebarStyles = [
  "w-64",
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
  "text-(--text-body)",
  "rounded-[var(--radius-sm)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Nav item configuration.
 */
function getNavItems(
  t: TFunction,
): Array<{ value: SettingsTab; label: string }> {
  return [
    { value: "general", label: t("settingsDialog.dialog.navGeneral") },
    { value: "appearance", label: t("settingsDialog.dialog.navAppearance") },
    { value: "ai", label: t("settingsDialog.dialog.navAi") },
    { value: "judge", label: t("settingsDialog.dialog.navJudge") },
    { value: "analytics", label: t("settingsDialog.dialog.navAnalytics") },
    { value: "account", label: t("settingsDialog.dialog.navAccount") },
    { value: "export", label: t("settingsDialog.dialog.navExport") },
    { value: "shortcuts", label: t("settingsDialog.dialog.navShortcuts") },
  ];
}

export interface SettingsNavigationProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/**
 * Settings sidebar navigation.
 */
export function SettingsNavigation({
  activeTab,
  onTabChange,
}: SettingsNavigationProps): JSX.Element {
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  return (
    <div className={sidebarStyles}>
      <div className="px-8 mb-8">
        <Text
          size="label"
          color="placeholder"
          weight="semibold"
          className="tracking-[0.15em]"
        >
          {t("settingsDialog.dialog.title")}
        </Text>
      </div>

      <nav className="flex flex-col w-full">
        {navItems.map(({ value, label }) => {
          const isActive = activeTab === value;
          return (
            <Button
              key={value}
              onClick={() => onTabChange(value)}
              data-testid={`settings-nav-${value}`}
              variant="ghost"
              className={`${navButtonBaseStyles} ${
                isActive
                  ? "text-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-surface)] border-transparent"
              }`}
            >
              {label}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
