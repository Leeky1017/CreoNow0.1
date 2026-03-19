/**
 * v1-01 Design Token 完整性 guard
 *
 * 作用域：仅覆盖 v1-01 新增的 token 子集（typography / weight / tracking /
 * leading / semantic spacing / @theme inline / heading alias）。
 *
 * Spec §Token 同步契约 要求 design source 与 renderer 完全同步。
 * 完整同步验证由 design-token-sync-allowlist.test.ts 负责，本文件只守
 * v1-01 子集的存在性和值一致性。
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const DESIGN_TOKENS = path.join(REPO_ROOT, "design/system/01-tokens.css");
const RENDERER_TOKENS = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/tokens.css",
);
const MAIN_CSS = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/main.css",
);

function readCSS(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function extractTokenValue(css: string, token: string): string {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedToken}:\\s*([^;]+);`));
  expect(match, `缺少 token: ${token}`).not.toBeNull();
  return match![1].trim();
}

describe("v1-01 Design Token 完整性 guard", () => {
  const designTokens = readCSS(DESIGN_TOKENS);
  const rendererTokens = readCSS(RENDERER_TOKENS);
  const mainCSS = readCSS(MAIN_CSS);

  describe("typography scale token（design/system/01-tokens.css）", () => {
    const typographyGroups = [
      {
        prefix: "--text-display",
        size: "48px",
        weight: "300",
        lineHeight: "1.1",
        letterSpacing: "-0.03em",
      },
      {
        prefix: "--text-heading",
        size: "24px",
        weight: "600",
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
      },
      {
        prefix: "--text-nav",
        size: "13px",
        weight: "500",
        lineHeight: "1.4",
        letterSpacing: "0",
      },
      {
        prefix: "--text-metadata",
        size: "12px",
        weight: "400",
        lineHeight: "1.4",
        letterSpacing: "0.02em",
      },
    ] as const;

    for (const group of typographyGroups) {
      it(`包含 ${group.prefix} 四件组`, () => {
        expect(designTokens).toContain(`${group.prefix}-size: ${group.size}`);
        expect(designTokens).toContain(
          `${group.prefix}-weight: ${group.weight}`,
        );
        expect(designTokens).toContain(
          `${group.prefix}-line-height: ${group.lineHeight}`,
        );
        expect(designTokens).toContain(
          `${group.prefix}-letter-spacing: ${group.letterSpacing}`,
        );
      });
    }
  });

  describe("独立 weight / tracking / leading token（design/system/01-tokens.css）", () => {
    it("包含独立字重 token", () => {
      expect(designTokens).toContain("--weight-light: 300");
      expect(designTokens).toContain("--weight-normal: 400");
      expect(designTokens).toContain("--weight-medium: 500");
      expect(designTokens).toContain("--weight-semibold: 600");
    });

    it("包含独立字间距 token", () => {
      expect(designTokens).toContain("--tracking-tight: -0.03em");
      expect(designTokens).toContain("--tracking-normal: 0");
      expect(designTokens).toContain("--tracking-wide: 0.05em");
      expect(designTokens).toContain("--tracking-wider: 0.1em");
    });

    it("包含独立行高 token", () => {
      expect(designTokens).toContain("--leading-tight: 1.1");
      expect(designTokens).toContain("--leading-normal: 1.5");
      expect(designTokens).toContain("--leading-relaxed: 1.8");
    });
  });

  describe("语义间距 token（design/system/01-tokens.css）", () => {
    it("包含语义间距别名", () => {
      expect(designTokens).toContain("--space-panel-padding: var(--space-4)");
      expect(designTokens).toContain("--space-section-gap: var(--space-6)");
      expect(designTokens).toContain("--space-item-gap: var(--space-2)");
      expect(designTokens).toContain("--space-inline-gap: var(--space-1)");
    });
  });

  describe("@theme 块 duration 补全", () => {
    it("包含 --duration-instant 和 --duration-slower", () => {
      expect(mainCSS).toContain("--duration-instant: 50ms");
      expect(mainCSS).toContain("--duration-slower: 500ms");
    });
  });

  describe("@theme inline — Tailwind v4 namespace 正确性", () => {
    function extractThemeInlineBlock(css: string): string {
      const match = css.match(/@theme\s+inline\s*\{([\s\S]*?)\n\}/);
      expect(match, "main.css 缺少 @theme inline 块").not.toBeNull();
      return match![1];
    }

    it("存在 @theme inline 块", () => {
      expect(mainCSS).toMatch(/@theme\s+inline\s*\{/);
    });

    it("typography 使用 Tailwind v4 text namespace（--text-<name> + 双横线子属性）", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      const textGroups = [
        { name: "display", letterSpacingVar: "text-display-letter-spacing" },
        { name: "heading", letterSpacingVar: "text-heading-letter-spacing" },
        {
          name: "page-title",
          letterSpacingVar: "text-page-title-letter-spacing",
        },
        {
          name: "card-title",
          letterSpacingVar: "text-card-title-letter-spacing",
        },
        { name: "subtitle", letterSpacingVar: "tracking-normal" },
        { name: "body", letterSpacingVar: "tracking-normal" },
        { name: "editor", letterSpacingVar: "tracking-normal" },
        { name: "caption", letterSpacingVar: "tracking-normal" },
        { name: "label", letterSpacingVar: "text-label-letter-spacing" },
        { name: "tree", letterSpacingVar: "tracking-normal" },
        { name: "status", letterSpacingVar: "tracking-normal" },
        { name: "mono", letterSpacingVar: "tracking-normal" },
        { name: "nav", letterSpacingVar: "text-nav-letter-spacing" },
        {
          name: "metadata",
          letterSpacingVar: "text-metadata-letter-spacing",
        },
      ] as const;
      for (const group of textGroups) {
        const name = group.name;
        expect(themeInline, `缺少 --text-${name} 主尺寸映射`).toMatch(
          new RegExp(`--text-${name}:\\s*var\\(--text-${name}-size\\)`),
        );
        expect(themeInline, `缺少 --text-${name}--line-height`).toMatch(
          new RegExp(
            `--text-${name}--line-height:\\s*var\\(--text-${name}-line-height\\)`,
          ),
        );
        expect(themeInline, `缺少 --text-${name}--letter-spacing`).toMatch(
          new RegExp(
            `--text-${name}--letter-spacing:\\s*var\\(--${group.letterSpacingVar}\\)`,
          ),
        );
        expect(themeInline, `缺少 --text-${name}--font-weight`).toMatch(
          new RegExp(
            `--text-${name}--font-weight:\\s*var\\(--text-${name}-weight\\)`,
          ),
        );
      }
    });

    it("字重使用 Tailwind v4 --font-weight-* namespace", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).toMatch(
        /--font-weight-light:\s*var\(--weight-light\)/,
      );
      expect(themeInline).toMatch(
        /--font-weight-normal:\s*var\(--weight-normal\)/,
      );
      expect(themeInline).toMatch(
        /--font-weight-medium:\s*var\(--weight-medium\)/,
      );
      expect(themeInline).toMatch(
        /--font-weight-semibold:\s*var\(--weight-semibold\)/,
      );
    });

    it("字间距使用 --tracking-* namespace 并引用内部 token", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).toMatch(
        /--tracking-tight:\s*var\(--tracking-tight\)/,
      );
      expect(themeInline).toMatch(
        /--tracking-normal:\s*var\(--tracking-normal\)/,
      );
      expect(themeInline).toMatch(/--tracking-wide:\s*var\(--tracking-wide\)/);
      expect(themeInline).toMatch(
        /--tracking-wider:\s*var\(--tracking-wider\)/,
      );
    });

    it("行高使用 --leading-* namespace 并引用内部 token", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).toMatch(/--leading-tight:\s*var\(--leading-tight\)/);
      expect(themeInline).toMatch(
        /--leading-normal:\s*var\(--leading-normal\)/,
      );
      expect(themeInline).toMatch(
        /--leading-relaxed:\s*var\(--leading-relaxed\)/,
      );
    });

    it("@theme inline 中不包含内部命名 --text-*-size / --weight-* / --text-*-weight", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      // 确保没有把内部 token 名直接当 @theme 变量名
      expect(themeInline).not.toMatch(/^\s*--text-\w+-size:/m);
      expect(themeInline).not.toMatch(/^\s*--text-\w+-weight:/m);
      expect(themeInline).not.toMatch(/^\s*--weight-\w+:/m);
    });
  });

  describe("renderer/src/styles/tokens.css 同步一致性", () => {
    const syncedTokens = [
      "--text-display-size",
      "--text-display-weight",
      "--text-display-line-height",
      "--text-display-letter-spacing",
      "--text-heading-size",
      "--text-heading-weight",
      "--text-heading-line-height",
      "--text-heading-letter-spacing",
      "--text-nav-size",
      "--text-nav-weight",
      "--text-nav-line-height",
      "--text-nav-letter-spacing",
      "--text-metadata-size",
      "--text-metadata-weight",
      "--text-metadata-line-height",
      "--text-metadata-letter-spacing",
      "--weight-light",
      "--weight-normal",
      "--weight-medium",
      "--weight-semibold",
      "--tracking-tight",
      "--tracking-normal",
      "--tracking-wide",
      "--tracking-wider",
      "--leading-tight",
      "--leading-normal",
      "--leading-relaxed",
      "--space-panel-padding",
      "--space-section-gap",
      "--space-item-gap",
      "--space-inline-gap",
    ] as const;

    it("renderer tokens.css 包含所有新增 token", () => {
      for (const token of syncedTokens) {
        expect(rendererTokens, `renderer tokens.css 缺少 ${token}`).toContain(
          token,
        );
      }
    });

    it("design 与 renderer 的 token 值一致", () => {
      for (const token of syncedTokens) {
        const designMatch = designTokens.match(
          new RegExp(
            `${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+);`,
          ),
        );
        const rendererMatch = rendererTokens.match(
          new RegExp(
            `${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+);`,
          ),
        );

        expect(
          designMatch,
          `design 01-tokens.css 缺少 ${token}`,
        ).not.toBeNull();
        expect(
          rendererMatch,
          `renderer tokens.css 缺少 ${token}`,
        ).not.toBeNull();
        expect(rendererMatch![1].trim(), `${token} 值不一致`).toBe(
          designMatch![1].trim(),
        );
      }
    });
  });

  describe("heading/page-title 别名 guard", () => {
    const aliasPairs = ["size", "weight", "line-height", "letter-spacing"];

    it("design token 中 heading 与 page-title 保持同值", () => {
      for (const prop of aliasPairs) {
        const heading = extractTokenValue(
          designTokens,
          `--text-heading-${prop}`,
        );
        const pageTitle = extractTokenValue(
          designTokens,
          `--text-page-title-${prop}`,
        );
        expect(
          heading,
          `design token drift: --text-heading-${prop} 应与 --text-page-title-${prop} 同值`,
        ).toBe(pageTitle);
      }
    });

    it("renderer token 中 heading 与 page-title 保持同值", () => {
      for (const prop of aliasPairs) {
        const heading = extractTokenValue(
          rendererTokens,
          `--text-heading-${prop}`,
        );
        const pageTitle = extractTokenValue(
          rendererTokens,
          `--text-page-title-${prop}`,
        );
        expect(
          heading,
          `renderer token drift: --text-heading-${prop} 应与 --text-page-title-${prop} 同值`,
        ).toBe(pageTitle);
      }
    });
  });
});
