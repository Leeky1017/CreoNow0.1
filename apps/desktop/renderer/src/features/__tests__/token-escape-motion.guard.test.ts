import { describe, expect, it } from "vitest";
import {
  collectAllFeatureTsxFiles,
  collectPatternViolations,
} from "./guard-test-utils";

const MOTION_ESCAPE_PATTERNS = [
  {
    rule: "transition-all",
    regex: /\btransition-all\b/g,
  },
] as const;

describe("WB-FE-TOKEN-S3 motion token escape guard", () => {
  it("rejects transition-all in all feature files", () => {
    const files = collectAllFeatureTsxFiles();

    const violations = collectPatternViolations(files, MOTION_ESCAPE_PATTERNS);

    if (violations.length > 0) {
      const summary = violations
        .map((v) => `  ${v.file} [${v.rule}]: ${v.match}`)
        .join("\n");
      expect.fail(
        `Found ${violations.length} transition-all escape(s):\n${summary}`,
      );
    }
  });
});
