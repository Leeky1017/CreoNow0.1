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

const FORBIDDEN_Z_INDEX_PATTERNS = [
  {
    rule: "numeric-z-index-tailwind-class",
    regex: /\bz-(?:10|20|30|50)\b/g,
  },
  {
    rule: "numeric-z-index-arbitrary-class",
    regex: /\bz-\[\d+\]\b/g,
  },
  {
    rule: "inline-numeric-zIndex",
    regex: /\bzIndex\s*:\s*\d+\b/g,
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

    for (const pattern of FORBIDDEN_Z_INDEX_PATTERNS) {
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

describe("WB-P1-S2 z-index token guard", () => {
  it("rejects numeric z-index classes and numeric inline zIndex in AI feature files", () => {
    expect(collectViolations()).toEqual([]);
  });
});
