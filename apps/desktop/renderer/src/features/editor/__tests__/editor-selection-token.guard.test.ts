import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = resolve(CURRENT_DIR, "../../../styles/tokens.css");
const MAIN_CSS_PATH = resolve(CURRENT_DIR, "../../../styles/main.css");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("editor selection / caret / spacing token guards", () => {
  it("[ED-FE-TOK-S1] tokens.css defines --color-selection for light and dark themes", () => {
    const css = read(TOKENS_PATH);

    // Must appear in both theme blocks
    const lightBlock = css.slice(css.indexOf('[data-theme="light"]'));
    const darkBlock = css.slice(css.indexOf('[data-theme="dark"]'));

    expect(lightBlock).toContain("--color-selection");
    expect(darkBlock).toContain("--color-selection");
  });

  it("[ED-FE-TOK-S2] tokens.css defines --color-caret", () => {
    const css = read(TOKENS_PATH);

    expect(css).toContain("--color-caret");
  });

  it("[ED-FE-TOK-S3] tokens.css defines --text-editor-paragraph-spacing", () => {
    const css = read(TOKENS_PATH);

    expect(css).toContain("--text-editor-paragraph-spacing");
  });

  it("[ED-FE-TOK-S4] main.css applies selection token to ProseMirror", () => {
    const css = read(MAIN_CSS_PATH);

    expect(css).toContain("::selection");
    expect(css).toContain("var(--color-selection)");
  });

  it("[ED-FE-TOK-S5] main.css applies caret token to ProseMirror", () => {
    const css = read(MAIN_CSS_PATH);

    expect(css).toContain("caret-color");
    expect(css).toContain("var(--color-caret)");
  });
});
