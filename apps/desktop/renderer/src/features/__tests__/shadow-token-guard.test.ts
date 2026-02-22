import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const TARGET_FILES = [
  "apps/desktop/renderer/src/features/ai/ModelPicker.tsx",
  "apps/desktop/renderer/src/features/ai/ChatHistory.tsx",
  "apps/desktop/renderer/src/features/ai/SkillPicker.tsx",
  "apps/desktop/renderer/src/features/ai/ModePicker.tsx",
] as const;

const FORBIDDEN_SHADOW_PATTERNS = [
  {
    rule: "magic-shadow-arbitrary-value",
    regex: /\bshadow-\[0_[^\]]+\]/g,
  },
  {
    rule: "raw-inline-box-shadow",
    regex: /\bboxShadow\s*:\s*["'`](?!var\(--shadow-)[^"'`]+["'`]/g,
  },
  {
    rule: "raw-css-box-shadow",
    regex: /\bbox-shadow\s*:\s*(?!var\(--shadow-)[^;]+;/g,
  },
] as const;

type Violation = {
  file: string;
  rule: string;
  match: string;
};

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../..",
);

function collectViolations(): Violation[] {
  const violations: Violation[] = [];

  for (const file of TARGET_FILES) {
    const source = fs.readFileSync(path.join(repoRoot, file), "utf8");

    for (const pattern of FORBIDDEN_SHADOW_PATTERNS) {
      for (const match of source.matchAll(pattern.regex)) {
        violations.push({
          file,
          rule: pattern.rule,
          match: match[0],
        });
      }
    }
  }

  return violations;
}

describe("WB-P1-S4 shadow token guard", () => {
  it("rejects magic shadow values and raw box-shadow usage in AI feature files", () => {
    expect(collectViolations()).toEqual([]);
  });
});
