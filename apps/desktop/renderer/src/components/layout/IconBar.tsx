import {
  FolderOpen,
  Search,
  List,
  History,
  Brain,
  User,
  Network,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  useLayoutStore,
  type DialogType,
  type LeftPanelType,
} from "../../stores/layoutStore";

const iconButtonBase = [
  "w-10",
  "h-10",
  "flex",
  "items-center",
  "justify-center",
  "rounded-[var(--radius-sm)]",
  "bg-transparent",
  "text-[var(--color-fg-muted)]",
  "cursor-pointer",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  "hover:text-[var(--color-fg-default)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const iconButtonInactive = "border-l-2 border-l-transparent";
const iconButtonActive =
  "border-l-2 border-l-[var(--color-accent)] bg-transparent text-[var(--color-fg-default)]";

/**
 * Icon item type for panel navigation.
 */
type IconItem = {
  id: LeftPanelType | DialogType | "search";
  behavior: "docked" | "spotlight" | "dialog";
  dockedPanel?: LeftPanelType;
  dialogType?: DialogType;
  Icon: LucideIcon;
  label: string;
  testId: string;
};

/**
 * Main navigation icons (top section).
 */
const MAIN_ICONS: IconItem[] = [
  {
    id: "files",
    behavior: "docked",
    dockedPanel: "files",
    Icon: FolderOpen,
    label: "workbench.iconBar.files",
    testId: "icon-bar-files",
  },
  {
    id: "search",
    behavior: "spotlight",
    Icon: Search,
    label: "workbench.iconBar.search",
    testId: "icon-bar-search",
  },
  {
    id: "outline",
    behavior: "docked",
    dockedPanel: "outline",
    Icon: List,
    label: "workbench.iconBar.outline",
    testId: "icon-bar-outline",
  },
  {
    id: "versionHistory",
    behavior: "dialog",
    dialogType: "versionHistory",
    Icon: History,
    label: "workbench.iconBar.versionHistory",
    testId: "icon-bar-version-history",
  },
  {
    id: "memory",
    behavior: "dialog",
    dialogType: "memory",
    Icon: Brain,
    label: "workbench.iconBar.memory",
    testId: "icon-bar-memory",
  },
  {
    id: "characters",
    behavior: "dialog",
    dialogType: "characters",
    Icon: User,
    label: "workbench.iconBar.characters",
    testId: "icon-bar-characters",
  },
  {
    id: "knowledgeGraph",
    behavior: "dialog",
    dialogType: "knowledgeGraph",
    Icon: Network,
    label: "workbench.iconBar.knowledgeGraph",
    testId: "icon-bar-knowledge-graph",
  },
];

export interface IconBarProps {
  /** Open SettingsDialog (single-path Settings surface). */
  onOpenSettings: () => void;
  /** Whether SettingsDialog is currently open (for pressed state). */
  settingsOpen?: boolean;
}

/**
 * IconBar is the fixed 48px navigation rail (Windsurf-style).
 *
 * Behavior:
 * - Click a nav icon: switch to that view and expand sidebar if collapsed
 * - Click the same icon again: toggle sidebar collapse
 *
 * Why: Settings must be a single-path dialog surface, so Settings opens a dialog
 * instead of switching the left panel.
 */
export function IconBar({
  onOpenSettings,
  settingsOpen = false,
}: IconBarProps): JSX.Element {
  const { t } = useTranslation();
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((s) => s.setSidebarCollapsed);
  const activeLeftPanel = useLayoutStore((s) => s.activeLeftPanel);
  const setActiveLeftPanel = useLayoutStore((s) => s.setActiveLeftPanel);
  const dialogType = useLayoutStore((s) => s.dialogType);
  const setDialogType = useLayoutStore((s) => s.setDialogType);
  const spotlightOpen = useLayoutStore((s) => s.spotlightOpen);
  const setSpotlightOpen = useLayoutStore((s) => s.setSpotlightOpen);

  /**
   * Handle icon click with Windsurf-style toggle behavior.
   *
   * - If clicking a different panel: switch to it and expand
   * - If clicking the current panel: toggle collapse
   */
  const handleIconClick = (item: IconItem) => {
    if (item.behavior === "docked" && item.dockedPanel) {
      if (activeLeftPanel !== item.dockedPanel) {
        setActiveLeftPanel(item.dockedPanel);
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
        }
      } else {
        setSidebarCollapsed(!sidebarCollapsed);
      }
      if (dialogType !== null) {
        setDialogType(null);
      }
      if (spotlightOpen) {
        setSpotlightOpen(false);
      }
      return;
    }

    if (item.behavior === "dialog" && item.dialogType) {
      setDialogType(dialogType === item.dialogType ? null : item.dialogType);
      if (spotlightOpen) {
        setSpotlightOpen(false);
      }
      return;
    }

    if (item.behavior === "spotlight") {
      setSpotlightOpen(!spotlightOpen);
      if (dialogType !== null) {
        setDialogType(null);
      }
    }
  };

  /**
   * Render a single icon button.
   */
  const renderIconButton = (item: IconItem) => {
    const { id, Icon, label, testId } = item;
    const resolvedLabel = t(label);
    const isActive =
      (item.behavior === "docked" &&
        item.dockedPanel === activeLeftPanel &&
        !sidebarCollapsed &&
        dialogType === null &&
        !spotlightOpen) ||
      (item.behavior === "dialog" && item.dialogType === dialogType) ||
      (item.behavior === "spotlight" && spotlightOpen);
    return (
      // eslint-disable-next-line creonow/no-native-html-element -- Layout: IconBar uses native button with aria-pressed for toggle semantics
      <button
        key={id}
        type="button"
        onClick={() => handleIconClick(item)}
        className={`${iconButtonBase} ${isActive ? iconButtonActive : iconButtonInactive}`}
        aria-label={resolvedLabel}
        aria-pressed={isActive}
        data-testid={testId}
        title={resolvedLabel}
      >
        <Icon size={24} strokeWidth={1.5} />
      </button>
    );
  };

  const settingsIsActive = settingsOpen;

  return (
    <div
      className="flex flex-col items-center pt-2 pb-2 bg-[var(--color-bg-surface)] border-r border-[var(--color-separator)] h-full shrink-0 w-12"
      data-testid="icon-bar"
    >
      {/* Main navigation icons */}
      <div className="flex flex-col items-center gap-1">
        {MAIN_ICONS.map(renderIconButton)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings (dialog entry point) */}
      <div className="flex flex-col items-center gap-1">
        {/* eslint-disable-next-line creonow/no-native-html-element -- Layout: IconBar settings button with aria-pressed toggle */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`${iconButtonBase} ${settingsIsActive ? iconButtonActive : iconButtonInactive}`}
          aria-label={t("workbench.iconBar.settings")}
          aria-pressed={settingsIsActive}
          data-testid="icon-bar-settings"
          title={t("workbench.iconBar.settings")}
        >
          <Settings size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
