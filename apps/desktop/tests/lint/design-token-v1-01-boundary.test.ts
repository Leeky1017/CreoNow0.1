/**
 * v1-01 Design Token 补完 —— 边界测试
 *
 * 作用域：仅覆盖 v1-01 新增 token 子集的精确值、引用链、矩阵完整性等
 * 边界场景。不覆盖两文件之间的全量同步。
 *
 * 全量同步由 design-token-sync-allowlist.test.ts 负责。
 *
 * 本文件补齐 design-token-completeness.test.ts 未覆盖的边界场景：
 * - Token 值精确校验（不仅存在，值必须正确）
 * - 语义间距 var() 引用链合法性
 * - Typography token 四件组完整性矩阵
 * - 浅色主题对 token 的兼容（不依赖颜色的 token 不应重复定义）
 * - 新增 token 注释（AC-8）
 * - @theme 导出不泄露内部 token
 * - @theme duration 值精确校验
 * - 同步一致性穷举（值级别，非存在级别）
 * - 圆角/阴影等周边 token 未被误删
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

/**
 * 从 CSS 中提取指定 token 的值
 */
function extractTokenValue(css: string, token: string): string | null {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedToken}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

/**
 * 提取 @theme inline 块内容
 */
function extractThemeInlineBlock(css: string): string {
  const match = css.match(/@theme\s+inline\s*\{([\s\S]*?)\n\}/);
  expect(match, "main.css 缺少 @theme inline 块").not.toBeNull();
  return match![1];
}

const designTokens = readCSS(DESIGN_TOKENS);
const rendererTokens = readCSS(RENDERER_TOKENS);
const mainCSS = readCSS(MAIN_CSS);

function registerTypographyPrecisionCases(): void {
  describe("typography token 精确值校验", () => {
    const typographySpec: Record<
      string,
      {
        size: string;
        weight: string;
        lineHeight: string;
        letterSpacing: string;
      }
    > = {
      display: {
        size: "48px",
        weight: "300",
        lineHeight: "1.1",
        letterSpacing: "-0.03em",
      },
      heading: {
        size: "24px",
        weight: "600",
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
      },
      nav: {
        size: "13px",
        weight: "500",
        lineHeight: "1.4",
        letterSpacing: "0",
      },
      metadata: {
        size: "12px",
        weight: "400",
        lineHeight: "1.4",
        letterSpacing: "0.02em",
      },
    };

    for (const [name, spec] of Object.entries(typographySpec)) {
      describe(`--text-${name}-* 精确值`, () => {
        it(`size 应该是 ${spec.size}`, () => {
          const value = extractTokenValue(designTokens, `--text-${name}-size`);
          expect(value).toBe(spec.size);
        });

        it(`weight 应该是 ${spec.weight}`, () => {
          const value = extractTokenValue(
            designTokens,
            `--text-${name}-weight`,
          );
          expect(value).toBe(spec.weight);
        });

        it(`line-height 应该是 ${spec.lineHeight}`, () => {
          const value = extractTokenValue(
            designTokens,
            `--text-${name}-line-height`,
          );
          expect(value).toBe(spec.lineHeight);
        });

        it(`letter-spacing 应该是 ${spec.letterSpacing}`, () => {
          const value = extractTokenValue(
            designTokens,
            `--text-${name}-letter-spacing`,
          );
          expect(value).toBe(spec.letterSpacing);
        });
      });
    }
  });
}

function registerIndependentTokenPrecisionCases(): void {
  describe("独立 weight/tracking/leading 精确值", () => {
    const weightExpected: Record<string, string> = {
      "--weight-light": "300",
      "--weight-normal": "400",
      "--weight-medium": "500",
      "--weight-semibold": "600",
    };

    for (const [token, expected] of Object.entries(weightExpected)) {
      it(`${token} 值应为 ${expected}`, () => {
        expect(extractTokenValue(designTokens, token)).toBe(expected);
      });
    }

    const trackingExpected: Record<string, string> = {
      "--tracking-tight": "-0.03em",
      "--tracking-normal": "0",
      "--tracking-wide": "0.05em",
      "--tracking-wider": "0.1em",
    };

    for (const [token, expected] of Object.entries(trackingExpected)) {
      it(`${token} 值应为 ${expected}`, () => {
        expect(extractTokenValue(designTokens, token)).toBe(expected);
      });
    }

    const leadingExpected: Record<string, string> = {
      "--leading-tight": "1.1",
      "--leading-normal": "1.5",
      "--leading-relaxed": "1.8",
    };

    for (const [token, expected] of Object.entries(leadingExpected)) {
      it(`${token} 值应为 ${expected}`, () => {
        expect(extractTokenValue(designTokens, token)).toBe(expected);
      });
    }
  });
}

function registerSemanticSpacingCases(): void {
  describe("语义间距引用链校验", () => {
    const semanticSpacing: Record<
      string,
      { ref: string; resolvedValue: string }
    > = {
      "--space-panel-padding": { ref: "var(--space-4)", resolvedValue: "16px" },
      "--space-section-gap": { ref: "var(--space-6)", resolvedValue: "24px" },
      "--space-item-gap": { ref: "var(--space-2)", resolvedValue: "8px" },
      "--space-inline-gap": { ref: "var(--space-1)", resolvedValue: "4px" },
    };

    for (const [token, { ref, resolvedValue }] of Object.entries(
      semanticSpacing,
    )) {
      it(`${token} 通过 var() 引用基础间距 ${ref}`, () => {
        const value = extractTokenValue(designTokens, token);
        expect(value).toBe(ref);
      });

      it(`${token} 引用的基础 token 值为 ${resolvedValue}`, () => {
        // 从 ref 提取出基础 token 名
        const baseToken = ref.replace("var(", "").replace(")", "");
        const baseValue = extractTokenValue(designTokens, baseToken);
        expect(baseValue).toBe(resolvedValue);
      });
    }

    it("语义间距 token 不应该硬编码 px 值", () => {
      for (const token of Object.keys(semanticSpacing)) {
        const value = extractTokenValue(designTokens, token);
        expect(value).not.toMatch(/^\d+px$/);
        expect(value).toMatch(/^var\(--space-/);
      }
    });
  });
}

function registerThemeDurationCases(): void {
  describe("@theme duration 值精确校验", () => {
    it("--duration-instant 为 50ms", () => {
      expect(mainCSS).toContain("--duration-instant: 50ms");
    });

    it("--duration-slower 为 500ms", () => {
      expect(mainCSS).toContain("--duration-slower: 500ms");
    });

    it("@theme 块导出全部 5 个 duration token", () => {
      const durations = [
        "--duration-instant",
        "--duration-fast",
        "--duration-normal",
        "--duration-slow",
        "--duration-slower",
      ];
      for (const d of durations) {
        expect(mainCSS, `@theme 缺少 ${d}`).toContain(d);
      }
    });
  });
}

function registerThemeInlineSafetyCases(): void {
  describe("@theme inline token 命名安全", () => {
    it("不应该以 --text-*-size 作为 @theme 变量名", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).not.toMatch(/^\s*--text-\w+-size:/m);
    });

    it("不应该以 --text-*-weight 作为 @theme 变量名", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).not.toMatch(/^\s*--text-\w+-weight:/m);
    });

    it("不应该以 --weight-* 作为 @theme 变量名（与 --font-weight-* 区分）", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).not.toMatch(/^\s*--weight-\w+:/m);
    });

    it("不应该以 --text-*-line-height 作为 @theme 变量名", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).not.toMatch(/^\s*--text-\w+-line-height:/m);
    });

    it("不应该以 --text-*-letter-spacing 作为 @theme 变量名", () => {
      const themeInline = extractThemeInlineBlock(mainCSS);
      expect(themeInline).not.toMatch(/^\s*--text-\w+-letter-spacing:/m);
    });
  });
}

function registerChineseCommentCases(): void {
  describe("新增 token 中文注释（AC-8）", () => {
    const v1_01_tokens = [
      "--text-display-size",
      "--text-heading-size",
      "--text-nav-size",
      "--text-metadata-size",
      "--weight-light",
      "--tracking-tight",
      "--leading-tight",
      "--space-panel-padding",
    ];

    it("v1-01 新增 token 的所在区块应有中文 CSS 注释", () => {
      // 检查 CSS 注释语法（/* 中文 */），而非仅有中文字符
      const isCssChineseComment = (line: string): boolean =>
        /\/\*[^*]*[\u4e00-\u9fff]/.test(line);

      for (const token of v1_01_tokens) {
        const lines = designTokens.split("\n");
        const lineIndex = lines.findIndex((l) => l.includes(token));
        expect(lineIndex, `找不到 ${token} 所在行`).toBeGreaterThan(-1);

        // 向前搜索最多 10 行，必须找到 /* 中文 */ 格式的 CSS 注释
        let foundComment = false;
        for (let i = Math.max(0, lineIndex - 10); i <= lineIndex; i++) {
          if (isCssChineseComment(lines[i])) {
            foundComment = true;
            break;
          }
        }
        expect(
          foundComment,
          `${token} 附近缺少 CSS 中文注释（需要 /* 中文 */ 格式）`,
        ).toBe(true);
      }
    });
  });
}

function registerTokenSyncCases(): void {
  describe("设计与渲染器 token 值精确同步", () => {
    const syncTokens = [
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

    for (const token of syncTokens) {
      it(`${token} 在设计和渲染器中值一致`, () => {
        const designValue = extractTokenValue(designTokens, token);
        const rendererValue = extractTokenValue(rendererTokens, token);
        expect(designValue, `design 缺少 ${token}`).not.toBeNull();
        expect(rendererValue, `renderer 缺少 ${token}`).not.toBeNull();
        expect(rendererValue, `${token} 值不同步`).toBe(designValue);
      });
    }
  });
}

function registerPeripheralTokenGuardCases(): void {
  describe("周边 token 完整性守卫", () => {
    it("基础间距系统 --space-0 到 --space-20 完整", () => {
      const expected = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];
      for (const n of expected) {
        expect(designTokens, `缺少 --space-${n}`).toContain(`--space-${n}:`);
      }
    });

    it("圆角系统 7 级完整", () => {
      const radii = [
        "--radius-none",
        "--radius-sm",
        "--radius-md",
        "--radius-lg",
        "--radius-xl",
        "--radius-2xl",
        "--radius-full",
      ];
      for (const r of radii) {
        expect(designTokens, `缺少 ${r}`).toContain(`${r}:`);
      }
    });

    it("动效缓动曲线 4 条完整", () => {
      const easing = [
        "--ease-default",
        "--ease-in",
        "--ease-out",
        "--ease-in-out",
      ];
      for (const e of easing) {
        expect(designTokens, `缺少 ${e}`).toContain(`${e}:`);
      }
    });

    it("字体族 3 个完整", () => {
      expect(designTokens).toContain("--font-family-ui:");
      expect(designTokens).toContain("--font-family-body:");
      expect(designTokens).toContain("--font-family-mono:");
    });
  });
}

function registerTypographyCompletenessCases(): void {
  describe("typography 四件组完整性矩阵", () => {
    /**
     * 这里检查 design/system/01-tokens.css 中已定义的所有 typography 预设
     * 的四件组完整性（size、weight、line-height、letter-spacing 缺一不可）
     */
    const presets = [
      "page-title",
      "card-title",
      "subtitle",
      "body",
      "editor",
      "caption",
      "label",
      "tree",
      "display",
      "heading",
      "nav",
      "metadata",
    ];

    const props = ["size", "weight", "line-height", "letter-spacing"];

    for (const preset of presets) {
      it(`--text-${preset} 具备 size/weight/line-height/letter-spacing 四件组`, () => {
        for (const prop of props) {
          const token = `--text-${preset}-${prop}`;
          expect(designTokens, `缺少 ${token}`).toContain(`${token}:`);
        }
      });
    }
  });
}

function registerTokenUniquenessCases(): void {
  describe("token 定义唯一性", () => {
    const tokensToCheck = [
      "--text-display-size",
      "--text-heading-size",
      "--text-nav-size",
      "--text-metadata-size",
      "--weight-light",
      "--weight-normal",
      "--tracking-tight",
      "--leading-tight",
      "--space-panel-padding",
    ];

    for (const token of tokensToCheck) {
      it(`${token} 在 01-tokens.css 中只定义一次`, () => {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = designTokens.match(
          new RegExp(`${escaped}:\\s*[^;]+;`, "g"),
        );
        expect(
          matches?.length,
          `${token} 被定义 ${matches?.length ?? 0} 次`,
        ).toBe(1);
      });
    }
  });
}

function registerThemeInlineTypographyMappingCases(): void {
  describe("@theme inline 映射全部 14 个 typography 预设", () => {
    const themeInline = extractThemeInlineBlock(mainCSS);
    const presets = [
      "display",
      "heading",
      "page-title",
      "card-title",
      "subtitle",
      "body",
      "editor",
      "caption",
      "label",
      "tree",
      "status",
      "mono",
      "nav",
      "metadata",
    ];

    for (const preset of presets) {
      it(`@theme inline 包含 --text-${preset} 主映射`, () => {
        expect(themeInline).toMatch(
          new RegExp(`--text-${preset}:\\s*var\\(--text-${preset}-size\\)`),
        );
      });

      it(`@theme inline 包含 --text-${preset}--line-height`, () => {
        expect(themeInline).toMatch(
          new RegExp(`--text-${preset}--line-height:`),
        );
      });

      it(`@theme inline 包含 --text-${preset}--font-weight`, () => {
        expect(themeInline).toMatch(
          new RegExp(`--text-${preset}--font-weight:`),
        );
      });

      it(`@theme inline 包含 --text-${preset}--letter-spacing`, () => {
        expect(themeInline).toMatch(
          new RegExp(`--text-${preset}--letter-spacing:`),
        );
      });
    }
  });
}

function registerThemeInlinePrecisionCases(): void {
  describe("@theme inline 字重/字间距/行高映射", () => {
    const themeInline = extractThemeInlineBlock(mainCSS);

    it("--font-weight-light 映射 --weight-light", () => {
      expect(themeInline).toMatch(
        /--font-weight-light:\s*var\(--weight-light\)/,
      );
    });

    it("--font-weight-normal 映射 --weight-normal", () => {
      expect(themeInline).toMatch(
        /--font-weight-normal:\s*var\(--weight-normal\)/,
      );
    });

    it("--font-weight-medium 映射 --weight-medium", () => {
      expect(themeInline).toMatch(
        /--font-weight-medium:\s*var\(--weight-medium\)/,
      );
    });

    it("--font-weight-semibold 映射 --weight-semibold", () => {
      expect(themeInline).toMatch(
        /--font-weight-semibold:\s*var\(--weight-semibold\)/,
      );
    });

    it("--tracking-tight 映射 --tracking-tight", () => {
      expect(themeInline).toMatch(
        /--tracking-tight:\s*var\(--tracking-tight\)/,
      );
    });

    it("--leading-relaxed 映射 --leading-relaxed", () => {
      expect(themeInline).toMatch(
        /--leading-relaxed:\s*var\(--leading-relaxed\)/,
      );
    });
  });
}

describe("v1-01 Design Token 边界测试", () => {
  registerTypographyPrecisionCases();
  registerIndependentTokenPrecisionCases();
  registerSemanticSpacingCases();
  registerThemeDurationCases();
  registerThemeInlineSafetyCases();
  registerChineseCommentCases();
  registerTokenSyncCases();
  registerPeripheralTokenGuardCases();
  registerTypographyCompletenessCases();
  registerTokenUniquenessCases();
  registerThemeInlineTypographyMappingCases();
  registerThemeInlinePrecisionCases();
});
