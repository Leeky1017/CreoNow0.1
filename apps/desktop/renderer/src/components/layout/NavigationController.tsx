import React from "react";

import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useHotkey } from "../../lib/hotkeys/useHotkey";

type NavigationControllerProps = {
  zenMode: boolean;
  canCreateDocument: boolean;
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  onToggleZenMode: () => void;
  onExitZenMode: () => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenCreateProject: () => void;
  onCreateDocument: () => void;
  onOpenGlobalSearch: () => void;
};

/**
 * NavigationController owns keyboard shortcuts and visibility/navigation toggles.
 *
 * All shortcuts are registered via the unified HotkeyManager.
 * It must not perform width allocation or resizing orchestration.
 */
export function NavigationController({
  zenMode,
  canCreateDocument,
  onToggleSidebar,
  onToggleRightPanel,
  onToggleZenMode,
  onExitZenMode,
  onOpenCommandPalette,
  onOpenSettings,
  onOpenCreateProject,
  onCreateDocument,
  onOpenGlobalSearch,
}: NavigationControllerProps): null {
  const debouncedToggleSidebar = useDebouncedCallback(onToggleSidebar, 300);
  const debouncedToggleRightPanel = useDebouncedCallback(
    onToggleRightPanel,
    300,
  );

  // F11: Toggle Zen Mode
  useHotkey(
    "nav:toggle-zen",
    { key: "F11" },
    React.useCallback(
      (e: KeyboardEvent) => {
        if (e.repeat) return;
        onToggleZenMode();
      },
      [onToggleZenMode],
    ),
    "global",
    20,
  );

  // ESC in zen mode: Exit zen mode
  useHotkey(
    "nav:exit-zen",
    { key: "Escape" },
    React.useCallback(() => {
      onExitZenMode();
    }, [onExitZenMode]),
    "global",
    20,
    zenMode,
  );

  // Cmd/Ctrl+P: Command Palette
  useHotkey(
    "nav:command-palette",
    { key: "p", modKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        onOpenCommandPalette();
      }
    }, [zenMode, onOpenCommandPalette]),
    "global",
    15,
  );

  // Cmd/Ctrl+\: Toggle Sidebar (NOT Cmd+B per DESIGN_DECISIONS.md)
  useHotkey(
    "nav:toggle-sidebar",
    { key: "\\", modKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        debouncedToggleSidebar();
      }
    }, [zenMode, debouncedToggleSidebar]),
    "global",
    15,
  );

  // Cmd/Ctrl+L: Toggle Right Panel
  useHotkey(
    "nav:toggle-right-panel",
    { key: "l", modKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        debouncedToggleRightPanel();
      }
    }, [zenMode, debouncedToggleRightPanel]),
    "global",
    15,
  );

  // Cmd/Ctrl+,: Open Settings
  useHotkey(
    "nav:open-settings",
    { key: ",", modKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        onOpenSettings();
      }
    }, [zenMode, onOpenSettings]),
    "global",
    15,
  );

  // Cmd/Ctrl+Shift+N: Create New Project
  useHotkey(
    "nav:create-project",
    { key: "N", modKey: true, shiftKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        onOpenCreateProject();
      }
    }, [zenMode, onOpenCreateProject]),
    "global",
    15,
  );

  // Cmd/Ctrl+N: Create New Document (only if project is open)
  useHotkey(
    "nav:create-document",
    { key: "n", modKey: true },
    React.useCallback(() => {
      if (!zenMode && canCreateDocument) {
        onCreateDocument();
      }
    }, [zenMode, canCreateDocument, onCreateDocument]),
    "global",
    10,
  );

  // Cmd/Ctrl+Shift+F: Open Global Search
  useHotkey(
    "nav:global-search",
    { key: "f", modKey: true, shiftKey: true },
    React.useCallback(() => {
      if (!zenMode) {
        onOpenGlobalSearch();
      }
    }, [zenMode, onOpenGlobalSearch]),
    "global",
    15,
  );

  return null;
}
