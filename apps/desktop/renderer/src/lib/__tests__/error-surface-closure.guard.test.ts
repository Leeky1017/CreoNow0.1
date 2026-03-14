/**
 * Guard: Error Surface Closure — A0-21
 *
 * Scans all .tsx/.ts source files (excluding errorMessages.ts and test files)
 * for patterns that leak raw IPC error codes into the UI.
 *
 * Scenario: S-A0-21-GUARD — no technical error code rendered to user
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const SRC_ROOT = join(__dirname, "../..");

/** Patterns that indicate raw IPC error code/message leaking into UI */
const LEAK_PATTERNS = [
  /\{(?:\w+\.)*\w*error\w*\.(?:code|message|errorCode)\}/i,
  /\$\{[^}]*?(?:\w+\.)*\w*error\w*\.(?:code|message|errorCode)[^}]*\}/i,
  /"ACTION_FAILED:/,
  /"NO_PROJECT:/,
];

/** Files/patterns excluded from scanning */
const EXCLUDE_PATTERNS = [
  /errorMessages\.ts$/,
  /\.test\./,
  /\.spec\./,
  /\.guard\.test\./,
  /\.stories\./,
  /__tests__\//,
  /node_modules/,
  /ErrorBoundary\.tsx$/,
];

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function collectViolations(content: string): string[] {
  const lines = content.split("\n");
  const violations: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(line)) {
        violations.push(`${i + 1}: ${line.trim()}`);
      }
    }
  }

  return violations;
}

describe("A0-21: error surface closure guard", () => {
  it("flags raw error variants and ignores localized pass fixtures", () => {
    const failFixtures = [
      "{lastError.code}: {lastError.message}",
      "{state.lastError.code}: {state.lastError.message}",
      "{branchMergeError.code}: {branchMergeError.message}",
      "{previewError.code}: {previewError.message}",
      "{error.errorCode}",
      'ctx.setErrorText("ACTION_FAILED: Settings dialog not available")',
    ];
    const passFixtures = [
      "{getHumanErrorMessage(lastError)}",
      "{getHumanErrorMessage(branchMergeError)}",
      "{getHumanErrorMessage(previewError)}",
      "{localizedErrorCode}",
      'ctx.setErrorText(t("commandPalette.error.settingsUnavailable"))',
    ];

    for (const fixture of failFixtures) {
      expect(collectViolations(fixture), fixture).not.toEqual([]);
    }
    for (const fixture of passFixtures) {
      expect(collectViolations(fixture), fixture).toEqual([]);
    }
  });

  it("should not have raw error.code/error.message rendered in UI components", () => {
    const files = collectFiles(SRC_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(SRC_ROOT, file);
      if (EXCLUDE_PATTERNS.some((p) => p.test(rel))) continue;

      const content = readFileSync(file, "utf-8");
      const fileViolations = collectViolations(content).map(
        (line) => `${rel}:${line}`,
      );
      violations.push(...fileViolations);
    }

    expect(violations).toEqual([]);
  });
});
