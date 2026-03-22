import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("V1-21 Performance Guard", () => {
  it("should use @tanstack/react-virtual", () => {
    const pkgPath = path.resolve(__dirname, "../../../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps["@tanstack/react-virtual"]).toBeDefined();
  });

  it("FileTreePanel should use useVirtualizer", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../features/files/FileTreePanel.tsx"),
      "utf-8",
    );
    expect(content).toContain("useVirtualizer");
  });

  it("AiMessageList should use useVirtualizer", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../features/ai/AiMessageList.tsx"),
      "utf-8",
    );
    expect(content).toContain("useVirtualizer");
  });

  it("SearchResultsArea should use useVirtualizer", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../features/search/SearchResultsArea.tsx"),
      "utf-8",
    );
    expect(content).toContain("useVirtualizer");
  });

  it("should have skeleton components for key panels", () => {
    const skeletons = [
      "SearchPanelSkeleton",
      "OutlinePanelSkeleton",
      "AiPanelSkeleton",
      "MemoryPanelSkeleton",
    ];
    const files = fs.readdirSync(path.resolve(__dirname, "../features"), {
      recursive: true,
    });
    for (const name of skeletons) {
      const found = (files as string[]).some(
        (f) => typeof f === "string" && f.includes(name),
      );
      expect(found, `${name} should exist in features/`).toBe(true);
    }
  });

  it("animations should respect prefers-reduced-motion", () => {
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    expect(mainCss).toContain("prefers-reduced-motion");
  });

  it("V1-21 list-item-enter animation should be ≤0.3s", () => {
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    const listItemMatch = mainCss.match(
      /\.list-item-enter\s*\{[^}]*animation:\s*list-item-enter\s+([\d.]+)s/,
    );
    expect(listItemMatch).not.toBeNull();
    const seconds = parseFloat(listItemMatch![1]);
    expect(seconds).toBeLessThanOrEqual(0.3);
  });

  it("FileTreeNodeRow should be wrapped in React.memo", () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, "../features/files/FileTreeNodeRow.tsx"),
      "utf-8",
    );
    expect(content).toContain("React.memo");
  });

  it("list-item-enter animation should exist in main.css", () => {
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    expect(mainCss).toContain("list-item-enter");
    expect(mainCss).toContain("@keyframes list-item-enter");
  });
});
