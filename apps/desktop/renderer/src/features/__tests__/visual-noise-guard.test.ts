/**
 * Visual Noise Guard — source-code guard test
 *
 * Scenarios:
 *   WB-FE-VIS-S1 — AI panel: no excess non-functional default-state borders
 *   WB-FE-VIS-S2 — Dashboard: project cards have no default-state border
 *   WB-FE-VIS-S3 — Separator borders use --color-separator, not --color-border-default
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  collectPatternViolations,
  type GuardPattern,
} from "./guard-test-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(__dirname, "..");

/**
 * Read a source file relative to the features directory.
 */
function readFeatureSource(relativePath: string): string {
  return fs.readFileSync(path.join(FEATURES_DIR, relativePath), "utf8");
}

/**
 * Collect non-test, non-story .tsx file paths (repo-relative) in given
 * feature sub-directories.
 */
function collectTsxFiles(subdirs: readonly string[]): string[] {
  const files: string[] = [];
  for (const subdir of subdirs) {
    const dir = path.join(FEATURES_DIR, subdir);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (
        entry.endsWith(".tsx") &&
        !entry.includes(".test.") &&
        !entry.includes(".stories.")
      ) {
        files.push(
          path.join("apps/desktop/renderer/src/features", subdir, entry),
        );
      }
    }
  }
  return files;
}

describe("WB-FE-VIS visual noise guard", () => {
  /**
   * S1 — AI panel non-functional borders
   *
   * Count `border-[var(--color-border-default)]` occurrences in AiPanel.tsx.
   * After noise reduction, only interactive / functional elements should retain
   * this token:
   *   - Copy button, Action button    (×2)
   *   - CodeBlock container            (×1)
   *   - Candidate card non-selected    (×1)
   *   - Input wrapper                  (×1)
   * Total ≤ 5
   */
  it("S1: ai panel has no excess non-functional borders", () => {
    const source = readFeatureSource("ai/AiPanel.tsx");
    const matches =
      source.match(/border-\[var\(--color-border-default\)\]/g) ?? [];
    expect(matches.length).toBeLessThanOrEqual(5);
  });

  /**
   * S2 — Dashboard project cards default-state border
   *
   * All `border-[var(--color-border-default)]` in DashboardPage.tsx should be
   * replaced with `border-transparent` or `--color-separator`.
   */
  it("S2: dashboard project cards have no default-state border", () => {
    const source = readFeatureSource("dashboard/DashboardPage.tsx");
    const matches =
      source.match(/border-\[var\(--color-border-default\)\]/g) ?? [];
    expect(matches).toEqual([]);
  });

  /**
   * S3 — Separator borders must use --color-separator
   *
   * Two forbidden patterns across ai / dashboard / settings-dialog .tsx files:
   *   1. Directional border (border-b/t/l/r) paired with --color-border-default
   *   2. `bg-[var(--color-border-default)]` used as a divider line
   */
  it("S3: separator lines use --color-separator token", () => {
    const targetFiles = collectTsxFiles(["ai", "dashboard", "settings-dialog"]);

    const SEPARATOR_VIOLATION_PATTERNS: readonly GuardPattern[] = [
      {
        rule: "directional-border-uses-border-default",
        regex: /border-[btlr]\s+border-\[var\(--color-border-default\)\]/g,
      },
      {
        rule: "bg-divider-uses-border-default",
        regex: /bg-\[var\(--color-border-default\)\]/g,
      },
    ];

    const violations = collectPatternViolations(
      targetFiles,
      SEPARATOR_VIOLATION_PATTERNS,
    );
    expect(violations).toEqual([]);
  });
});
