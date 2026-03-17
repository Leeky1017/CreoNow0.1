import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Windows keyboard compatibility gate.
 *
 * Verifies that all keyboard shortcuts produce correct Windows key bindings
 * (Ctrl instead of ⌘ / ⇧ instead of Shift symbol, etc.) per
 * design/system/06-shortcuts.md.
 */

describe("Windows keyboard compatibility", () => {
  let originalPlatform: string;

  beforeEach(() => {
    originalPlatform = navigator.platform;
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });
    // Force re-import to pick up new platform
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    });
    vi.resetModules();
  });

  it("isMac returns false on Windows", async () => {
    const { isMac } = await import("../../config/shortcuts");
    expect(isMac()).toBe(false);
  });

  it("getModKey returns Ctrl on Windows", async () => {
    const { getModKey } = await import("../../config/shortcuts");
    expect(getModKey()).toBe("Ctrl");
  });

  describe("editor shortcuts display correctly on Windows", () => {
    it("bold displays as Ctrl+B", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.bold.display()).toBe("Ctrl+B");
    });

    it("italic displays as Ctrl+I", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.italic.display()).toBe("Ctrl+I");
    });

    it("underline displays as Ctrl+U", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.underline.display()).toBe("Ctrl+U");
    });

    it("strikethrough displays as Ctrl+Shift+X", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.strikethrough.display()).toBe("Ctrl+Shift+X");
    });

    it("undo displays as Ctrl+Z", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.undo.display()).toBe("Ctrl+Z");
    });

    it("redo displays as Ctrl+Y on Windows", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.redo.display()).toBe("Ctrl+Y");
    });

    it("save displays as Ctrl+S", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.save.display()).toBe("Ctrl+S");
    });

    it("heading shortcuts use Ctrl on Windows", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.heading1.display()).toBe("Ctrl+1");
      expect(EDITOR_SHORTCUTS.heading2.display()).toBe("Ctrl+2");
      expect(EDITOR_SHORTCUTS.heading3.display()).toBe("Ctrl+3");
    });

    it("inline AI displays as Ctrl+K", async () => {
      const { EDITOR_SHORTCUTS } = await import("../../config/shortcuts");
      expect(EDITOR_SHORTCUTS.inlineAi.display()).toBe("Ctrl+K");
    });
  });

  describe("layout shortcuts display correctly on Windows", () => {
    it("command palette displays as Ctrl+P", async () => {
      const { LAYOUT_SHORTCUTS } = await import("../../config/shortcuts");
      expect(LAYOUT_SHORTCUTS.commandPalette.display()).toBe("Ctrl+P");
    });

    it("toggle sidebar displays as Ctrl+\\", async () => {
      const { LAYOUT_SHORTCUTS } = await import("../../config/shortcuts");
      expect(LAYOUT_SHORTCUTS.toggleSidebar.display()).toBe("Ctrl+\\");
    });

    it("toggle panel displays as Ctrl+L", async () => {
      const { LAYOUT_SHORTCUTS } = await import("../../config/shortcuts");
      expect(LAYOUT_SHORTCUTS.togglePanel.display()).toBe("Ctrl+L");
    });

    it("global search displays as Ctrl+Shift+F", async () => {
      const { LAYOUT_SHORTCUTS } = await import("../../config/shortcuts");
      expect(LAYOUT_SHORTCUTS.globalSearch.display()).toBe("Ctrl+Shift+F");
    });
  });

  describe("all shortcuts use mod key (none hardcoded to platform)", () => {
    it("every shortcut keys string contains mod (not Cmd or Ctrl)", async () => {
      const { getAllShortcuts } = await import("../../config/shortcuts");
      const all = getAllShortcuts();
      for (const s of all) {
        // F-keys and Escape don't use mod
        if (/^(F\d+|Escape)$/.test(s.keys)) continue;
        expect(s.keys).toContain("mod");
        expect(s.keys).not.toContain("Cmd");
        expect(s.keys).not.toContain("⌘");
      }
    });
  });

  describe("spec alignment: every spec-defined shortcut has an implementation", () => {
    it("all shortcuts from design/system/06-shortcuts.md are defined", async () => {
      const { EDITOR_SHORTCUTS, LAYOUT_SHORTCUTS } =
        await import("../../config/shortcuts");

      // From spec §全局快捷键
      expect(LAYOUT_SHORTCUTS.commandPalette.keys).toBe("mod+P");
      expect(LAYOUT_SHORTCUTS.togglePanel.keys).toBe("mod+L");
      expect(LAYOUT_SHORTCUTS.toggleSidebar.keys).toBe("mod+\\");
      expect(LAYOUT_SHORTCUTS.zenMode.keys).toBe("F11");
      expect(EDITOR_SHORTCUTS.save.keys).toBe("mod+S");

      // From spec §编辑器快捷键
      expect(EDITOR_SHORTCUTS.bold.keys).toBe("mod+B");
      expect(EDITOR_SHORTCUTS.italic.keys).toBe("mod+I");
      expect(EDITOR_SHORTCUTS.undo.keys).toBe("mod+Z");
      expect(EDITOR_SHORTCUTS.heading1.keys).toBe("mod+1");
      expect(EDITOR_SHORTCUTS.heading2.keys).toBe("mod+2");
      expect(EDITOR_SHORTCUTS.heading3.keys).toBe("mod+3");
    });
  });
});
