import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_SRC_DIR = resolve(CURRENT_DIR, "..", "..");

const OVERLAY_FILES = [
  "features/ai/ModelPicker.tsx",
  "features/ai/ChatHistory.tsx",
  "features/ai/SkillPicker.tsx",
  "features/ai/ModePicker.tsx",
] as const;

function readRendererFile(relativePath: string): string {
  return readFileSync(resolve(RENDERER_SRC_DIR, relativePath), "utf8");
}

function readNumericCssToken(cssSource: string, tokenName: string): number {
  const match = cssSource.match(
    new RegExp(`--${tokenName}:\\s*(?<value>[0-9]+)\\s*;`),
  );
  if (!match?.groups?.value) {
    throw new Error(`Missing numeric token value for --${tokenName}`);
  }

  return Number.parseInt(match.groups.value, 10);
}

describe("WB-P1-S3: overlay layering guard", () => {
  it("keeps semantic z token order in tokens.css", () => {
    const tokensCss = readRendererFile("styles/tokens.css");

    const zDropdown = readNumericCssToken(tokensCss, "z-dropdown");
    const zPopover = readNumericCssToken(tokensCss, "z-popover");
    const zModal = readNumericCssToken(tokensCss, "z-modal");

    expect(zDropdown).toBeLessThan(zPopover);
    expect(zPopover).toBeLessThan(zModal);
  });

  it("requires tokenized z classes for overlay backdrops and popups", () => {
    for (const relativePath of OVERLAY_FILES) {
      const source = readRendererFile(relativePath);
      const numericZClasses = source.match(/\bz-(?:10|20|30|40|50)\b/g) ?? [];
      const tokenizedZClasses =
        source.match(/z-\[var\(--z-(?:dropdown|popover|modal)\)\]/g) ?? [];

      expect(
        numericZClasses,
        `${relativePath} should not use numeric z-index utility classes`,
      ).toHaveLength(0);
      expect(
        tokenizedZClasses.length,
        `${relativePath} should use tokenized z classes for backdrop and popup`,
      ).toBeGreaterThanOrEqual(2);
    }
  });
});
