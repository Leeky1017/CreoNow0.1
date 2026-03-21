import React from "react";

import { useFileStore } from "../../stores/fileStore";
import { useEditorStore } from "../../stores/editorStore";
import type { CommandItem } from "../../features/commandPalette/CommandPalette";
import {
  readRecentCommandIds,
  recordRecentCommandId,
} from "../../features/commandPalette/recentItems";
import {
  buildCommandEntries,
  buildFileEntries,
  getModKey,
} from "./appShellCommands";
import type { AppShellLayoutState } from "./useAppShellLayout";

/**
 * useGlobalSearchFocusController – manages spotlight search focus + restore.
 */
function useGlobalSearchFocusController(args: {
  setSpotlightOpen: (open: boolean) => void;
}) {
  const { setSpotlightOpen } = args;
  const [searchFocusNonce, setSearchFocusNonce] = React.useState(0);
  const [searchRestoreTarget, setSearchRestoreTarget] =
    React.useState<HTMLElement | null>(null);

  const openGlobalSearch = React.useCallback(() => {
    const activeElement =
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSearchRestoreTarget(activeElement);
    setSpotlightOpen(true);
    setSearchFocusNonce((value) => value + 1);
  }, [setSpotlightOpen]);

  const closeGlobalSearch = React.useCallback(() => {
    setSpotlightOpen(false);
    if (searchRestoreTarget) {
      queueMicrotask(() => {
        searchRestoreTarget.focus();
      });
    }
  }, [searchRestoreTarget, setSpotlightOpen]);

  return { searchFocusNonce, openGlobalSearch, closeGlobalSearch };
}

export type AppShellKeyboardState = {
  commandPaletteKey: number;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  commandPaletteCommands: CommandItem[];
  openCommandPalette: () => void;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
  searchFocusNonce: number;
};

/**
 * useAppShellKeyboard – command palette state + global search focus management.
 */
export function useAppShellKeyboard(
  layout: AppShellLayoutState,
): AppShellKeyboardState {
  const {
    t,
    currentProjectId,
    zenMode,
    openSettingsDialog,
    setExportDialogOpen,
    toggleSidebarVisibility,
    toggleAiPanel,
    setZenMode,
    createDocument,
    openVersionHistoryPanel,
    setCreateProjectDialogOpen,
    setSpotlightOpen,
  } = layout;

  const fileItems = useFileStore((s) =>
    Array.isArray(s.items) ? s.items : [],
  );
  const setCurrentDocument = useFileStore((s) => s.setCurrent);
  const openEditorDocument = useEditorStore((s) => s.openDocument);

  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [commandPaletteKey, setCommandPaletteKey] = React.useState(0);
  const [recentCommandIds, setRecentCommandIds] = React.useState<string[]>(() =>
    readRecentCommandIds(),
  );

  const { searchFocusNonce, openGlobalSearch, closeGlobalSearch } =
    useGlobalSearchFocusController({ setSpotlightOpen });

  const openCommandPalette = React.useCallback(() => {
    setRecentCommandIds(readRecentCommandIds());
    setCommandPaletteKey((k) => k + 1);
    setCommandPaletteOpen(true);
  }, []);

  const refreshRecentCommands = React.useCallback(() => {
    setRecentCommandIds(readRecentCommandIds());
  }, []);

  const withRecentTracking = React.useCallback(
    (command: CommandItem): CommandItem => ({
      ...command,
      onSelect: async () => {
        await command.onSelect();
        recordRecentCommandId(command.id);
        refreshRecentCommands();
      },
    }),
    [refreshRecentCommands],
  );

  const modKey = React.useMemo(() => getModKey(), []);
  const commandPaletteCommands = React.useMemo<CommandItem[]>(() => {
    const close = () => setCommandPaletteOpen(false);
    const commandEntries = buildCommandEntries({
      modKey,
      t,
      currentProjectId,
      zenMode,
      openSettingsDialog,
      setExportDialogOpen,
      toggleSidebarVisibility,
      toggleAiPanel,
      setZenMode,
      createDocument: async (a) => {
        const r = await createDocument(a);
        return { ok: r.ok };
      },
      openVersionHistoryPanel,
      setCreateProjectDialogOpen,
      openGlobalSearch,
      close,
    });
    const fileEntries = buildFileEntries({
      fileItems,
      currentProjectId,
      setCurrentDocument: async (a) => {
        const r = await setCurrentDocument(a);
        return { ok: r.ok };
      },
      openEditorDocument,
      close,
    });
    const trackedCommands = [
      ...commandEntries.map(withRecentTracking),
      ...fileEntries.map(withRecentTracking),
    ];
    const trackedById = new Map(trackedCommands.map((item) => [item.id, item]));
    const recentEntries = recentCommandIds
      .map((id) => trackedById.get(id))
      .filter((item): item is CommandItem => Boolean(item))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        group: "recent",
        category: "recent" as const,
      }));
    return [
      ...recentEntries,
      ...fileEntries.map(withRecentTracking),
      ...commandEntries.map(withRecentTracking),
    ];
  }, [
    createDocument,
    currentProjectId,
    fileItems,
    modKey,
    openEditorDocument,
    openSettingsDialog,
    openVersionHistoryPanel,
    recentCommandIds,
    setCurrentDocument,
    setZenMode,
    t,
    toggleAiPanel,
    toggleSidebarVisibility,
    withRecentTracking,
    zenMode,
    openGlobalSearch,
    setExportDialogOpen,
    setCreateProjectDialogOpen,
  ]);

  return {
    commandPaletteKey,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandPaletteCommands,
    openCommandPalette,
    openGlobalSearch,
    closeGlobalSearch,
    searchFocusNonce,
  };
}
