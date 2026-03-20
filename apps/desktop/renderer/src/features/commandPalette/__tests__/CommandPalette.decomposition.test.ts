/**
 * Decomposition guard tests for CommandPalette.
 *
 * Ensures the CommandPalette module is properly decomposed:
 * - Main file ≤ 300 lines (AC-16)
 * - Each extracted sub-module ≤ 300 lines
 * - All public exports re-exported from expected files
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const COMMAND_PALETTE_DIR = path.resolve(
  __dirname,
  "..",
);

function lineCount(filePath: string): number {
  return fs.readFileSync(filePath, "utf-8").split("\n").length;
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

describe("CommandPalette decomposition (AC-16)", () => {
  const mainFile = path.join(COMMAND_PALETTE_DIR, "CommandPalette.tsx");
  const typesFile = path.join(COMMAND_PALETTE_DIR, "commandPaletteTypes.ts");
  const helpersFile = path.join(COMMAND_PALETTE_DIR, "commandPaletteHelpers.tsx");
  const commandsFile = path.join(COMMAND_PALETTE_DIR, "commandPaletteCommands.tsx");

  describe("file existence", () => {
    it("has commandPaletteTypes.ts", () => {
      expect(fileExists(typesFile)).toBe(true);
    });
    it("has commandPaletteHelpers.ts", () => {
      expect(fileExists(helpersFile)).toBe(true);
    });
    it("has commandPaletteCommands.tsx", () => {
      expect(fileExists(commandsFile)).toBe(true);
    });
  });

  describe("line count limits (≤ 300)", () => {
    it("CommandPalette.tsx ≤ 300 lines", () => {
      expect(lineCount(mainFile)).toBeLessThanOrEqual(300);
    });
    it("commandPaletteTypes.ts ≤ 300 lines", () => {
      expect(lineCount(typesFile)).toBeLessThanOrEqual(300);
    });
    it("commandPaletteHelpers.ts ≤ 300 lines", () => {
      expect(lineCount(helpersFile)).toBeLessThanOrEqual(300);
    });
    it("commandPaletteCommands.tsx ≤ 300 lines", () => {
      expect(lineCount(commandsFile)).toBeLessThanOrEqual(300);
    });
  });

  describe("exports completeness", () => {
    it("commandPaletteTypes.ts exports CommandItem interface", async () => {
      const mod = await import("../commandPaletteTypes");
      expect(mod).toHaveProperty("commandItemSchema");
    });
    it("commandPaletteHelpers.ts exports filterCommands", async () => {
      const mod = await import("../commandPaletteHelpers");
      expect(typeof mod.filterCommands).toBe("function");
    });
    it("commandPaletteCommands.tsx exports buildDefaultCommands", async () => {
      const mod = await import("../commandPaletteCommands");
      expect(typeof mod.buildDefaultCommands).toBe("function");
    });
  });
});
