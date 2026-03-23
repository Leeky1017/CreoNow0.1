import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/* ----------------------------------------------------------------
 * Helpers — parse CSS custom properties and compute WCAG contrast
 * ---------------------------------------------------------------- */

/** Extract all `--<name>: <value>;` declarations from a CSS block. */
function extractCustomProperties(css: string): Map<string, string[]> {
  const props = new Map<string, string[]>();
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const key = `--${m[1]}`;
    const val = m[2].trim();
    const existing = props.get(key) ?? [];
    existing.push(val);
    props.set(key, existing);
  }
  return props;
}

/** Parse `hsl(H S% L%)` and return the lightness percentage. */
function hslLightness(value: string): number | null {
  const m = value.match(/hsl\(\s*\d+\s+\d+%\s+(\d+)%\s*\)/);
  return m ? Number(m[1]) : null;
}

/** sRGB channel (0-1) → linear. */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance for an achromatic gray given lightness percentage. */
function grayLuminance(lightnessPct: number): number {
  const v = (lightnessPct / 100) * 255;
  const lin = srgbToLinear(v / 255);
  return 0.2126 * lin + 0.7152 * lin + 0.0722 * lin;
}

/** WCAG 2.x contrast ratio between two luminance values. */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Extract a themed block (`:root[data-theme="<theme>"]`) from CSS. */
function extractThemeBlock(css: string, theme: string): string {
  const selector = `:root[data-theme="${theme}"]`;
  let depth = 0;
  let start = -1;
  const idx = css.indexOf(selector);
  if (idx === -1) return "";
  for (let i = idx; i < css.length; i++) {
    if (css[i] === "{") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, i);
    }
  }
  return "";
}

/** Check if a media query block with both dark and light theme selectors exists. */
function hasThemedHighContrastBlock(css: string): {
  dark: boolean;
  light: boolean;
} {
  const mediaRe = /@media\s*\(prefers-contrast:\s*more\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = mediaRe.exec(css)) !== null) {
    let depth = 1;
    let i = m.index + m[0].length;
    let blockContent = "";
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      if (depth > 0) blockContent += css[i];
      i++;
    }
    return {
      dark: blockContent.includes('data-theme="dark"'),
      light: blockContent.includes('data-theme="light"'),
    };
  }
  return { dark: false, light: false };
}

/* ----------------------------------------------------------------
 * Load both CSS files
 * ---------------------------------------------------------------- */
const designPath = path.resolve(
  __dirname,
  "../../../../../design/system/01-tokens.css",
);
const runtimePath = path.resolve(__dirname, "../styles/tokens.css");

const designCss = fs.readFileSync(designPath, "utf-8");
const runtimeCss = fs.readFileSync(runtimePath, "utf-8");

/* ----------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------- */
describe("V1-23 Color System Guard", () => {
  describe("gray scale tokens (gray-1 through gray-10)", () => {
    it("should define all 10 gray steps in both design source and runtime for dark theme", () => {
      const designDark = extractCustomProperties(
        extractThemeBlock(designCss, "dark"),
      );
      const runtimeDark = extractCustomProperties(
        extractThemeBlock(runtimeCss, "dark"),
      );

      for (let i = 1; i <= 10; i++) {
        const key = `--gray-${i}`;
        expect(designDark.has(key)).toBe(true);
        expect(runtimeDark.has(key)).toBe(true);
      }
    });

    it("should define all 10 gray steps in both design source and runtime for light theme", () => {
      const designLight = extractCustomProperties(
        extractThemeBlock(designCss, "light"),
      );
      const runtimeLight = extractCustomProperties(
        extractThemeBlock(runtimeCss, "light"),
      );

      for (let i = 1; i <= 10; i++) {
        const key = `--gray-${i}`;
        expect(designLight.has(key)).toBe(true);
        expect(runtimeLight.has(key)).toBe(true);
      }
    });

    it("should use HSL format for gray scale values in both files", () => {
      for (const [label, css] of [
        ["design", designCss],
        ["runtime", runtimeCss],
      ] as const) {
        const darkBlock = extractThemeBlock(css, "dark");
        const darkProps = extractCustomProperties(darkBlock);
        for (let i = 1; i <= 10; i++) {
          const vals = darkProps.get(`--gray-${i}`);
          expect(
            vals?.some((v) => /^hsl\(/.test(v)),
            `${label} dark --gray-${i} should use HSL format`,
          ).toBe(true);
        }
      }
    });
  });

  describe("semantic token sync between design source and runtime", () => {
    const semanticBgTokens = [
      "--color-bg-base",
      "--color-bg-surface",
      "--color-bg-raised",
      "--color-bg-hover",
      "--color-bg-active",
      "--color-bg-selected",
    ];

    it("should reference var(--gray-*) in bg semantic tokens for both themes", () => {
      for (const theme of ["dark", "light"] as const) {
        const runtimeBlock = extractThemeBlock(runtimeCss, theme);
        const runtimeProps = extractCustomProperties(runtimeBlock);

        for (const token of semanticBgTokens) {
          const vals = runtimeProps.get(token);
          expect(
            vals?.some((v) => v.startsWith("var(--gray-")),
            `runtime ${theme} ${token} should use var(--gray-*) reference`,
          ).toBe(true);
        }
      }
    });

    const semanticBorderTokens = [
      "--color-border-default",
      "--color-border-hover",
      "--color-border-focus",
    ];

    it("should reference var(--gray-*) in border semantic tokens for both themes", () => {
      for (const theme of ["dark", "light"] as const) {
        const runtimeBlock = extractThemeBlock(runtimeCss, theme);
        const runtimeProps = extractCustomProperties(runtimeBlock);

        for (const token of semanticBorderTokens) {
          const vals = runtimeProps.get(token);
          expect(
            vals?.some((v) => v.startsWith("var(--gray-")),
            `runtime ${theme} ${token} should use var(--gray-*) reference`,
          ).toBe(true);
        }
      }
    });
  });

  describe("WCAG AA contrast for --color-fg-subtle (≥ 4.5:1)", () => {
    it("should meet AA contrast in dark theme (fg-subtle vs bg-base background)", () => {
      const darkBlock = extractThemeBlock(runtimeCss, "dark");
      const props = extractCustomProperties(darkBlock);

      const subtleVals = props.get("--color-fg-subtle");
      expect(subtleVals).toBeDefined();
      const subtleHsl = subtleVals!.map(hslLightness).find((v) => v !== null);
      expect(subtleHsl).toBeDefined();

      const darkBgLightness = 3; // dark gray-1 = hsl(0 0% 3%)
      const fgLum = grayLuminance(subtleHsl!);
      const bgLum = grayLuminance(darkBgLightness);
      const ratio = contrastRatio(fgLum, bgLum);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("should meet AA contrast in light theme (fg-subtle vs bg-base background)", () => {
      const lightBlock = extractThemeBlock(runtimeCss, "light");
      const props = extractCustomProperties(lightBlock);

      const subtleVals = props.get("--color-fg-subtle");
      expect(subtleVals).toBeDefined();
      const subtleHsl = subtleVals!.map(hslLightness).find((v) => v !== null);
      expect(subtleHsl).toBeDefined();

      const lightBgLightness = 100; // light gray-1 = hsl(0 0% 100%)
      const fgLum = grayLuminance(subtleHsl!);
      const bgLum = grayLuminance(lightBgLightness);
      const ratio = contrastRatio(fgLum, bgLum);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe("high contrast media query (@media prefers-contrast: more)", () => {
    it("should have themed high contrast block in design source", () => {
      const result = hasThemedHighContrastBlock(designCss);
      expect(result.dark).toBe(true);
      expect(result.light).toBe(true);
    });

    it("should have themed high contrast block in runtime tokens", () => {
      const result = hasThemedHighContrastBlock(runtimeCss);
      expect(result.dark).toBe(true);
      expect(result.light).toBe(true);
    });
  });

  describe("functional color hover/active states", () => {
    it("should define hover and active states for all functional colors in both files", () => {
      const colors = ["error", "success", "warning", "info"];
      for (const [label, css] of [
        ["design", designCss],
        ["runtime", runtimeCss],
      ] as const) {
        const props = extractCustomProperties(css);
        for (const color of colors) {
          expect(
            props.has(`--color-${color}-hover`),
            `${label} should define --color-${color}-hover`,
          ).toBe(true);
          expect(
            props.has(`--color-${color}-active`),
            `${label} should define --color-${color}-active`,
          ).toBe(true);
        }
      }
    });
  });
});
