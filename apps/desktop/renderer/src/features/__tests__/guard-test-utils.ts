import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AI_OVERLAY_TARGET_FILES = [
  "apps/desktop/renderer/src/features/ai/ModelPicker.tsx",
  "apps/desktop/renderer/src/features/ai/ChatHistory.tsx",
  "apps/desktop/renderer/src/features/ai/SkillPicker.tsx",
  "apps/desktop/renderer/src/features/ai/ModePicker.tsx",
] as const;

export type GuardPattern = {
  rule: string;
  regex: RegExp;
};

export type Violation = {
  file: string;
  rule: string;
  match: string;
};

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../..",
);

export function collectPatternViolations(
  targetFiles: readonly string[],
  patterns: readonly GuardPattern[],
): Violation[] {
  const violations: Violation[] = [];

  for (const targetFile of targetFiles) {
    const source = fs.readFileSync(path.join(REPO_ROOT, targetFile), "utf8");

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern.regex)) {
        violations.push({
          file: targetFile,
          rule: pattern.rule,
          match: match[0],
        });
      }
    }
  }

  return violations;
}

/**
 * Recursively collect all .tsx files under features/,
 * excluding __tests__, .test., and .stories. files.
 */
export function collectAllFeatureTsxFiles(): string[] {
  const featuresDir = path.join(
    REPO_ROOT,
    "apps/desktop/renderer/src/features",
  );
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !entry.name.includes(".test.") &&
        !entry.name.includes(".stories.")
      ) {
        files.push(path.relative(REPO_ROOT, fullPath));
      }
    }
  }

  walk(featuresDir);
  return files.sort();
}

/**
 * Like collectPatternViolations but strips JS comments before matching
 * to avoid false positives on issue references (e.g. TODO(#571)).
 */
export function collectPatternViolationsStripped(
  targetFiles: readonly string[],
  patterns: readonly GuardPattern[],
): Violation[] {
  const violations: Violation[] = [];

  for (const targetFile of targetFiles) {
    const rawSource = fs.readFileSync(path.join(REPO_ROOT, targetFile), "utf8");
    // Strip block comments (/** ... */) and single-line comments (// ...)
    const source = rawSource
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern.regex)) {
        violations.push({
          file: targetFile,
          rule: pattern.rule,
          match: match[0],
        });
      }
    }
  }

  return violations;
}
