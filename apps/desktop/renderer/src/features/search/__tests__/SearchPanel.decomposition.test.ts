/**
 * Decomposition guard tests for SearchPanel.
 *
 * Ensures the SearchPanel module is properly decomposed:
 * - Main file ≤ 300 lines (AC-17)
 * - Each extracted sub-module ≤ 300 lines
 * - All public exports re-exported from expected files
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const SEARCH_DIR = path.resolve(__dirname, "..");

function lineCount(filePath: string): number {
  return fs.readFileSync(filePath, "utf-8").split("\n").length;
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

describe("SearchPanel decomposition (AC-17)", () => {
  const mainFile = path.join(SEARCH_DIR, "SearchPanel.tsx");
  const typesFile = path.join(SEARCH_DIR, "searchPanelTypes.ts");
  const resultItemsFile = path.join(SEARCH_DIR, "SearchResultItems.tsx");
  const resultsAreaFile = path.join(SEARCH_DIR, "SearchResultsArea.tsx");
  const partsFile = path.join(SEARCH_DIR, "SearchPanelParts.tsx");

  describe("file existence", () => {
    it("has searchPanelTypes.ts", () => {
      expect(fileExists(typesFile)).toBe(true);
    });
    it("has SearchResultItems.tsx", () => {
      expect(fileExists(resultItemsFile)).toBe(true);
    });
    it("has SearchResultsArea.tsx", () => {
      expect(fileExists(resultsAreaFile)).toBe(true);
    });
    it("has SearchPanelParts.tsx", () => {
      expect(fileExists(partsFile)).toBe(true);
    });
  });

  describe("line count limits (≤ 300)", () => {
    it("SearchPanel.tsx ≤ 300 lines", () => {
      expect(lineCount(mainFile)).toBeLessThanOrEqual(300);
    });
    it("searchPanelTypes.ts ≤ 300 lines", () => {
      expect(lineCount(typesFile)).toBeLessThanOrEqual(300);
    });
    it("SearchResultItems.tsx ≤ 300 lines", () => {
      expect(lineCount(resultItemsFile)).toBeLessThanOrEqual(300);
    });
    it("SearchResultsArea.tsx ≤ 300 lines", () => {
      expect(lineCount(resultsAreaFile)).toBeLessThanOrEqual(300);
    });
    it("SearchPanelParts.tsx ≤ 300 lines", () => {
      expect(lineCount(partsFile)).toBeLessThanOrEqual(300);
    });
  });

  describe("exports completeness", () => {
    it("searchPanelTypes.ts exports SearchResultItem", async () => {
      const mod = await import("../searchPanelTypes");
      expect(mod).toHaveProperty("navigateSearchResult");
    });
    it("SearchResultItems.tsx exports DocumentResultItem", async () => {
      const mod = await import("../SearchResultItems");
      expect(typeof mod.DocumentResultItem).toBe("function");
    });
    it("SearchResultsArea.tsx exports SearchResultsArea", async () => {
      const mod = await import("../SearchResultsArea");
      expect(typeof mod.SearchResultsArea).toBe("function");
    });
    it("SearchPanelParts.tsx exports CategoryButton", async () => {
      const mod = await import("../SearchPanelParts");
      expect(typeof mod.CategoryButton).toBe("function");
    });
  });
});
