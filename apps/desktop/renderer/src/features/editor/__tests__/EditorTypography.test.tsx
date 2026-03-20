import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  resolveEditorLineHeightToken,
  resolveEditorScaleFactor,
} from "../typography";

/**
 * EditorTypography — Primary + Guard Proof for v1-04
 *
 * Test hierarchy:
 *   1. Primary Proof: typography utility behavior (line-height, scale)
 *   2. Primary Proof: layout constraint behavior
 *   3. Guard Proof: CSS token contracts (token existence & sync)
 */

// ── Primary Proof: typography utilities ──────────────────────────────

describe("resolveEditorLineHeightToken", () => {
  it("returns CJK line-height token for Chinese locale", () => {
    expect(resolveEditorLineHeightToken("zh-CN")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
  });

  it("returns CJK line-height token for Japanese locale", () => {
    expect(resolveEditorLineHeightToken("ja-JP")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
  });

  it("returns CJK line-height token for Korean locale", () => {
    expect(resolveEditorLineHeightToken("ko-KR")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
  });

  it("returns default line-height token for English locale", () => {
    expect(resolveEditorLineHeightToken("en-US")).toBe(
      "var(--text-editor-line-height)",
    );
  });

  it("returns default line-height token for null locale", () => {
    expect(resolveEditorLineHeightToken(null)).toBe(
      "var(--text-editor-line-height)",
    );
  });

  it("returns default line-height token for undefined locale", () => {
    expect(resolveEditorLineHeightToken(undefined)).toBe(
      "var(--text-editor-line-height)",
    );
  });

  it("returns default line-height token for empty string", () => {
    expect(resolveEditorLineHeightToken("")).toBe(
      "var(--text-editor-line-height)",
    );
  });

  // Edge: locale with underscore separator
  it("handles underscore-delimited CJK locales (zh_TW)", () => {
    expect(resolveEditorLineHeightToken("zh_TW")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
  });

  // Edge: bare language code without region
  it("handles bare CJK language code (zh)", () => {
    expect(resolveEditorLineHeightToken("zh")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
  });
});

describe("resolveEditorScaleFactor", () => {
  it("returns default scale factor for 100% DPI", () => {
    expect(resolveEditorScaleFactor(100)).toBe(
      "var(--text-scale-factor-default)",
    );
  });

  it("returns 125% scale factor at exactly 125%", () => {
    expect(resolveEditorScaleFactor(125)).toBe("var(--text-scale-factor-125)");
  });

  it("returns 150% scale factor at exactly 150%", () => {
    expect(resolveEditorScaleFactor(150)).toBe("var(--text-scale-factor-150)");
  });

  it("returns 150% scale factor for values above 150%", () => {
    expect(resolveEditorScaleFactor(175)).toBe("var(--text-scale-factor-150)");
    expect(resolveEditorScaleFactor(200)).toBe("var(--text-scale-factor-150)");
  });

  it("returns default scale factor for null", () => {
    expect(resolveEditorScaleFactor(null)).toBe(
      "var(--text-scale-factor-default)",
    );
  });

  it("returns default scale factor for undefined", () => {
    expect(resolveEditorScaleFactor(undefined)).toBe(
      "var(--text-scale-factor-default)",
    );
  });

  // Boundary: just below thresholds
  it("returns default for 124% (just below 125% threshold)", () => {
    expect(resolveEditorScaleFactor(124)).toBe(
      "var(--text-scale-factor-default)",
    );
  });

  it("returns 125% for 149% (just below 150% threshold)", () => {
    expect(resolveEditorScaleFactor(149)).toBe("var(--text-scale-factor-125)");
  });
});

// ── Guard Proof: CSS token contracts ────────────────────────────────
// These tests verify that required Design Tokens and CSS contracts
// exist in the stylesheets. Guard Proof prevents accidental deletion
// of tokens or CSS rules. They supplement but do NOT replace
// Primary Proof (component-level behavioral verification).

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");
const MAIN_CSS_PATH = resolve(CURRENT_DIR, "../../../styles/main.css");

function readCSS(path: string): string {
  return readFileSync(path, "utf8");
}

describe("[Guard] editor typography token existence", () => {
  it("defines display title tokens (AC-2: 48px/300/-0.03em)", () => {
    const tokens = readCSS(TOKENS_PATH);

    expect(tokens).toContain("--text-display-size");
    expect(tokens).toContain("--text-display-weight");
    expect(tokens).toContain("--text-display-letter-spacing");
    expect(tokens).toContain("--text-display-line-height");
  });

  it("defines editor body tokens (AC-4: line-height 1.8)", () => {
    const tokens = readCSS(TOKENS_PATH);

    expect(tokens).toContain("--text-editor-line-height");
    expect(tokens).toContain("--text-editor-line-height-cjk");
    expect(tokens).toContain("--leading-relaxed");
  });

  it("defines serif font family (AC-3: Lora support)", () => {
    const tokens = readCSS(TOKENS_PATH);

    expect(tokens).toMatch(/--font-family-body:.*[Ll]ora/);
  });

  it("defines editor scale factor tokens", () => {
    const tokens = readCSS(TOKENS_PATH);

    expect(tokens).toContain("--text-scale-factor-default");
    expect(tokens).toContain("--text-scale-factor-125");
    expect(tokens).toContain("--text-scale-factor-150");
  });

  it("defines editor layout tokens (AC-1: max-width, AC-6: padding)", () => {
    const tokens = readCSS(TOKENS_PATH);

    expect(tokens).toContain("--editor-content-max-width");
    expect(tokens).toContain("--space-editor-padding-x");
  });
});

describe("[Guard] ProseMirror editor CSS contracts", () => {
  it("defines .ProseMirror h1 rule with display tokens (AC-2)", () => {
    const mainCSS = readCSS(MAIN_CSS_PATH);

    // Verify that the CSS contains a .ProseMirror h1 block using display tokens
    expect(mainCSS).toContain(".ProseMirror h1");
    expect(mainCSS).toContain("var(--text-display-size)");
    expect(mainCSS).toContain("var(--text-display-weight)");
    expect(mainCSS).toContain("var(--text-display-letter-spacing)");
  });

  it("defines max-width constraint for editor content (AC-1)", () => {
    const mainCSS = readCSS(MAIN_CSS_PATH);

    expect(mainCSS).toContain("--editor-content-max-width");
    expect(mainCSS).toContain("margin-left: auto");
    expect(mainCSS).toContain("margin-right: auto");
  });

  it("defines editor horizontal padding using semantic token (AC-6)", () => {
    const mainCSS = readCSS(MAIN_CSS_PATH);

    expect(mainCSS).toContain("--space-editor-padding-x");
  });

  it("maps display + editor typography to Tailwind @theme", () => {
    const mainCSS = readCSS(MAIN_CSS_PATH);

    expect(mainCSS).toContain("--text-display");
    expect(mainCSS).toContain("--text-editor");
  });
});
