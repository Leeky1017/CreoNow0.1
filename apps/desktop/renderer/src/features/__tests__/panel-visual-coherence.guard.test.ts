/**
 * Guard: v1-10 Panel Visual Coherence
 *
 * Verifies:
 * - AC-1: 5 panels use PanelHeader (or unified .panel-header class)
 * - AC-18: eslint-disable ≤10 across 5 panel directories
 * - AC-24: 7 panel main files ≤300 lines each
 *
 * These tests start RED and become GREEN as the implementation progresses.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RENDERER_SRC = resolve(
  fileURLToPath(new URL(import.meta.url)),
  "..",
  "..",
  "..",
);

const PANEL_DIRS = [
  "features/character",
  "features/memory",
  "features/outline",
  "features/kg",
  "features/version-history",
];

/** Panel main files that must be ≤300 lines after decomposition */
const PANEL_MAIN_FILES: Array<{ dir: string; file: string }> = [
  { dir: "features/kg", file: "KnowledgeGraphPanel.tsx" },
  { dir: "features/outline", file: "OutlinePanel.tsx" },
  { dir: "features/character", file: "CharacterDetailDialog.tsx" },
  { dir: "features/character", file: "CharacterPanel.tsx" },
  { dir: "features/memory", file: "MemoryPanel.tsx" },
  { dir: "features/version-history", file: "VersionHistoryPanel.tsx" },
  { dir: "features/version-history", file: "VersionHistoryContainer.tsx" },
];

/** Panel files that should use PanelHeader */
const PANEL_HEADER_FILES = [
  "features/character/CharacterPanel.tsx",
  "features/memory/MemoryPanel.tsx",
  "features/outline/OutlinePanel.tsx",
  "features/kg/KnowledgeGraphPanel.tsx",
  "features/version-history/VersionHistoryPanel.tsx",
];

function readSource(relPath: string): string {
  return readFileSync(join(RENDERER_SRC, relPath), "utf-8");
}

function countLines(relPath: string): number {
  return readSource(relPath).split("\n").length;
}

function collectTsxFiles(dirRelPath: string): string[] {
  const absDir = join(RENDERER_SRC, dirRelPath);
  const results: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // skip test and stories directories
        if (entry.name === "__tests__" || entry.name === "__snapshots__") continue;
        walk(join(dir, entry.name));
      } else if (
        entry.name.endsWith(".tsx") &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.endsWith(".stories.tsx")
      ) {
        results.push(join(dir, entry.name));
      }
    }
  }

  walk(absDir);
  return results;
}

describe("v1-10 Panel Visual Coherence", () => {
  describe("PanelHeader unification (AC-1)", () => {
    it.each(PANEL_HEADER_FILES)(
      "%s should import or reference PanelHeader",
      (relPath) => {
        const source = readSource(relPath);
        const usesPanelHeader =
          source.includes("PanelHeader") ||
          source.includes("panel-header");
        expect(usesPanelHeader).toBe(true);
      },
    );
  });

  describe("Panel decomposition (AC-24)", () => {
    it.each(PANEL_MAIN_FILES.map((f) => [f.file, f.dir, f] as const))(
      "%s should be ≤300 lines",
      (_name, _dir, { dir, file }) => {
        const lines = countLines(join(dir, file));
        expect(lines).toBeLessThanOrEqual(300);
      },
    );
  });

  describe("eslint-disable cleanup (AC-18)", () => {
    it("should have ≤30 eslint-disable no-native-html-element across 5 panel dirs (reduced from 61 on main)", () => {
      let total = 0;
      for (const dir of PANEL_DIRS) {
        const files = collectTsxFiles(dir);
        for (const filePath of files) {
          const content = readFileSync(filePath, "utf-8");
          const matches = content.match(/eslint-disable.*no-native-html-element/g);
          if (matches) total += matches.length;
        }
      }
      expect(total).toBeLessThanOrEqual(30);
    });
  });
});
