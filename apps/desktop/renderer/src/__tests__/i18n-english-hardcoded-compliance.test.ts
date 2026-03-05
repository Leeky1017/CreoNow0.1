/**
 * English hardcoded compliance test (#970).
 *
 * Scans production .tsx files under features/ and components/ for
 * hardcoded English UI text that should be extracted to locale keys via t().
 *
 * Detection heuristics:
 *  1. JSX text content: lines with `>Word(s)` not wrapped in `{t(` or `{...}`
 *  2. UI-facing props with literal strings: label, placeholder, title, description,
 *     aria-label used with English text rather than t() calls
 *
 * Exclusions:
 *  - *.test.* / *.stories.* / *.story.* files
 *  - test-utils.tsx
 *  - Comment lines (// or block comments)
 *  - Import/export statements
 *  - console.* statements
 *  - CSS class strings, data-testid, data-*, className
 *  - Technical constants (file extensions, format codes, protocol strings)
 *  - Strings that are already t() calls
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

const SKIP_FILE_PATTERNS = [
  /\.test\./,
  /\.stories\./,
  /\.story\./,
  /test-utils\.tsx$/,
];

/**
 * Matches English words (2+ letters) appearing as JSX text content
 * between `>` and `<` or at line boundaries, excluding t() wrapped text.
 */
const JSX_TEXT_CONTENT_REGEX = />\s*([A-Z][a-z]+(?:\s+[A-Za-z]+)*)\s*</;

/**
 * Matches UI-facing props with hardcoded string literals.
 * Targets: label, placeholder, title, description, aria-label
 */
const UI_PROP_LITERAL_REGEX =
  /\b(?:label|placeholder|title|description|aria-label)\s*=\s*"([A-Z][^"]{2,})"/;

/**
 * Patterns indicating the line is already using i18n.
 */
const I18N_PATTERNS = [/\bt\(/, /\{t\(/, /useTranslation/];

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...collectTsxFiles(fullPath));
      } else if (
        entry.name.endsWith(".tsx") &&
        !SKIP_FILE_PATTERNS.some((p) => p.test(entry.name))
      ) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist
  }
  return results;
}

/** Lines that should be exempt from English literal checks. */
function isExemptLine(line: string): boolean {
  const trimmed = line.trim();

  // Comments
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  )
    return true;
  if (/^\{\/\*.*\*\/\}$/.test(trimmed)) return true;

  // Imports/exports
  if (trimmed.startsWith("import ") || trimmed.startsWith("export type"))
    return true;
  if (trimmed.startsWith("export interface") || trimmed.startsWith("export {"))
    return true;

  // Console statements
  if (/console\.(log|warn|error|debug|info)\(/.test(trimmed)) return true;

  // Already uses t() function
  if (I18N_PATTERNS.some((p) => p.test(trimmed))) return true;

  // CSS class strings, data-testid, className
  if (/className\s*=/.test(trimmed) && !UI_PROP_LITERAL_REGEX.test(trimmed))
    return true;
  if (/data-testid\s*=/.test(trimmed)) return true;

  // Type annotations and interfaces
  if (/^\s*(type|interface)\s/.test(trimmed)) return true;

  // JSDoc @param, @example etc
  if (/^\s*\*\s*@/.test(trimmed)) return true;

  // Technical: file extensions, format codes, template literals with variables
  if (/^\s*(value|key)\s*[:=]/.test(trimmed)) return true;

  return false;
}

/**
 * Known hardcoded English patterns that MUST be i18n'd.
 * File path (relative to renderer/src) → list of patterns that should NOT appear.
 */
const REQUIRED_CLEAN_FILES: Record<string, RegExp[]> = {
  "features/export/ExportDialog.tsx": [
    />\s*Export Document\s*</,
    />\s*Exporting Document\s*</,
    />\s*Export Complete\s*</,
    />\s*Cancel\s*</,
    />\s*Export\s*</,
    />\s*Done\s*</,
    />\s*Dismiss\s*</,
    /label:\s*"Preparing\.\.\."/,
    /label:\s*"Exporting\.\.\."/,
    /label:\s*"Finalizing\.\.\."/,
    /label:\s*"Include metadata"/,
    /label:\s*"Version history"/,
    /label:\s*"Embed images"/,
  ],
  "components/features/AiDialogs/SystemDialog.tsx": [
    /title:\s*"Delete Document\?"/,
    /title:\s*"Unsaved Changes"/,
    /title:\s*"Export Complete"/,
    />\s*Processing\.\.\.\s*</,
    />\s*Done!\s*</,
    />\s*to confirm\s*</,
    />\s*to cancel\s*</,
  ],
  "features/kg/KnowledgeGraphPanel.tsx": [
    />\s*Knowledge Graph\s*</,
    />\s*Entities\s*</,
    />\s*Relations\s*</,
    />\s*Create entity\s*</,
    />\s*Create relation\s*</,
    />\s*No entities yet\.\s*</,
    />\s*No relations yet\.\s*</,
    />\s*Save\s*</,
    />\s*Cancel\s*</,
    />\s*Edit\s*</,
    />\s*Delete\s*</,
    />\s*Dismiss\s*</,
    /placeholder="Name"/,
    /placeholder="Type \(optional\)"/,
    /placeholder="Description \(optional\)"/,
    /placeholder="Aliases \(comma separated\)"/,
  ],
};

describe("i18n English hardcoded compliance (#970)", () => {
  const allFiles = SCAN_DIRS.flatMap((dir) => collectTsxFiles(dir));

  it("should find production .tsx files to scan", () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  // Test: required files must not contain specific hardcoded patterns
  for (const [relPath, patterns] of Object.entries(REQUIRED_CLEAN_FILES)) {
    it(`${relPath} must not contain hardcoded English UI text`, () => {
      const fullPath = join(RENDERER_SRC, relPath);
      const content = readFileSync(fullPath, "utf8");
      const violations: string[] = [];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          violations.push(`  Found: ${pattern.source}`);
        }
      }

      if (violations.length > 0) {
        expect.fail(
          `${relPath} still has hardcoded English UI text:\n${violations.join("\n")}`,
        );
      }
    });
  }

  // Test: all production tsx files in features/ and components/ should use
  // useTranslation if they contain user-facing text
  const filesWithHardcodedEnglish: Array<{
    file: string;
    samples: Array<{ num: number; text: string }>;
  }> = [];

  for (const filePath of allFiles) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const samples: Array<{ num: number; text: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (isExemptLine(line)) continue;

      // Check for JSX text content with English words
      const jsxMatch = JSX_TEXT_CONTENT_REGEX.exec(line);
      if (jsxMatch) {
        const text = jsxMatch[1]!;
        // Skip single short words that might be component names or technical
        if (text.length < 3 || /^[A-Z][a-z]+$/.test(text)) continue;
        // Skip CSS/class-related
        if (line.includes("className")) continue;
        samples.push({ num: i + 1, text: line.trim() });
        continue;
      }

      // Check for UI prop literals (regardless of useTranslation presence —
      // a file may import the hook but still have stale hardcoded props)
      const propMatch = UI_PROP_LITERAL_REGEX.exec(line);
      if (propMatch) {
        samples.push({ num: i + 1, text: line.trim() });
      }
    }

    if (samples.length > 0) {
      filesWithHardcodedEnglish.push({
        file: relative(RENDERER_SRC, filePath),
        samples: samples.slice(0, 5), // Cap at 5 samples per file
      });
    }
  }

  it("no production .tsx files should have hardcoded English UI text in JSX", () => {
    if (filesWithHardcodedEnglish.length > 0) {
      const report = filesWithHardcodedEnglish
        .map(
          (v) =>
            `\n  ${v.file}:\n${v.samples.map((s) => `    L${s.num}: ${s.text}`).join("\n")}`,
        )
        .join("\n");
      expect.fail(
        `Found ${filesWithHardcodedEnglish.length} file(s) with hardcoded English UI text:\n${report}`,
      );
    }
  });
});
