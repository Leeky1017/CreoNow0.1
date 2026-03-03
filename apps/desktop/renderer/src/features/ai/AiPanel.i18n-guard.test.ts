import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * WB-FE-I18N-CORE-S3: AiPanel must have no hardcoded visible strings.
 *
 * Why: AiPanel has substantial user-facing text (candidate labels, judge
 * results, usage stats labels) that must route through t() for i18n.
 */
describe("WB-FE-I18N-CORE-S3: AiPanel i18n guard", () => {
  const filePath = path.resolve(__dirname, "AiPanel.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  function stripSafeContexts(src: string): string {
    let result = src;
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    result = result.replace(/\/\/.*$/gm, "");
    result = result.replace(/^import\s.+$/gm, "");
    result = result.replace(/console\.\w+\([^)]*\)/g, "");
    return result;
  }

  it("has no hardcoded Chinese characters in visible strings", () => {
    const cleaned = stripSafeContexts(source);
    const chinesePattern = /[\u4e00-\u9fff]/g;
    const matches = cleaned.match(chinesePattern);
    expect(
      matches,
      `Found ${matches?.length ?? 0} residual Chinese character(s) in AiPanel.tsx`,
    ).toBeNull();
  });

  it("has no hardcoded English visible strings for i18n-relevant labels", () => {
    const cleaned = stripSafeContexts(source);
    const hardcodedPatterns = [
      /"Applied & saved"/,
      /"Applied &amp; saved"/,
    ];

    const found: string[] = [];
    for (const pattern of hardcodedPatterns) {
      if (pattern.test(cleaned)) {
        found.push(pattern.source);
      }
    }

    expect(
      found,
      `Found hardcoded English strings: ${found.join(", ")}`,
    ).toHaveLength(0);
  });
});
