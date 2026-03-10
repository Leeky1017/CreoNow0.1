/**
 * Global Design Token compliance test.
 *
 * Scans all production .tsx files under features/ and components/ for
 * styling violations that bypass the Design Token system:
 *
 *   1. Tailwind built-in shadows (shadow-lg, shadow-xl, shadow-2xl)
 *      → must use a token-wrapped shadow utility
 *   2. Tailwind raw color utilities (bg-red-600, text-green-500, etc.)
 *      → must use semantic Token via var(--)
 *   3. Hardcoded hex (#xxx, #xxxxxx) or rgba() values in className / style
 *      → must use semantic color tokens
 *
 * Allowlisted files:
 *   - SettingsAppearancePage.tsx: theme preview swatches (intentional hex)
 *
 * Exclusions:
 *   - *.test.* / *.stories.* / *.story.* / test-utils.tsx
 *   - Comments (// or block)
 *   - Import / export / type statements
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_SRC = resolve(CURRENT_DIR, "..");

const SCAN_DIRS = [RENDERER_SRC];

const SKIP_FILE_PATTERNS = [
  /\.test\./,
  /\.stories\./,
  /\.story\./,
  /test-utils\.tsx$/,
];

const SKIP_DIR_NAMES = new Set([
  "__tests__",
  "test-utils",
  "styles",
  "i18n",
  "contexts",
  "hooks",
  "types",
]);

/**
 * Files where hardcoded hex/rgba are intentional (theme preview swatches).
 * Only exempts hardcoded-hex and hardcoded-rgba checks;
 * shadow and Tailwind raw color rules still apply.
 */
const HEX_RGBA_ALLOWLISTED_FILES = [
  /SettingsAppearancePage\.tsx$/,
];

// ─── Violation patterns ───

/**
 * Tailwind built-in shadow classes that bypass the Token shadow system.
 * Matches: shadow-lg, shadow-xl, shadow-2xl (and hover/focus variants)
 * Does NOT match: shadow-[var(--shadow-lg)] (token-wrapped)
 */
const BARE_SHADOW_REGEX =
  /(?<!\[var\(--shadow-)(?:^|[\s"'`])(?:!?(?:hover:|focus:|active:|group-hover:)*)(!?shadow-(?:lg|xl|2xl))\b(?!\])/;

/**
 * Tailwind raw color utilities (not wrapped in var(--)).
 * Matches: bg-red-600, text-green-500, border-gray-200, hover:bg-yellow-400
 * Does NOT match: token-wrapped bg/text utilities
 *
 * Excluded from detection:
 *   - bg-transparent, text-transparent
 *   - bg-current, text-current
 *   - bg-inherit, text-inherit
 */
const TAILWIND_COLOR_NAMES = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink",
  "rose", "slate", "gray", "zinc", "neutral", "stone",
];
const TAILWIND_RAW_COLOR_REGEX = new RegExp(
  `(?:^|[\\s"'\`])!?(?:hover:|focus:|active:|group-hover:)*!?(?:bg|text|border|ring|shadow|outline|decoration|from|to|via)-(?:${TAILWIND_COLOR_NAMES.join("|")})-\\d{2,3}(?:\\/\\d+)?\\b`,
);

/**
 * Bare white/black Tailwind utilities that should use semantic tokens.
 * Matches: text-white, bg-black, bg-white, text-black, border-white, border-black
 *          and their opacity variants (text-white/50, bg-black/60, etc.)
 * Does NOT match: var(--...) wrapped values.
 */
const BARE_WHITE_BLACK_REGEX =
  /(?:^|[\s"'`])!?(?:hover:|focus:|active:|group-hover:)*!?(?:bg|text|border)-(?:white|black)(?:\/\d+)?\b/;

/**
 * Hardcoded hex values in className or style context.
 * Matches: #fff, #ffffff, #cc2b3e, bg-[#121212], text-[#bfbfbf]
 * Does NOT match: hex values inside var() or CSS custom property definitions
 */
const HARDCODED_HEX_REGEX =
  /(?:^|[\s"'`=:,])#(?:[0-9a-fA-F]{3}){1,2}\b/;

/**
 * Hardcoded rgba() values in className or style context.
 * Matches: rgba(255,255,255,0.5), rgba(34, 197, 94, 0.4)
 * Does NOT match: rgba inside var() definitions
 */
const HARDCODED_RGBA_REGEX =
  /rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/;

// ─── Helpers ───

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        results.push(...collectTsxFiles(fullPath));
      } else if (
        entry.name.endsWith(".tsx") &&
        !SKIP_FILE_PATTERNS.some((p) => p.test(entry.name))
      ) {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist yet — fine
  }
  return results;
}

function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("*") || trimmed.startsWith("/*")) return false;
  if (/^\{\/\*.*\*\/\}$/.test(trimmed)) return false;
  if (trimmed.startsWith("import ") || trimmed.startsWith("export type")) return false;
  return true;
}

function isHexRgbaAllowlisted(filePath: string): boolean {
  return HEX_RGBA_ALLOWLISTED_FILES.some((p) => p.test(filePath));
}

type ViolationType = "bare-shadow" | "raw-tailwind-color" | "bare-white-black" | "hardcoded-hex" | "hardcoded-rgba";
interface Violation {
  type: ViolationType;
  line: number;
  text: string;
}
interface FileViolations {
  file: string;
  violations: Violation[];
}

function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isCodeLine(line)) continue;

    // 1. Bare shadows
    if (BARE_SHADOW_REGEX.test(line)) {
      violations.push({ type: "bare-shadow", line: i + 1, text: line.trim() });
    }

    // 2. Raw Tailwind color utilities
    if (TAILWIND_RAW_COLOR_REGEX.test(line)) {
      violations.push({ type: "raw-tailwind-color", line: i + 1, text: line.trim() });
    }

    // 3. Bare white/black
    if (BARE_WHITE_BLACK_REGEX.test(line)) {
      violations.push({ type: "bare-white-black", line: i + 1, text: line.trim() });
    }

    // 4-5. Hardcoded hex/rgba — only in className or style contexts
    const hasStyleContext =
      line.includes("className") ||
      line.includes("style") ||
      line.includes("class=") ||
      /["'`].*#[0-9a-fA-F]/.test(line) ||
      /["'`].*rgba?\(/.test(line) ||
      /shadow-\[/.test(line);

    if (hasStyleContext) {
      if (HARDCODED_HEX_REGEX.test(line)) {
        // exclude CSS variable references like var(--color-xxx)
        const withoutVars = line.replace(/var\(--[^)]+\)/g, "");
        if (HARDCODED_HEX_REGEX.test(withoutVars)) {
          violations.push({ type: "hardcoded-hex", line: i + 1, text: line.trim() });
        }
      }
      if (HARDCODED_RGBA_REGEX.test(line)) {
        const withoutVars = line.replace(/var\(--[^)]+\)/g, "");
        if (HARDCODED_RGBA_REGEX.test(withoutVars)) {
          violations.push({ type: "hardcoded-rgba", line: i + 1, text: line.trim() });
        }
      }
    }
  }

  return violations;
}

// ─── Tests ───

describe("Token global compliance: no style bypass in production files", () => {
  const allFiles = SCAN_DIRS.flatMap((d) => collectTsxFiles(d));

  it("should find production .tsx files to scan", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  // Collect violations across all non-allowlisted files
  const allViolations: FileViolations[] = [];

  for (const filePath of allFiles) {
    const violations = scanFile(filePath).filter((v) => {
      if (isHexRgbaAllowlisted(filePath)) {
        return v.type !== "hardcoded-hex" && v.type !== "hardcoded-rgba";
      }
      return true;
    });
    if (violations.length > 0) {
      allViolations.push({
        file: relative(RENDERER_SRC, filePath),
        violations,
      });
    }
  }

  it("no production files should use bare Tailwind shadow classes (shadow-lg/xl/2xl)", () => {
    const shadowViolations = allViolations
      .map((f) => ({
        file: f.file,
        violations: f.violations.filter((v) => v.type === "bare-shadow"),
      }))
      .filter((f) => f.violations.length > 0);

    if (shadowViolations.length > 0) {
      const report = shadowViolations
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.violations.map((l) => `    L${l.line}: ${l.text}`).join("\n")}`,
        )
        .join("");
      expect.fail(
        `Found ${shadowViolations.reduce((n, v) => n + v.violations.length, 0)} bare shadow violation(s) in ${shadowViolations.length} file(s).\n` +
          `Use shadow-[var(--shadow-lg)] instead of shadow-lg.\n${report}`,
      );
    }
  });

  it("no production files should use Tailwind raw color utilities (bg-red-600, etc.)", () => {
    const colorViolations = allViolations
      .map((f) => ({
        file: f.file,
        violations: f.violations.filter((v) => v.type === "raw-tailwind-color"),
      }))
      .filter((f) => f.violations.length > 0);

    if (colorViolations.length > 0) {
      const report = colorViolations
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.violations.map((l) => `    L${l.line}: ${l.text}`).join("\n")}`,
        )
        .join("");
      expect.fail(
        `Found ${colorViolations.reduce((n, v) => n + v.violations.length, 0)} raw Tailwind color violation(s) in ${colorViolations.length} file(s).\n` +
          `Use token-wrapped background/text utilities instead of raw palette classes.\n${report}`,
      );
    }
  });

  it("no production files should use bare text-white/bg-black utilities", () => {
    const wbViolations = allViolations
      .map((f) => ({
        file: f.file,
        violations: f.violations.filter((v) => v.type === "bare-white-black"),
      }))
      .filter((f) => f.violations.length > 0);

    if (wbViolations.length > 0) {
      const report = wbViolations
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.violations.map((l) => `    L${l.line}: ${l.text}`).join("\n")}`,
        )
        .join("");
      expect.fail(
        `Found ${wbViolations.reduce((n, v) => n + v.violations.length, 0)} bare white/black violation(s) in ${wbViolations.length} file(s).\n` +
          `Use text-[var(--color-fg-on-accent)] or bg-[var(--color-scrim)] instead.\n${report}`,
      );
    }
  });

  it("no production files should use hardcoded hex colors in className/style", () => {
    const hexViolations = allViolations
      .map((f) => ({
        file: f.file,
        violations: f.violations.filter((v) => v.type === "hardcoded-hex"),
      }))
      .filter((f) => f.violations.length > 0);

    if (hexViolations.length > 0) {
      const report = hexViolations
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.violations.map((l) => `    L${l.line}: ${l.text}`).join("\n")}`,
        )
        .join("");
      expect.fail(
        `Found ${hexViolations.reduce((n, v) => n + v.violations.length, 0)} hardcoded hex violation(s) in ${hexViolations.length} file(s).\n` +
          `Use semantic color tokens instead of #hex values.\n${report}`,
      );
    }
  });

  it("no production files should use hardcoded rgba() in className/style", () => {
    const rgbaViolations = allViolations
      .map((f) => ({
        file: f.file,
        violations: f.violations.filter((v) => v.type === "hardcoded-rgba"),
      }))
      .filter((f) => f.violations.length > 0);

    if (rgbaViolations.length > 0) {
      const report = rgbaViolations
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.violations.map((l) => `    L${l.line}: ${l.text}`).join("\n")}`,
        )
        .join("");
      expect.fail(
        `Found ${rgbaViolations.reduce((n, v) => n + v.violations.length, 0)} hardcoded rgba() violation(s) in ${rgbaViolations.length} file(s).\n` +
          `Use semantic color tokens instead of rgba() values.\n${report}`,
      );
    }
  });
});
