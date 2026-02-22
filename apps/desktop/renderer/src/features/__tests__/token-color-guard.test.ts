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

const FORBIDDEN_COLOR_PATTERNS = [
  {
    rule: "hex-color",
    regex: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g,
  },
  {
    rule: "raw-rgb-rgba",
    regex: /rgba?\(\s*(?!var\(--color-)[^)]+\)/g,
  },
  {
    rule: "raw-tailwind-palette-token",
    regex:
      /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g,
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

    for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
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

describe("WB-P1-S1 color token guard", () => {
  it("rejects raw colors and raw tailwind palette tokens in AI feature files", () => {
    expect(collectViolations()).toEqual([]);
  });
});
