/**
 * v1-17 字体本地打包与视觉回归 —— 守卫测试
 *
 * AC-1: ≥12 个 woff2 文件，总大小 ≤ 500KB
 * AC-2: ≥12 条 @font-face 声明，每条含 font-display: swap
 * AC-3: fonts.css / main.css / tokens.css 三处 font-family 一致
 * AC-5: design/system/01-tokens.css 含 --shadow-xs 和 --shadow-2xl
 * AC-6: 无 shadow-[var(--shadow-2xl)] arbitrary 值残留
 * AC-7: tokens.css 和 main.css @theme 导出 --shadow-xs / --shadow-2xl
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FONTS_DIR = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/assets/fonts",
);
const FONTS_CSS = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/fonts.css",
);
const MAIN_CSS = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/main.css",
);
const RENDERER_TOKENS = path.join(
  REPO_ROOT,
  "apps/desktop/renderer/src/styles/tokens.css",
);
const DESIGN_TOKENS = path.join(REPO_ROOT, "design/system/01-tokens.css");

function readCSS(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function listWoff2Files(): string[] {
  if (!existsSync(FONTS_DIR)) return [];
  return readdirSync(FONTS_DIR).filter((f) => f.endsWith(".woff2"));
}

/* ──────────────────────────────────────────────
   Task 1.1 — woff2 字体文件存在性 (AC-1)
   ────────────────────────────────────────────── */
describe("AC-1: woff2 font bundling", () => {
  const woff2Files = listWoff2Files();

  it("fonts/ 目录至少包含 12 个 woff2 文件", () => {
    expect(woff2Files.length).toBeGreaterThanOrEqual(12);
  });

  it("woff2 文件总大小 ≤ 500KB", () => {
    const totalBytes = woff2Files.reduce((sum, f) => {
      return sum + statSync(path.join(FONTS_DIR, f)).size;
    }, 0);
    expect(totalBytes).toBeLessThanOrEqual(512_000);
  });

  const expectedFonts = [
    "Inter-Light.woff2",
    "Inter-Regular.woff2",
    "Inter-Medium.woff2",
    "Inter-SemiBold.woff2",
    "Lora-Regular.woff2",
    "Lora-Medium.woff2",
    "Lora-SemiBold.woff2",
    "Lora-Bold.woff2",
    "Lora-Italic.woff2",
    "Lora-MediumItalic.woff2",
    "Lora-SemiBoldItalic.woff2",
    "Lora-BoldItalic.woff2",
    "JetBrainsMono-Regular.woff2",
    "JetBrainsMono-Medium.woff2",
  ];

  it.each(expectedFonts)("%s 存在", (font) => {
    expect(woff2Files).toContain(font);
  });
});

/* ──────────────────────────────────────────────
   Task 1.2 — @font-face 声明 (AC-2, AC-3)
   ────────────────────────────────────────────── */
describe("AC-2: @font-face declarations", () => {
  const fontsCss = readCSS(FONTS_CSS);
  const fontFaceBlocks = fontsCss.match(/@font-face\s*\{[^}]+\}/g) ?? [];

  it("fonts.css 含 ≥12 条 @font-face 声明", () => {
    expect(fontFaceBlocks.length).toBeGreaterThanOrEqual(12);
  });

  it("每条 @font-face 含 font-display: swap", () => {
    for (const block of fontFaceBlocks) {
      expect(block).toMatch(/font-display:\s*swap/);
    }
  });
});

describe("AC-3: font-family 三处一致", () => {
  const fontsCss = readCSS(FONTS_CSS);
  const mainCss = readCSS(MAIN_CSS);
  const tokensCss = readCSS(RENDERER_TOKENS);

  const families = ["--font-family-ui", "--font-family-body", "--font-family-mono"] as const;

  for (const varName of families) {
    it(`${varName} 在 fonts.css / main.css / tokens.css 值一致`, () => {
      const extract = (css: string): string => {
        // Match the variable declaration, handling multi-line values
        const regex = new RegExp(
          `${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+);`,
        );
        const m = css.match(regex);
        expect(m).not.toBeNull();
        // Normalize whitespace for comparison
        return m![1].replace(/\s+/g, " ").trim();
      };

      const fromFonts = extract(fontsCss);
      const fromMain = extract(mainCss);
      const fromTokens = extract(tokensCss);

      expect(fromFonts).toEqual(fromMain);
      expect(fromFonts).toEqual(fromTokens);
    });
  }
});

/* ──────────────────────────────────────────────
   Task 1.3 — Shadow Token xs/2xl (AC-5, AC-7)
   ────────────────────────────────────────────── */
describe("AC-5: shadow-xs / shadow-2xl in design tokens", () => {
  const designCss = readCSS(DESIGN_TOKENS);

  it("01-tokens.css 含 --shadow-xs", () => {
    expect(designCss).toMatch(/--shadow-xs:\s*[^;]+;/);
  });

  it("01-tokens.css 含 --shadow-2xl", () => {
    expect(designCss).toMatch(/--shadow-2xl:\s*[^;]+;/);
  });
});

describe("AC-7: shadow tokens synced in renderer", () => {
  const tokensCss = readCSS(RENDERER_TOKENS);
  const mainCss = readCSS(MAIN_CSS);

  it("tokens.css 含 --shadow-xs", () => {
    expect(tokensCss).toMatch(/--shadow-xs:\s*[^;]+;/);
  });

  it("tokens.css 含 --shadow-2xl", () => {
    expect(tokensCss).toMatch(/--shadow-2xl:\s*[^;]+;/);
  });

  it("main.css @theme 导出 --shadow-xs", () => {
    // Extract @theme block (first one, non-inline)
    const themeBlock = mainCss.match(/@theme\s*\{([^}]+)\}/);
    expect(themeBlock).not.toBeNull();
    expect(themeBlock![1]).toMatch(/--shadow-xs:/);
  });

  it("main.css @theme 导出 --shadow-2xl", () => {
    const themeBlock = mainCss.match(/@theme\s*\{([^}]+)\}/);
    expect(themeBlock).not.toBeNull();
    expect(themeBlock![1]).toMatch(/--shadow-2xl:/);
  });
});

/* ──────────────────────────────────────────────
   Task 1.4 — shadow arbitrary 值清零 (AC-6)
   ────────────────────────────────────────────── */
describe("AC-6: no shadow-[var(--shadow-2xl)] arbitrary values", () => {
  it("renderer/src/ 下无 shadow-[var(--shadow-2xl)] 残留", () => {
    const srcDir = path.join(REPO_ROOT, "apps/desktop/renderer/src");
    const hits = findPattern(srcDir, /shadow-\[var\(--shadow-2xl\)\]/);
    expect(hits).toEqual([]);
  });
});

/** 递归扫描目录中匹配正则的 .tsx 文件，返回 file:line 列表 */
function findPattern(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        walk(full);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        const lines = readFileSync(full, "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            results.push(`${full}:${i + 1}`);
          }
        }
      }
    }
  };
  walk(dir);
  return results;
}
