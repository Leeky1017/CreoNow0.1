/**
 * Design Token 全量同步 guard（allowlist 机制）
 *
 * Spec §Token 同步契约 要求 design/system/01-tokens.css 与
 * renderer/src/styles/tokens.css 保持完全同步。
 *
 * 本 guard 提取两文件中所有 CSS custom property 名称，检查：
 * 1. 所有 design source token 必须存在于 renderer（零差异）
 * 2. renderer 中多出的 token 必须在 RENDERER_ONLY_ALLOWLIST 中声明
 * 3. 共有 token 的值必须一致（:root 主块内）
 *
 * 新增 renderer-only token 时，必须同步更新 RENDERER_ONLY_ALLOWLIST 并
 * 添加注释说明用途，否则本 guard 将红灯阻断。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const DESIGN_TOKENS_PATH = path.join(REPO_ROOT, "design/system/01-tokens.css");
const RENDERER_TOKENS_PATH = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/tokens.css",
);

/**
 * Renderer-only tokens that exist for technical/platform reasons
 * and don't need to appear in the design source.
 *
 * Each entry must include a justification comment.
 */
const RENDERER_ONLY_ALLOWLIST = new Set([
  // Accent color references — derived from platform palette
  "--color-accent-blue",
  "--color-accent-cyan",
  "--color-accent-green",
  "--color-accent-orange",
  "--color-accent-purple",

  // Overlay / selection / caret — runtime UI primitives
  "--color-bg-overlay",
  "--color-caret",
  "--color-fg-base",
  "--color-selection",

  // Zen mode — Electron-only feature, no design-source counterpart
  "--color-zen-bg",
  "--color-zen-glow",
  "--color-zen-hover",
  "--color-zen-statusbar-bg",
  "--color-zen-text",
  "--zen-body-line-height",
  "--zen-body-size",
  "--zen-content-max-width",
  "--zen-content-padding-x",
  "--zen-content-padding-y",
  "--zen-label-size",
  "--zen-title-size",

  // Editor-specific layout tokens
  "--text-editor-paragraph-spacing",
  "--space-featured-image-height",
  "--space-editor-padding-x",
  "--editor-content-max-width",

  // Z-index for overlay layer
  "--z-overlay",
]);

/**
 * Extract all `--xxx:` custom property names from all :root blocks in a CSS
 * string. Matches `:root`, `:root[data-theme="dark"]`, etc.
 * Ignores tokens inside @media blocks (e.g. reduced-motion overrides).
 */
function extractRootTokenNames(css: string): Set<string> {
  const tokens = new Set<string>();

  // Strip @media blocks first to avoid counting overrides
  const withoutMedia = css.replace(/@media\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, "");

  // Match all :root variants
  for (const rootMatch of withoutMedia.matchAll(
    /:root(?:\[[^\]]*\])?\s*\{([^}]*)\}/g,
  )) {
    const block = rootMatch[1];
    for (const match of block.matchAll(/\s(--[a-zA-Z0-9_-]+)\s*:/g)) {
      tokens.add(match[1]);
    }
  }
  return tokens;
}

/**
 * Extract token name→value map from all :root blocks (non-themed only).
 * For value comparison we use the plain :root block (shared tokens).
 */
function extractRootTokenValues(css: string): Map<string, string> {
  const map = new Map<string, string>();

  // Strip @media blocks
  const withoutMedia = css.replace(/@media\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g, "");

  // Match plain :root blocks only (no data-theme attribute)
  for (const rootMatch of withoutMedia.matchAll(/:root\s*\{([^}]*)\}/g)) {
    // Skip themed blocks like :root[data-theme="dark"]
    const fullMatch = rootMatch[0];
    if (fullMatch.includes("[")) continue;

    const block = rootMatch[1];
    for (const match of block.matchAll(
      /\s(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g,
    )) {
      map.set(match[1], match[2].trim());
    }
  }
  return map;
}

describe("Design Token 全量同步 guard", () => {
  const designCSS = readFileSync(DESIGN_TOKENS_PATH, "utf8");
  const rendererCSS = readFileSync(RENDERER_TOKENS_PATH, "utf8");

  const designTokens = extractRootTokenNames(designCSS);
  const rendererTokens = extractRootTokenNames(rendererCSS);

  it("design source 中的每个 token 必须存在于 renderer", () => {
    const missingInRenderer: string[] = [];
    for (const token of designTokens) {
      if (!rendererTokens.has(token)) {
        missingInRenderer.push(token);
      }
    }
    expect(
      missingInRenderer,
      `以下 design token 缺失于 renderer tokens.css:\n${missingInRenderer.join("\n")}`,
    ).toEqual([]);
  });

  it("renderer 中多出的 token 必须在 RENDERER_ONLY_ALLOWLIST 中声明", () => {
    const unallowed: string[] = [];
    for (const token of rendererTokens) {
      if (!designTokens.has(token) && !RENDERER_ONLY_ALLOWLIST.has(token)) {
        unallowed.push(token);
      }
    }
    expect(
      unallowed,
      `以下 renderer-only token 未在 allowlist 中声明。请评估：\n` +
        `  - 属于平台特有？→ 加入 RENDERER_ONLY_ALLOWLIST\n` +
        `  - 属于通用设计？→ 同步到 design/system/01-tokens.css\n` +
        `未声明 token:\n${unallowed.join("\n")}`,
    ).toEqual([]);
  });

  it("allowlist 中不应有过时条目（已在 design source 中定义的 token）", () => {
    const stale: string[] = [];
    for (const token of RENDERER_ONLY_ALLOWLIST) {
      if (designTokens.has(token)) {
        stale.push(token);
      }
    }
    expect(
      stale,
      `以下 allowlist 条目已在 design source 中定义，应从 allowlist 中移除:\n${stale.join("\n")}`,
    ).toEqual([]);
  });

  it("共有 token 的值保持一致", () => {
    const designValues = extractRootTokenValues(designCSS);
    const rendererValues = extractRootTokenValues(rendererCSS);

    const mismatches: string[] = [];
    for (const token of designTokens) {
      if (!rendererTokens.has(token)) continue;
      const dv = designValues.get(token);
      const rv = rendererValues.get(token);
      if (dv !== rv) {
        mismatches.push(`${token}: design="${dv}" renderer="${rv}"`);
      }
    }
    expect(
      mismatches,
      `以下共有 token 值不一致:\n${mismatches.join("\n")}`,
    ).toEqual([]);
  });
});
