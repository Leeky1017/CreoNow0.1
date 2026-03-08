import { describe, it, expect } from "vitest";

import { getSurfaceById } from "./surfaceRegistry";

describe("surfaceRegistry — searchPanel shortcut 入口", () => {
  it("getSurfaceById('searchPanel') 的 entryPoints 中包含 type: 'shortcut' 的条目", () => {
    const surface = getSurfaceById("searchPanel");
    expect(surface).toBeDefined();
    const shortcutEntry = surface!.entryPoints.find((ep) => ep.type === "shortcut");
    expect(shortcutEntry).toBeDefined();
  });

  it("shortcut 入口的 description 包含 Cmd/Ctrl+Shift+F", () => {
    const surface = getSurfaceById("searchPanel");
    const shortcutEntry = surface!.entryPoints.find((ep) => ep.type === "shortcut");
    expect(shortcutEntry!.description).toContain("Cmd/Ctrl+Shift+F");
  });
});
