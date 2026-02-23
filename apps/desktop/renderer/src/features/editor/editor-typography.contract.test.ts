import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  resolveEditorLineHeightToken,
  resolveEditorScaleFactor,
} from "./typography";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_TOKEN_PATH = resolve(CURRENT_DIR, "../../styles/tokens.css");
const DESIGN_TOKEN_PATH = resolve(
  CURRENT_DIR,
  "../../../../../../design/system/01-tokens.css",
);
const TYPOGRAPHY_HELPER_PATH = resolve(CURRENT_DIR, "typography.ts");
const EDITOR_PANE_PATH = resolve(CURRENT_DIR, "EditorPane.tsx");
const EDITOR_TOOLBAR_STORIES_PATH = resolve(
  CURRENT_DIR,
  "EditorToolbar.stories.tsx",
);

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("editor typography contracts", () => {
  it("[ED-TYPO-01] should define CJK line-height token in renderer token sheet", () => {
    const rendererTokens = read(RENDERER_TOKEN_PATH);

    expect(rendererTokens).toContain("--text-editor-line-height-cjk");
  });

  it("[ED-TYPO-01] should define CJK line-height token in design token SSOT", () => {
    const designTokens = read(DESIGN_TOKEN_PATH);

    expect(designTokens).toContain("--text-editor-line-height-cjk");
  });

  it("[ED-TYPO-02] should resolve deterministic locale-aware line-height token", () => {
    expect(resolveEditorLineHeightToken("zh-CN")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
    expect(resolveEditorLineHeightToken("ja-JP")).toBe(
      "var(--text-editor-line-height-cjk)",
    );
    expect(resolveEditorLineHeightToken("en-US")).toBe(
      "var(--text-editor-line-height)",
    );
  });

  it("[ED-TYPO-02] should resolve 125%/150% scale tiers without hardcoded fallback drift", () => {
    expect(resolveEditorScaleFactor(100)).toBe("var(--text-scale-factor-default)");
    expect(resolveEditorScaleFactor(125)).toBe("var(--text-scale-factor-125)");
    expect(resolveEditorScaleFactor(150)).toBe("var(--text-scale-factor-150)");
    expect(resolveEditorScaleFactor(175)).toBe("var(--text-scale-factor-150)");
  });

  it("[ED-TYPO-02] EditorPane should consume typography vars for scalable rendering", () => {
    expect(existsSync(TYPOGRAPHY_HELPER_PATH)).toBe(true);
    const editorPaneSource = read(EDITOR_PANE_PATH);

    expect(editorPaneSource).toContain("resolveEditorLineHeightToken");
    expect(editorPaneSource).toContain("resolveEditorScaleFactor");
    expect(editorPaneSource).toContain("--editor-scale-factor");
    expect(editorPaneSource).toContain("--editor-font-size");
    expect(editorPaneSource).toContain(
      "text-[length:var(--editor-font-size)]",
    );
    expect(editorPaneSource).toContain("leading-[var(--editor-line-height)]");
    expect(editorPaneSource).not.toContain("line-clamp");
    expect(editorPaneSource).not.toContain("truncate");
  });

  it("[ED-TYPO-02] toolbar stories should keep 125%/150% font-scale baselines", () => {
    const storySource = read(EDITOR_TOOLBAR_STORIES_PATH);

    expect(storySource).toContain("export const FontScale125");
    expect(storySource).toContain('fontSize: "125%"');
    expect(storySource).toContain("export const FontScale150");
    expect(storySource).toContain('fontSize: "150%"');
  });
});
