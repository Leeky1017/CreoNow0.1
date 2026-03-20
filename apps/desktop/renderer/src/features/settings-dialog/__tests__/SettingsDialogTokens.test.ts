import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * v1-07 Guard Proof: Settings Dialog CSS Contracts
 *
 * Verifies that accent palette tokens are registered and
 * SettingsDialog decomposition constraints are maintained.
 */

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const SETTINGS_NAV_PATH = resolve(CURRENT_DIR, "../SettingsNavigation.tsx");
const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("[Guard] accent palette registered in tokens.css", () => {
  it("defines --color-accent-* tokens for all 6 palette colors", () => {
    const tokens = readSource(TOKENS_PATH);
    const accentTokens = [
      "--color-accent-white",
      "--color-accent-blue",
      "--color-accent-green",
      "--color-accent-orange",
      "--color-accent-purple",
      "--color-accent-pink",
    ];
    for (const token of accentTokens) {
      expect(tokens).toContain(token);
    }
  });
});

describe("[Guard] SettingsDialog decomposition (AC-15)", () => {
  const DIALOG_PATH = resolve(CURRENT_DIR, "../SettingsDialog.tsx");

  it("SettingsDialog.tsx is ≤ 300 lines", () => {
    const source = readSource(DIALOG_PATH);
    const lineCount = source.split("\n").length;
    expect(lineCount).toBeLessThanOrEqual(300);
  });

  it("SettingsNavigation.tsx exists as extracted component", () => {
    const source = readSource(SETTINGS_NAV_PATH);
    expect(source).toContain("SettingsNavigation");
  });
});
