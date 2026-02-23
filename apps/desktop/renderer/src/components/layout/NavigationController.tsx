import React from "react";

import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";

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

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      // F11: Toggle Zen Mode
      if (e.key === "F11") {
        if (e.repeat) {
          return;
        }
        e.preventDefault();
        props.onToggleZenMode();
        return;
      }

      // ESC in zen mode: Exit zen mode
      if (props.zenMode && e.key === "Escape") {
        e.preventDefault();
        props.onExitZenMode();
        return;
      }

      // Zen mode is pure writing immersion: block non-exit shortcuts to keep
      // panel entry points inaccessible until user exits.
      if (props.zenMode) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) {
        return;
      }

      // Cmd/Ctrl+P: Command Palette
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        props.onOpenCommandPalette();
        return;
      }

      // Cmd/Ctrl+\: Toggle Sidebar (NOT Cmd+B per DESIGN_DECISIONS.md)
      if (e.key === "\\") {
        e.preventDefault();
        debouncedToggleSidebar();
        return;
      }

      // Cmd/Ctrl+L: Toggle Right Panel
      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        debouncedToggleRightPanel();
        return;
      }

      // Cmd/Ctrl+,: Open Settings
      if (e.key === ",") {
        e.preventDefault();
        props.onOpenSettings();
        return;
      }

      // Cmd/Ctrl+Shift+N: Create New Project
      if (e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        props.onOpenCreateProject();
        return;
      }

      // Cmd/Ctrl+N: Create New Document (only if project is open)
      if (e.key.toLowerCase() === "n" && !e.shiftKey) {
        if (!props.canCreateDocument) {
          return;
        }
        e.preventDefault();
        props.onCreateDocument();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [debouncedToggleRightPanel, debouncedToggleSidebar, props]);

  return null;
}
