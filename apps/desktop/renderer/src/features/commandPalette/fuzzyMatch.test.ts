import { describe, it, expect } from "vitest";

import { fuzzyFilter, fuzzyScore } from "./fuzzyMatch";
import type { CommandItem } from "./CommandPalette";

// =============================================================================
// Test Helpers
// =============================================================================

function makeItem(label: string, overrides?: Partial<CommandItem>): CommandItem {
  return {
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    onSelect: () => {},
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("fuzzyScore", () => {
  it("returns -1 when no fuzzy match exists", () => {
    // WB-FE-CP-S1b: no match → score -1
    expect(fuzzyScore("CommandPalette", "zzzzxyz")).toBe(-1);
  });

  it("returns positive score for character-sequence match", () => {
    // WB-FE-CP-S1: "cmdplt" characters appear in order in "CommandPalette"
    const score = fuzzyScore("CommandPalette", "cmdplt");
    expect(score).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    const upper = fuzzyScore("CommandPalette", "CMDPLT");
    const lower = fuzzyScore("CommandPalette", "cmdplt");
    expect(upper).toBe(lower);
    expect(upper).toBeGreaterThan(0);
  });

  it("scores exact prefix higher than scattered match", () => {
    // WB-FE-CP-S1c: prefix match "Com" on "CommandPalette" should score higher
    // than scattered match "cpt" on "CommandPalette"
    const prefixScore = fuzzyScore("CommandPalette", "Com");
    const scatteredScore = fuzzyScore("CommandPalette", "cpt");
    expect(prefixScore).toBeGreaterThan(scatteredScore);
  });

  it("scores consecutive characters higher than scattered", () => {
    const consecutive = fuzzyScore("CommandPalette", "Command");
    const scattered = fuzzyScore("CommandPalette", "cmndplt");
    expect(consecutive).toBeGreaterThan(scattered);
  });
});

describe("fuzzyFilter", () => {
  const items: CommandItem[] = [
    makeItem("CommandPalette"),
    makeItem("DashboardPage"),
    makeItem("SettingsPanel"),
    makeItem("ExportDialog"),
  ];

  it("matches items by fuzzy character sequence (WB-FE-CP-S1)", () => {
    const result = fuzzyFilter(items, "cmdplt");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.label === "CommandPalette")).toBe(true);
  });

  it("matches 'dshbrd' to DashboardPage (WB-FE-CP-S1)", () => {
    const result = fuzzyFilter(items, "dshbrd");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.label === "DashboardPage")).toBe(true);
  });

  it("returns empty array when no items match (WB-FE-CP-S1b)", () => {
    const result = fuzzyFilter(items, "zzzzxyz");
    expect(result).toEqual([]);
  });

  it("ranks prefix match before fuzzy match (WB-FE-CP-S1c)", () => {
    const testItems: CommandItem[] = [
      makeItem("CreateProject"), // fuzzy match for "com"
      makeItem("CommandPalette"), // prefix match for "com"
      makeItem("CompareFiles"), // prefix match for "com"
    ];

    const result = fuzzyFilter(testItems, "com");

    // Items starting with "com" should come before items that only match fuzzily
    const firstTwoLabels = result.slice(0, 2).map((r) => r.label);
    expect(firstTwoLabels).toContain("CommandPalette");
    expect(firstTwoLabels).toContain("CompareFiles");
  });

  it("returns all items for empty query", () => {
    const result = fuzzyFilter(items, "");
    expect(result).toEqual(items);
  });

  it("returns all items for whitespace-only query", () => {
    const result = fuzzyFilter(items, "   ");
    expect(result).toEqual(items);
  });
});
