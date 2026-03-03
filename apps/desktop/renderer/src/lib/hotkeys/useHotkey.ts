/**
 * useHotkey — React hook for registering keyboard shortcuts via HotkeyManager.
 *
 * Automatically registers on mount and unregisters on unmount.
 *
 * @module lib/hotkeys/useHotkey
 */
import { useEffect } from "react";

import {
  hotkeyManager,
  type HotkeyScope,
  type KeyCombo,
} from "./HotkeyManager";

/**
 * Register a keyboard shortcut that is automatically cleaned up on unmount.
 *
 * @param id      Unique registration identifier.
 * @param combo   Key combination to match.
 * @param handler Callback invoked when the shortcut fires.
 * @param scope   Scope the handler belongs to (default: `"global"`).
 * @param priority Higher number = higher priority (default: `0`).
 * @param enabled Whether the shortcut is active (default: `true`). When `false`
 *                the registration is removed until `enabled` becomes `true` again.
 */
export function useHotkey(
  id: string,
  combo: KeyCombo,
  handler: (event: KeyboardEvent) => void,
  scope: HotkeyScope = "global",
  priority = 0,
  enabled = true,
): void {
  const { key, ctrlKey, shiftKey, altKey, metaKey, modKey } = combo;
  useEffect(() => {
    if (!enabled) {
      hotkeyManager.unregister(id);
      return;
    }
    hotkeyManager.register(
      id,
      { key, ctrlKey, shiftKey, altKey, metaKey, modKey },
      scope,
      priority,
      handler,
    );
    return () => {
      hotkeyManager.unregister(id);
    };
  }, [id, key, ctrlKey, shiftKey, altKey, metaKey, modKey, handler, scope, priority, enabled]);
}
