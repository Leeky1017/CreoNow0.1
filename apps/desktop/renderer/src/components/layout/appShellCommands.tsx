import type { useTranslation } from "react-i18next";

import { LAYOUT_SHORTCUTS } from "../../config/shortcuts";
import type { SettingsTab } from "../../features/settings-dialog/SettingsDialog";
import { invoke } from "../../lib/ipcClient";
import type { CommandItem } from "../../features/commandPalette/CommandPalette";
import { getModKey } from "./appShellLayoutHelpers";

export type FileItem = {
  documentId: string;
  title: string;
  type: string;
};

/**
 * Build the static command palette entries (non-file items).
 */
export function buildCommandEntries(args: {
  modKey: string;
  t: ReturnType<typeof useTranslation>["t"];
  currentProjectId: string | null;
  zenMode: boolean;
  openSettingsDialog: (tab: SettingsTab) => void;
  setExportDialogOpen: (open: boolean) => void;
  toggleSidebarVisibility: () => void;
  toggleAiPanel: () => void;
  setZenMode: (v: boolean) => void;
  createDocument: (args: { projectId: string }) => Promise<{ ok: boolean }>;
  openVersionHistoryPanel: () => void;
  setCreateProjectDialogOpen: (open: boolean) => void;
  openGlobalSearch: () => void;
  close: () => void;
}): CommandItem[] {
  return [
    {
      id: "open-settings",
      label: args.t("workbench.appShell.command.openSettings"),
      shortcut: `${args.modKey},`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.openSettingsDialog("general");
        args.close();
      },
    },
    {
      id: "export",
      label: args.t("workbench.appShell.command.export"),
      group: "command",
      category: "command",
      onSelect: () => {
        args.setExportDialogOpen(true);
        args.close();
      },
    },
    {
      id: "toggle-sidebar",
      label: args.t("workbench.appShell.command.toggleSidebar"),
      shortcut: `${args.modKey}\\`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.toggleSidebarVisibility();
        args.close();
      },
    },
    {
      id: "toggle-right-panel",
      label: args.t("workbench.appShell.command.toggleRightPanel"),
      shortcut: `${args.modKey}L`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.toggleAiPanel();
        args.close();
      },
    },
    {
      id: "toggle-zen-mode",
      label: args.t("workbench.appShell.command.toggleZenMode"),
      shortcut: "F11",
      group: "command",
      category: "command",
      onSelect: () => {
        args.setZenMode(!args.zenMode);
        args.close();
      },
    },
    {
      id: "open-global-search",
      label: args.t("search.shortcut.label"),
      shortcut: LAYOUT_SHORTCUTS.globalSearch.display(),
      group: "command",
      category: "command",
      onSelect: () => {
        args.openGlobalSearch();
        args.close();
      },
    },
    {
      id: "create-new-document",
      label: args.t("workbench.appShell.command.createNewDocument"),
      shortcut: `${args.modKey}N`,
      group: "command",
      category: "command",
      onSelect: async () => {
        if (!args.currentProjectId) return;
        await args.createDocument({ projectId: args.currentProjectId });
        args.close();
      },
    },
    {
      id: "open-version-history",
      label: args.t("workbench.appShell.command.openVersionHistory"),
      group: "command",
      category: "command",
      onSelect: () => {
        args.openVersionHistoryPanel();
        args.close();
      },
    },
    {
      id: "create-new-project",
      label: args.t("workbench.appShell.command.createNewProject"),
      shortcut: `${args.modKey}Shift+N`,
      group: "command",
      category: "command",
      onSelect: () => {
        args.setCreateProjectDialogOpen(true);
        args.close();
      },
    },
    {
      id: "open-folder",
      label: args.t("workbench.appShell.command.openFolder"),
      group: "command",
      category: "command",
      onSelect: async () => {
        await invoke("dialog:folder:open", {});
        args.close();
      },
    },
  ];
}

/**
 * Build file entries for the command palette.
 */
export function buildFileEntries(args: {
  fileItems: FileItem[];
  currentProjectId: string | null;
  setCurrentDocument: (a: {
    projectId: string;
    documentId: string;
  }) => Promise<{ ok: boolean }>;
  openEditorDocument: (a: {
    projectId: string;
    documentId: string;
  }) => Promise<void>;
  close: () => void;
}): CommandItem[] {
  const safeFileItems = Array.isArray(args.fileItems) ? args.fileItems : [];
  return [...safeFileItems]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map<CommandItem>((item) => ({
      id: `file-${item.documentId}`,
      label: item.title,
      subtext: item.type,
      icon: (
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 items-center justify-center text-[9px] font-semibold text-[var(--color-fg-muted)]"
        >
          {item.type[0]?.toUpperCase() ?? "D"}
        </span>
      ),
      group: "file",
      category: "file",
      onSelect: async () => {
        if (!args.currentProjectId) return;
        const res = await args.setCurrentDocument({
          projectId: args.currentProjectId,
          documentId: item.documentId,
        });
        if (!res.ok) return;
        await args.openEditorDocument({
          projectId: args.currentProjectId,
          documentId: item.documentId,
        });
        args.close();
      },
    }));
}

export { getModKey };
