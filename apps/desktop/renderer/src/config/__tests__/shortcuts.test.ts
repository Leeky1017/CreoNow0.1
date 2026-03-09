import { describe, expect, it, vi } from "vitest";

import {
  EDITOR_SHORTCUTS,
  getAllShortcuts,
  isMac,
} from "../shortcuts";

describe("EDITOR_SHORTCUTS.inlineAi", () => {
  it("should exist with keys 'mod+K'", () => {
    expect(EDITOR_SHORTCUTS.inlineAi).toBeDefined();
    expect(EDITOR_SHORTCUTS.inlineAi.keys).toBe("mod+K");
  });

  it("should have id 'inlineAi'", () => {
    expect(EDITOR_SHORTCUTS.inlineAi.id).toBe("inlineAi");
  });

  it("getAllShortcuts() should include inlineAi entry", () => {
    const all = getAllShortcuts();
    const found = all.find((s) => s.id === "inlineAi");
    expect(found).toBeDefined();
    expect(found!.keys).toBe("mod+K");
  });

  it("should display '⌘K' on macOS", () => {
    // Mock navigator.platform for macOS
    const origPlatform = Object.getOwnPropertyDescriptor(navigator, "platform");
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    });

    // Re-evaluate display since isMac() reads navigator at call time
    const display = EDITOR_SHORTCUTS.inlineAi.display();
    expect(display).toBe("⌘K");

    // Restore
    if (origPlatform) {
      Object.defineProperty(navigator, "platform", origPlatform);
    } else {
      Object.defineProperty(navigator, "platform", {
        value: "",
        configurable: true,
      });
    }
  });

  it("should display 'Ctrl+K' on non-macOS", () => {
    const origPlatform = Object.getOwnPropertyDescriptor(navigator, "platform");
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });

    const display = EDITOR_SHORTCUTS.inlineAi.display();
    expect(display).toBe("Ctrl+K");

    if (origPlatform) {
      Object.defineProperty(navigator, "platform", origPlatform);
    } else {
      Object.defineProperty(navigator, "platform", {
        value: "",
        configurable: true,
      });
    }
  });
});
