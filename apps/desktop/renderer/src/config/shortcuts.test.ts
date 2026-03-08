import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  LAYOUT_SHORTCUTS,
  EDITOR_SHORTCUTS,
  getAllShortcuts,
  getShortcutDisplay,
  isMac,
} from "./shortcuts";

describe("shortcuts — globalSearch", () => {
  it("LAYOUT_SHORTCUTS.globalSearch 存在且 keys 为 mod+Shift+F", () => {
    expect(LAYOUT_SHORTCUTS.globalSearch).toBeDefined();
    expect(LAYOUT_SHORTCUTS.globalSearch.id).toBe("globalSearch");
    expect(LAYOUT_SHORTCUTS.globalSearch.keys).toBe("mod+Shift+F");
  });

  it("getAllShortcuts() 返回包含 id 为 globalSearch 的条目", () => {
    const all = getAllShortcuts();
    const match = all.find((s) => s.id === "globalSearch");
    expect(match).toBeDefined();
    expect(match!.keys).toBe("mod+Shift+F");
  });

  it("getShortcutDisplay('globalSearch') 返回非空字符串", () => {
    const display = getShortcutDisplay("globalSearch");
    expect(display).toBeTruthy();
    expect(display.length).toBeGreaterThan(0);
  });

  it("Mac 下 display() 返回 ⌘⇧F", () => {
    // Mock navigator.platform
    vi.stubGlobal("navigator", { platform: "MacIntel" });
    // Re-evaluate: since isMac() checks at call time, the display function re-reads
    expect(LAYOUT_SHORTCUTS.globalSearch.display()).toBe("⌘⇧F");
    vi.unstubAllGlobals();
  });

  it("非 Mac 下 display() 返回 Ctrl+Shift+F", () => {
    vi.stubGlobal("navigator", { platform: "Win32" });
    expect(LAYOUT_SHORTCUTS.globalSearch.display()).toBe("Ctrl+Shift+F");
    vi.unstubAllGlobals();
  });
});
