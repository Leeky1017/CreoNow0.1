/**
 * Keyboard Shortcuts Configuration
 *
 * Why: Centralized shortcut definitions allow easy customization,
 * consistent display across the app, and potential future user customization.
 */

/**
 * Detect if running on macOS.
 *
 * Why: macOS uses ⌘ (Command) while other platforms use Ctrl.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Get the modifier key symbol for the current platform.
 */
export function getModKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Shortcut definition with platform-aware display.
 */
export interface ShortcutDef {
  /** Unique identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Platform-agnostic key combination (uses "mod" for Ctrl/⌘) */
  keys: string;
  /** Get display string for current platform */
  display: () => string;
}

/**
 * Convert logical key bindings into platform display text.
 *
 * Why: Spec requires macOS tips like "⌘B" instead of "⌘+B".
 */
function formatShortcutDisplay(keys: string): string {
  const parts = keys.split("+");
  if (isMac()) {
    return parts
      .map((part) => {
        if (part === "mod") return "⌘";
        if (part === "Shift") return "⇧";
        if (part === "Alt") return "⌥";
        if (part === "Ctrl") return "⌃";
        return part;
      })
      .join("");
  }

  return parts
    .map((part) => {
      if (part === "mod") return "Ctrl";
      return part;
    })
    .join("+");
}

/**
 * Create a shortcut definition with platform-aware display.
 */
function defineShortcut(id: string, label: string, keys: string): ShortcutDef {
  return {
    id,
    label,
    keys,
    display: () => formatShortcutDisplay(keys),
  };
}

// =============================================================================
// Editor Formatting Shortcuts
// =============================================================================

export const EDITOR_SHORTCUTS = {
  // Text formatting
  bold: defineShortcut("bold", "Bold", "mod+B"),
  italic: defineShortcut("italic", "Italic", "mod+I"),
  underline: defineShortcut("underline", "Underline", "mod+U"),
  strikethrough: defineShortcut(
    "strikethrough",
    "Strikethrough",
    "mod+Shift+X",
  ),
  code: defineShortcut("code", "Inline Code", "mod+E"),

  // Headings
  heading1: defineShortcut("heading1", "Heading 1", "mod+1"),
  heading2: defineShortcut("heading2", "Heading 2", "mod+2"),
  heading3: defineShortcut("heading3", "Heading 3", "mod+3"),

  // Lists
  bulletList: defineShortcut("bulletList", "Bullet List", "mod+Shift+8"),
  orderedList: defineShortcut("orderedList", "Numbered List", "mod+Shift+7"),

  // Blocks
  blockquote: defineShortcut("blockquote", "Quote", "mod+Shift+B"),
  codeBlock: defineShortcut("codeBlock", "Code Block", "mod+Alt+C"),

  // History
  undo: defineShortcut("undo", "Undo", "mod+Z"),
  redo: defineShortcut("redo", "Redo", isMac() ? "mod+Shift+Z" : "mod+Y"),

  // Save
  save: defineShortcut("save", "Save", "mod+S"),
} as const;

// =============================================================================
// App Layout Shortcuts
// =============================================================================

export const LAYOUT_SHORTCUTS = {
  zenMode: defineShortcut("zenMode", "Zen Mode", "F11"),
  exitZen: defineShortcut("exitZen", "Exit Zen Mode", "Escape"),
  commandPalette: defineShortcut("commandPalette", "Command Palette", "mod+P"),
  toggleSidebar: defineShortcut("toggleSidebar", "Toggle Sidebar", "mod+\\"),
  togglePanel: defineShortcut("togglePanel", "Toggle Panel", "mod+L"),
  globalSearch: defineShortcut("globalSearch", "Global Search", "mod+Shift+F"),
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all shortcuts as an array for display in settings/help.
 */
export function getAllShortcuts(): ShortcutDef[] {
  return [
    ...Object.values(EDITOR_SHORTCUTS),
    ...Object.values(LAYOUT_SHORTCUTS),
  ];
}

/**
 * Get shortcut display string by ID.
 */
export function getShortcutDisplay(
  id: keyof typeof EDITOR_SHORTCUTS | keyof typeof LAYOUT_SHORTCUTS,
): string {
  const editorShortcut = EDITOR_SHORTCUTS[id as keyof typeof EDITOR_SHORTCUTS];
  if (editorShortcut) {
    return editorShortcut.display();
  }

  const layoutShortcut = LAYOUT_SHORTCUTS[id as keyof typeof LAYOUT_SHORTCUTS];
  if (layoutShortcut) {
    return layoutShortcut.display();
  }

  return "";
}
