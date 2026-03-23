import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("FileTreePanel Storybook coverage", () => {
  it("should include nested/empty/dragging/context-menu/keyboard stories", () => {
    const navPath = path.resolve(__dirname, "FileTreeNavigation.stories.tsx");
    const opsPath = path.resolve(__dirname, "FileTreeOperations.stories.tsx");
    const navSource = readFileSync(navPath, "utf8");
    const opsSource = readFileSync(opsPath, "utf8");
    const combined = navSource + opsSource;

    expect(combined).toContain("export const Default");
    expect(combined).toContain("export const Empty");
    expect(combined).toContain("export const NestedHierarchy");
    expect(combined).toContain("export const DragDropState");
    expect(combined).toContain("export const ContextMenuState");
    expect(combined).toContain("export const KeyboardNavigation");
  });
});
