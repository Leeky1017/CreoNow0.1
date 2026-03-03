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
};

/**
 * NavigationController owns keyboard shortcuts and visibility/navigation toggles.
 *
 * All shortcuts are registered via the unified HotkeyManager.
 * It must not perform width allocation or resizing orchestration.
 */
export function NavigationController(props: NavigationControllerProps): null {
  const debouncedToggleSidebar = useDebouncedCallback(
    props.onToggleSidebar,
    300,
  );
  const debouncedToggleRightPanel = useDebouncedCallback(
    props.onToggleRightPanel,
    300,
  );

  // F11: Toggle Zen Mode
  useHotkey(
    "nav:toggle-zen",
    { key: "F11" },
    React.useCallback(
      (e: KeyboardEvent) => {
        if (e.repeat) return;
        props.onToggleZenMode();
      },
      [props.onToggleZenMode],
    ),
    "global",
    20,
  );

  // ESC in zen mode: Exit zen mode
  useHotkey(
    "nav:exit-zen",
    { key: "Escape" },
    React.useCallback(() => {
      props.onExitZenMode();
    }, [props.onExitZenMode]),
    "global",
    20,
    props.zenMode,
  );

  // Cmd/Ctrl+P: Command Palette
  useHotkey(
    "nav:command-palette",
    { key: "p", modKey: true },
    React.useCallback(() => {
      if (!props.zenMode) {
        props.onOpenCommandPalette();
      }
    }, [props.zenMode, props.onOpenCommandPalette]),
    "global",
    15,
  );

  // Cmd/Ctrl+\: Toggle Sidebar (NOT Cmd+B per DESIGN_DECISIONS.md)
  useHotkey(
    "nav:toggle-sidebar",
    { key: "\\", modKey: true },
    React.useCallback(() => {
      if (!props.zenMode) {
        debouncedToggleSidebar();
      }
    }, [props.zenMode, debouncedToggleSidebar]),
    "global",
    15,
  );

  // Cmd/Ctrl+L: Toggle Right Panel
  useHotkey(
    "nav:toggle-right-panel",
    { key: "l", modKey: true },
    React.useCallback(() => {
      if (!props.zenMode) {
        debouncedToggleRightPanel();
      }
    }, [props.zenMode, debouncedToggleRightPanel]),
    "global",
    15,
  );

  // Cmd/Ctrl+,: Open Settings
  useHotkey(
    "nav:open-settings",
    { key: ",", modKey: true },
    React.useCallback(() => {
      if (!props.zenMode) {
        props.onOpenSettings();
      }
    }, [props.zenMode, props.onOpenSettings]),
    "global",
    15,
  );

  // Cmd/Ctrl+Shift+N: Create New Project
  useHotkey(
    "nav:create-project",
    { key: "N", modKey: true, shiftKey: true },
    React.useCallback(() => {
      if (!props.zenMode) {
        props.onOpenCreateProject();
      }
    }, [props.zenMode, props.onOpenCreateProject]),
    "global",
    15,
  );

  // Cmd/Ctrl+N: Create New Document (only if project is open)
  useHotkey(
    "nav:create-document",
    { key: "n", modKey: true },
    React.useCallback(() => {
      if (!props.zenMode && props.canCreateDocument) {
        props.onCreateDocument();
      }
    }, [props.zenMode, props.canCreateDocument, props.onCreateDocument]),
    "global",
    10,
  );

  return null;
}
