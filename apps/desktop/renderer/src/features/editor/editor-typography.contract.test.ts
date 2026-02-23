import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_TOKEN_PATH = resolve(CURRENT_DIR, "../../styles/tokens.css");
const DESIGN_TOKEN_PATH = resolve(
  CURRENT_DIR,
  "../../../../../../design/system/01-tokens.css",
);
const TYPOGRAPHY_HELPER_PATH = resolve(CURRENT_DIR, "typography.ts");
const EDITOR_PANE_PATH = resolve(CURRENT_DIR, "EditorPane.tsx");

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

  it("[ED-TYPO-02] should provide typography helper for locale + scale resolution", () => {
    expect(existsSync(TYPOGRAPHY_HELPER_PATH)).toBe(true);

    const helperSource = existsSync(TYPOGRAPHY_HELPER_PATH)
      ? read(TYPOGRAPHY_HELPER_PATH)
      : "";
    expect(helperSource).toContain("resolveEditorLineHeightToken");
    expect(helperSource).toContain("resolveEditorScaleFactor");
  });

  it("[ED-TYPO-02] EditorPane should consume typography helper", () => {
    const editorPaneSource = read(EDITOR_PANE_PATH);

    expect(editorPaneSource).toContain("resolveEditorLineHeightToken");
    expect(editorPaneSource).toContain("resolveEditorScaleFactor");
  });
});
