/**
 * Global i18n compliance test.
 *
 * Scans all production .tsx files under features/ and components/ for
 * hardcoded CJK characters that should have been extracted to locale keys.
 *
 * Exclusions:
 *  - *.test.* / *.stories.* / *.story.* files
 *  - test-utils.tsx
 *  - Comment lines (// or block comments)
 *  - console.log / console.warn / console.error statements
 *  - Import/export statements
 *  - Type annotations and interfaces
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_SRC = resolve(CURRENT_DIR, "..");

const SCAN_DIRS = [
  join(RENDERER_SRC, "features"),
  join(RENDERER_SRC, "components"),
];

/** CJK Unified Ideographs + common CJK punctuation */
const CJK_REGEX =
  /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff01-\uff5e]/;

const SKIP_PATTERNS = [
  /\.test\./,
  /\.stories\./,
  /\.story\./,
  /test-utils\.tsx$/,
];

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(fullPath));
    } else if (
      entry.name.endsWith(".tsx") &&
      !SKIP_PATTERNS.some((p) => p.test(entry.name))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Checks if a line is likely source code containing user-facing text
 * (not a comment, import, type annotation, or debug statement).
 */
function isUserFacingLine(line: string): boolean {
  const trimmed = line.trim();
  // Skip comments (single-line, block, JSDoc)
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return false;
  // Skip JSX comments: {/* ... */}
  if (/^\{\/\*.*\*\/\}$/.test(trimmed)) return false;
  // Skip imports/exports
  if (trimmed.startsWith("import ") || trimmed.startsWith("export type")) return false;
  // Skip console statements
  if (/console\.(log|warn|error|debug|info)\(/.test(trimmed)) return false;
  // Skip regex patterns (data matching, not UI text)
  if (/\/.*[\u4e00-\u9fff].*\//.test(trimmed) && trimmed.includes(".test(")) return false;
  // Skip AI prompt templates (sent to LLM, not displayed as UI)
  if (trimmed.includes("promptTemplate") && trimmed.includes("`")) return false;
  // Skip keyword matching patterns (e.g. checking if input contains a specific word)
  if (trimmed.includes(".includes(\"") && trimmed.includes("?")) return false;
  return true;
}

describe("i18n global compliance: no hardcoded CJK in production files", () => {
  const allFiles = SCAN_DIRS.flatMap((dir) => {
    try {
      return collectTsxFiles(dir);
    } catch {
      return [];
    }
  });

  it("should find production .tsx files to scan", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  const violatingFiles: Array<{ file: string; lines: Array<{ num: number; text: string }> }> = [];

  for (const filePath of allFiles) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const violations: Array<{ num: number; text: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (CJK_REGEX.test(line) && isUserFacingLine(line)) {
        violations.push({ num: i + 1, text: line.trim() });
      }
    }

    if (violations.length > 0) {
      violatingFiles.push({
        file: relative(RENDERER_SRC, filePath),
        lines: violations,
      });
    }
  }

  it("no production .tsx files should contain hardcoded CJK characters", () => {
    if (violatingFiles.length > 0) {
      const report = violatingFiles
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.lines.map((l) => `    L${l.num}: ${l.text}`).join("\n")}`,
        )
        .join("\n");
      expect.fail(
        `Found ${violatingFiles.length} file(s) with hardcoded CJK characters:\n${report}`,
      );
    }
  });
});
