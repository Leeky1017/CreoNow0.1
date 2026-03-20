import {
  Download,
  FolderPlus,
  History,
  Maximize,
  PanelLeft,
  PanelRight,
  Search,
  Settings,
  SquarePen,
} from "lucide-react";

import type { CommandItem, CommandPaletteProps } from "./commandPaletteTypes";
import { GROUP_IDS, GROUP_ICON_COLORS } from "./commandPaletteTypes";

// =============================================================================
// Icons — color-coded per group (AC-4)
// =============================================================================

function iconClass(group: string): string {
  return GROUP_ICON_COLORS[group] ?? "text-[var(--color-fg-muted)]";
}

export function SearchIcon({ className }: { className?: string }): JSX.Element {
  return <Search className={className} size={20} strokeWidth={1.5} />;
}

function EditIcon({ className }: { className?: string }): JSX.Element {
  return <SquarePen className={className} size={16} strokeWidth={1.5} />;
}

function SidebarIcon({ className }: { className?: string }): JSX.Element {
  return <PanelLeft className={className} size={16} strokeWidth={1.5} />;
}

function DownloadIcon({ className }: { className?: string }): JSX.Element {
  return <Download className={className} size={16} strokeWidth={1.5} />;
}

function SettingsIcon({ className }: { className?: string }): JSX.Element {
  return <Settings className={className} size={16} strokeWidth={1.5} />;
}

function PanelRightIcon({ className }: { className?: string }): JSX.Element {
  return <PanelRight className={className} size={16} strokeWidth={1.5} />;
}

function MaximizeIcon({ className }: { className?: string }): JSX.Element {
  return <Maximize className={className} size={16} strokeWidth={1.5} />;
}

function HistoryIcon({ className }: { className?: string }): JSX.Element {
  return <History className={className} size={16} strokeWidth={1.5} />;
}

function FolderPlusIcon({ className }: { className?: string }): JSX.Element {
  return <FolderPlus className={className} size={16} strokeWidth={1.5} />;
}

// =============================================================================
// Default commands builder
// =============================================================================

/**
 * Build the default command palette items.
 */
export function buildDefaultCommands(ctx: {
  modKey: string;
  t: (key: string) => string;
  currentProjectId: string | null;
  onOpenChange: (open: boolean) => void;
  setErrorText: (text: string | null) => void;
  layoutActions: CommandPaletteProps["layoutActions"];
  dialogActions: CommandPaletteProps["dialogActions"];
  documentActions: CommandPaletteProps["documentActions"];
}): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: "Open Settings",
      icon: <SettingsIcon className={iconClass(GROUP_IDS.suggestions)} />,
      shortcut: `${ctx.modKey},`,
      group: GROUP_IDS.suggestions,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.dialogActions?.onOpenSettings) {
          ctx.dialogActions.onOpenSettings();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.settingsUnavailable"),
          );
        }
      },
    },
    {
      id: "export",
      label: "Export…",
      icon: <DownloadIcon className={iconClass(GROUP_IDS.suggestions)} />,
      group: GROUP_IDS.suggestions,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.dialogActions?.onOpenExport) {
          ctx.dialogActions.onOpenExport();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.exportUnavailable"),
          );
        }
      },
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      icon: <SidebarIcon className={iconClass(GROUP_IDS.layout)} />,
      shortcut: `${ctx.modKey}\\`,
      group: GROUP_IDS.layout,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.layoutActions?.onToggleSidebar) {
          ctx.layoutActions.onToggleSidebar();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.layoutUnavailable"),
          );
        }
      },
    },
    {
      id: "toggle-right-panel",
      label: "Toggle Right Panel",
      icon: <PanelRightIcon className={iconClass(GROUP_IDS.layout)} />,
      shortcut: `${ctx.modKey}L`,
      group: GROUP_IDS.layout,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.layoutActions?.onToggleRightPanel) {
          ctx.layoutActions.onToggleRightPanel();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.layoutUnavailable"),
          );
        }
      },
    },
    {
      id: "toggle-zen-mode",
      label: "Toggle Zen Mode",
      icon: <MaximizeIcon className={iconClass(GROUP_IDS.layout)} />,
      shortcut: "F11",
      group: GROUP_IDS.layout,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.layoutActions?.onToggleZenMode) {
          ctx.layoutActions.onToggleZenMode();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.layoutUnavailable"),
          );
        }
      },
    },
    {
      id: "create-new-document",
      label: "Create New Document",
      icon: <EditIcon className={iconClass(GROUP_IDS.document)} />,
      shortcut: `${ctx.modKey}N`,
      group: GROUP_IDS.document,
      onSelect: async () => {
        ctx.setErrorText(null);
        if (!ctx.currentProjectId) {
          ctx.setErrorText(ctx.t("workbench.commandPalette.errors.noProject"));
          return;
        }
        if (ctx.documentActions?.onCreateDocument) {
          try {
            await ctx.documentActions.onCreateDocument();
            ctx.onOpenChange(false);
          } catch {
            ctx.setErrorText(
              ctx.t("workbench.commandPalette.errors.createDocumentFailed"),
            );
          }
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.documentUnavailable"),
          );
        }
      },
    },
    {
      id: "open-version-history",
      label: "Open Version History",
      icon: <HistoryIcon className={iconClass(GROUP_IDS.document)} />,
      group: GROUP_IDS.document,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.layoutActions?.onOpenVersionHistory) {
          ctx.layoutActions.onOpenVersionHistory();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.versionHistoryUnavailable"),
          );
        }
      },
    },
    {
      id: "create-new-project",
      label: "Create New Project",
      icon: <FolderPlusIcon className={iconClass(GROUP_IDS.project)} />,
      shortcut: `${ctx.modKey}⇧N`,
      group: GROUP_IDS.project,
      onSelect: () => {
        ctx.setErrorText(null);
        if (ctx.dialogActions?.onOpenCreateProject) {
          ctx.dialogActions.onOpenCreateProject();
          ctx.onOpenChange(false);
        } else {
          ctx.setErrorText(
            ctx.t("workbench.commandPalette.errors.createProjectUnavailable"),
          );
        }
      },
    },
  ];
}
