import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * v1-07 Guard Proof: Settings Appearance Token Compliance
 *
 * Verifies that hardcoded colors have been eliminated from
 * SettingsAppearancePage in favor of Design Token references
 * and named constants.
 */

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const APPEARANCE_PAGE_PATH = resolve(
  CURRENT_DIR,
  "../SettingsAppearancePage.tsx",
);

function readSource(): string {
  return readFileSync(APPEARANCE_PAGE_PATH, "utf8");
}

describe("[Guard] SettingsAppearancePage hardcoded color elimination", () => {
  // AC-3: ThemePreview 硬编码颜色 → token 引用
  const themePreviewHardcoded = ["#0f0f0f", "#1a1a1a", "#666666", "#888888"];

  it.each(themePreviewHardcoded)(
    "ThemePreview does not contain hardcoded color %s (AC-3)",
    (hex) => {
      const source = readSource();
      // ThemePreview should use CSS variables, not hardcoded hex values
      expect(source).not.toContain(hex);
    },
  );

  // AC-2: 色板通过命名常量定义
  it("accent colors are defined via ACCENT_PALETTE constant (AC-2)", () => {
    const source = readSource();
    expect(source).toContain("ACCENT_PALETTE");
  });

  // AC-1: 默认 accentColor 使用常量引用
  it("default accentColor references a named constant, not raw hex (AC-1)", () => {
    const source = readSource();
    // The default settings block should reference ACCENT_PALETTE or DEFAULT_ACCENT_COLOR
    const defaultSettingsBlock = source.slice(
      source.indexOf("defaultAppearanceSettings"),
    );
    const usesConstant =
      defaultSettingsBlock.includes("ACCENT_PALETTE") ||
      defaultSettingsBlock.includes("DEFAULT_ACCENT_COLOR");
    expect(usesConstant).toBe(true);
  });
});

describe("[Guard] accent palette token registration", () => {
  const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");

  it("registers --color-accent-* tokens for all palette colors in tokens.css", () => {
    const tokens = readFileSync(TOKENS_PATH, "utf8");
    expect(tokens).toContain("--color-accent-white");
    expect(tokens).toContain("--color-accent-blue");
    expect(tokens).toContain("--color-accent-green");
    expect(tokens).toContain("--color-accent-orange");
    expect(tokens).toContain("--color-accent-purple");
    expect(tokens).toContain("--color-accent-pink");
  });
});
