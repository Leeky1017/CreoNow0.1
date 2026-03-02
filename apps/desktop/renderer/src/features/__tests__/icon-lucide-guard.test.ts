import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(CURRENT_DIR, "..");

/**
 * Recursively collect all .tsx files under a directory,
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
      // Exclude test and stories files
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
 * Collect all .tsx files including stories (but still excluding tests).
 */
function collectAllTsx(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...collectAllTsx(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      if (entry.name.endsWith(".test.tsx")) continue;
      results.push(fullPath);
    }
  }

  return results;
}

describe("WB-FE-ICON: Lucide icon guard", () => {
  it("feature layer contains no inline <svg> elements", () => {
    const files = collectFeatureTsx(FEATURES_DIR);
    const violations: Array<{ file: string; line: number; content: string }> =
      [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (/<svg\b/i.test(lines[i])) {
          violations.push({
            file: path.relative(FEATURES_DIR, file),
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
    }

    expect(
      violations,
      `Found ${violations.length} inline <svg> element(s) in feature layer:\n` +
        violations
          .map((v) => `  ${v.file}:${v.line} → ${v.content}`)
          .join("\n"),
    ).toHaveLength(0);
  });

  it("all lucide imports use consistent strokeWidth and size", () => {
    const files = collectAllTsx(FEATURES_DIR);
    const sizeViolations: Array<{
      file: string;
      line: number;
      content: string;
    }> = [];
    const strokeViolations: Array<{
      file: string;
      line: number;
      content: string;
    }> = [];

    const validSizes = new Set(["16", "20", "24"]);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");

      // Check if file imports from lucide-react
      if (!content.includes("lucide-react")) continue;

      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for size prop on Lucide components (PascalCase component with size prop)
        const sizeMatch = line.match(/\bsize=\{(\d+)\}/);
        if (sizeMatch && !validSizes.has(sizeMatch[1])) {
          sizeViolations.push({
            file: path.relative(FEATURES_DIR, file),
            line: i + 1,
            content: line.trim(),
          });
        }

        // Check for strokeWidth prop — must be 1.5
        const strokeMatch = line.match(/\bstrokeWidth=\{([\d.]+)\}/);
        if (strokeMatch && strokeMatch[1] !== "1.5") {
          strokeViolations.push({
            file: path.relative(FEATURES_DIR, file),
            line: i + 1,
            content: line.trim(),
          });
        }
      }
    }

    const allViolations = [...sizeViolations, ...strokeViolations];

    expect(
      allViolations,
      `Found ${allViolations.length} Lucide icon prop violation(s):\n` +
        sizeViolations
          .map((v) => `  [size] ${v.file}:${v.line} → ${v.content}`)
          .join("\n") +
        "\n" +
        strokeViolations
          .map((v) => `  [strokeWidth] ${v.file}:${v.line} → ${v.content}`)
          .join("\n"),
    ).toHaveLength(0);
  });
});
