import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");
const MAIN_CSS_PATH = resolve(CURRENT_DIR, "../../../styles/main.css");
const FONTS_CSS_PATH = resolve(CURRENT_DIR, "../../../styles/fonts.css");
const EDITOR_PANE_PATH = resolve(CURRENT_DIR, "../EditorPane.tsx");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("v1-04 editor typography and layout contracts", () => {
  describe("AC-1: max-width 760px + centered", () => {
    it("[ED-LAYOUT-01] tokens.css defines --editor-content-max-width", () => {
      const css = read(TOKENS_PATH);
      expect(css).toContain("--editor-content-max-width");
    });

    it("[ED-LAYOUT-01] main.css applies max-width to ProseMirror", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toContain("var(--editor-content-max-width)");
      expect(css).toMatch(/\.ProseMirror\b[^}]*max-width/s);
    });

    it("[ED-LAYOUT-01] main.css centers ProseMirror with auto margins", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(/\.ProseMirror\b[^}]*margin-left:\s*auto/s);
      expect(css).toMatch(/\.ProseMirror\b[^}]*margin-right:\s*auto/s);
    });
  });

  describe("AC-2: H1 uses --text-display-* tokens (48px/300/-0.03em)", () => {
    it("[ED-TYPO-H1-01] main.css styles .ProseMirror h1 with display size token", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(
        /\.ProseMirror\s+h1\b[^}]*var\(--text-display-size\)/s,
      );
    });

    it("[ED-TYPO-H1-02] main.css styles .ProseMirror h1 with display weight token", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(
        /\.ProseMirror\s+h1\b[^}]*var\(--text-display-weight\)/s,
      );
    });

    it("[ED-TYPO-H1-03] main.css styles .ProseMirror h1 with display letter-spacing token", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(
        /\.ProseMirror\s+h1\b[^}]*var\(--text-display-letter-spacing\)/s,
      );
    });

    it("[ED-TYPO-H1-04] main.css styles .ProseMirror h1 with display line-height token", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(
        /\.ProseMirror\s+h1\b[^}]*var\(--text-display-line-height\)/s,
      );
    });
  });

  describe("AC-3: serif font support via CSS var/class", () => {
    it("[ED-SERIF-01] tokens.css defines --editor-active-font-family", () => {
      const css = read(TOKENS_PATH);
      expect(css).toContain("--editor-active-font-family");
    });

    it("[ED-SERIF-02] fonts.css includes Lora in --font-family-body", () => {
      const css = read(FONTS_CSS_PATH);
      expect(css).toMatch(/--font-family-body:.*Lora/);
    });

    it("[ED-SERIF-03] main.css defines .editor-font-sans class override", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(/\.editor-font-sans\b/);
      expect(css).toMatch(
        /\.editor-font-sans[^}]*--editor-active-font-family/s,
      );
    });

    it("[ED-SERIF-04] EditorPane uses --editor-active-font-family var", () => {
      const src = read(EDITOR_PANE_PATH);
      expect(src).toContain("--editor-active-font-family");
    });
  });

  describe("AC-4: line-height 1.8 via --leading-relaxed", () => {
    it("[ED-LH-01] tokens.css --text-editor-line-height references --leading-relaxed", () => {
      const css = read(TOKENS_PATH);
      expect(css).toMatch(
        /--text-editor-line-height:\s*var\(--leading-relaxed\)/,
      );
    });
  });

  describe("AC-6: side padding 40-48px via semantic spacing token", () => {
    it("[ED-PAD-01] tokens.css defines --editor-content-padding-x", () => {
      const css = read(TOKENS_PATH);
      expect(css).toContain("--editor-content-padding-x");
    });

    it("[ED-PAD-02] main.css applies padding to ProseMirror using token", () => {
      const css = read(MAIN_CSS_PATH);
      expect(css).toMatch(
        /\.ProseMirror\b[^}]*var\(--editor-content-padding-x\)/s,
      );
    });
  });

  describe("AC-7: no new arbitrary typography values", () => {
    it("[ED-TOK-01] EditorPane has no text-4xl class", () => {
      const src = read(EDITOR_PANE_PATH);
      expect(src).not.toContain("text-4xl");
    });
  });
});
