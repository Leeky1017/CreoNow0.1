import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(CURRENT_DIR, "..");

/**
 * WB-FE-TT-S1: Feature layer must not use native `title` attribute as primary tooltip.
 *
 * Scans features/**\/*.tsx files for native HTML `title=` attributes.
 * Whitelisted patterns are excluded from violation count.
 */

/**
 * Recursively collect all .tsx source files under features/,
 * excluding test files, stories, and __tests__ directories.
 */
function collectFeatureTsx(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...collectFeatureTsx(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      if (
        entry.name.endsWith(".test.tsx") ||
        entry.name.endsWith(".stories.tsx")
      ) {
        continue;
      }
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Detect native HTML `title=` attributes in JSX.
 *
 * Violations: `title=` on lowercase (native HTML) elements like <button title=...>
 * Whitelist:
 *   - Component props (PascalCase elements like <Dialog title=...>)
 *   - <title> SVG tags
 *   - document.title assignments
 *   - Comments (// or /*)
 *   - TypeScript interface/type definitions
 */
function findNativeTitleViolations(
  filePath: string,
): { line: number; text: string }[] {
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split("\n");
  const violations: { line: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    ) {
      continue;
    }

    // Skip document.title
    if (trimmed.includes("document.title")) {
      continue;
    }

    // Skip <title> SVG element
    if (/<title>/.test(trimmed) || /<\/title>/.test(trimmed)) {
      continue;
    }

    // Skip TypeScript interface/type definitions
    if (/^\s*(title\??:\s)/.test(trimmed)) {
      continue;
    }

    // Match ` title=` or ` title={` pattern in JSX attribute position
    const titleMatch = /\s+title[=]/.exec(line);
    if (!titleMatch) continue;

    // Check if this title= is on a native HTML element (lowercase tag)
    // by looking backwards from this line for the opening tag
    const isComponentProp = isOnCustomComponent(lines, i);

    if (!isComponentProp) {
      violations.push({ line: i + 1, text: trimmed });
    }
  }

  return violations;
}

/**
 * Components where `title` is a heading/label prop, NOT a tooltip.
 * These are whitelisted — their `title=` usage is not a violation.
 */
const HEADING_TITLE_COMPONENTS = new Set([
  "Dialog",
  "ConfirmDialog",
  "PanelContainer",
  "PanelHeader",
  "EmptyState",
  "EmptyStatePattern",
  "ErrorState",
  "LoadingState",
  "ResultGroup",
  "ErrorGuideCard",
  "AlertDialog",
]);

/**
 * Determine if a `title=` attribute on a given line is on a whitelisted
 * heading-title component (where `title` means heading, not tooltip).
 *
 * Looks backward from the current line to find the nearest JSX opening tag.
 */
function isOnCustomComponent(lines: string[], lineIndex: number): boolean {
  // Search backward to find the opening tag
  for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
    // Match JSX opening tag: <SomeComponent or <someElement
    const tagMatch = /<([A-Za-z][A-Za-z0-9.]*)/.exec(lines[i]);
    if (tagMatch) {
      const tagName = tagMatch[1];
      // Only whitelist specific heading-title components
      if (HEADING_TITLE_COMPONENTS.has(tagName)) {
        return true;
      }
      return false;
    }
  }
  return false;
}

describe("tooltip-title-guard (WB-FE-TT-S1)", () => {
  it("feature layer has no raw native HTML title attribute", () => {
    const files = collectFeatureTsx(FEATURES_DIR);
    expect(files.length).toBeGreaterThan(0);

    const allViolations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const relPath = path.relative(path.resolve(CURRENT_DIR, "../.."), file);
      const violations = findNativeTitleViolations(file);
      for (const v of violations) {
        allViolations.push({ file: relPath, ...v });
      }
    }

    if (allViolations.length > 0) {
      const report = allViolations
        .map((v) => `  ${v.file}:${v.line} → ${v.text}`)
        .join("\n");
      expect.fail(
        `Found ${allViolations.length} native title= attributes in features/ (should use <Tooltip>):\n${report}`,
      );
    }
  });
});
