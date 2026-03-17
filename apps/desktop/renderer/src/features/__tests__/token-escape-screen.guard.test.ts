import { describe, expect, it } from "vitest";
import {
  collectAllFeatureTsxFiles,
  collectPatternViolations,
} from "./guard-test-utils";

const SCREEN_ESCAPE_PATTERNS = [
  {
    rule: "h-screen",
    regex: /\bh-screen\b/g,
  },
  {
    rule: "w-screen",
    regex: /\bw-screen\b/g,
  },
] as const;

describe("WB-FE-TOKEN-S4 screen escape guard", () => {
  it("rejects h-screen and w-screen in all feature files (regression guard)", () => {
    const files = collectAllFeatureTsxFiles();

    const violations = collectPatternViolations(files, SCREEN_ESCAPE_PATTERNS);

    if (violations.length > 0) {
      const summary = violations
        .map((v) => `  ${v.file} [${v.rule}]: ${v.match}`)
        .join("\n");
      expect.fail(`Found ${violations.length} screen escape(s):\n${summary}`);
    }
  });
});
