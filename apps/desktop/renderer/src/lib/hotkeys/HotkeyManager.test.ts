import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HotkeyManager } from "./HotkeyManager";

describe("HotkeyManager", () => {
  let manager: HotkeyManager;

  beforeEach(() => {
    manager = new HotkeyManager();
    manager.init();
  });

  afterEach(() => {
    manager.destroy();
  });

  it("routes keydown events by scope and priority", () => {
    const globalHandler = vi.fn();
    const editorHandler = vi.fn();
    manager.register(
      "test-global",
      { key: "s", ctrlKey: true },
      "global",
      10,
      globalHandler,
    );
    manager.register(
      "test-editor",
      { key: "s", ctrlKey: true },
      "editor",
      5,
      editorHandler,
    );
    manager.setActiveScope("editor");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
    );
    // Higher priority global should handle it
    expect(globalHandler).toHaveBeenCalledOnce();
    expect(editorHandler).not.toHaveBeenCalled();
  });

  it("blocks editor scope when dialog scope is active", () => {
    const editorHandler = vi.fn();
    manager.register(
      "test-editor",
      { key: "Escape" },
      "editor",
      5,
      editorHandler,
    );
    manager.setActiveScope("dialog");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(editorHandler).not.toHaveBeenCalled();
  });

  it("unregister removes handler", () => {
    const handler = vi.fn();
    manager.register("test-1", { key: "a" }, "global", 1, handler);
    manager.unregister("test-1");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls editor-scoped handler when editor scope is active", () => {
    const editorHandler = vi.fn();
    manager.register(
      "test-editor",
      { key: "s", ctrlKey: true },
      "editor",
      5,
      editorHandler,
    );
    manager.setActiveScope("editor");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
    );
    expect(editorHandler).toHaveBeenCalledOnce();
  });

  it("matches key combo with modifiers correctly", () => {
    const handler = vi.fn();
    manager.register(
      "test-shift-s",
      { key: "s", ctrlKey: true, shiftKey: true },
      "global",
      1,
      handler,
    );

    // Without shift — should NOT match
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
    );
    expect(handler).not.toHaveBeenCalled();

    // With shift — should match
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
      }),
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("global scope handlers fire regardless of active scope", () => {
    const handler = vi.fn();
    manager.register("test-g", { key: "p", ctrlKey: true }, "global", 1, handler);
    manager.setActiveScope("editor");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "p", ctrlKey: true }),
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("passes the keyboard event to the handler", () => {
    const handler = vi.fn();
    manager.register("test-ev", { key: "x" }, "global", 1, handler);

    const event = new KeyboardEvent("keydown", { key: "x" });
    document.dispatchEvent(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("modKey matches either ctrlKey or metaKey", () => {
    const handler = vi.fn();
    manager.register(
      "test-mod",
      { key: "s", modKey: true },
      "global",
      1,
      handler,
    );

    // ctrlKey should match
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true }),
    );
    expect(handler).toHaveBeenCalledOnce();

    handler.mockClear();

    // metaKey should match
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", metaKey: true }),
    );
    expect(handler).toHaveBeenCalledOnce();

    handler.mockClear();

    // No modifier — should NOT match
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(handler).not.toHaveBeenCalled();
  });
});
