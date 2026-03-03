import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * WB-FE-I18N-CORE-S2: SearchPanel must have no hardcoded visible strings.
 *
 * Why: SearchPanel contains user-facing text (labels, status messages,
 * button text) that must all go through t() for proper locale switching.
 */
describe("WB-FE-I18N-CORE-S2: SearchPanel i18n guard", () => {
  const filePath = path.resolve(__dirname, "SearchPanel.tsx");
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
      `Found ${matches?.length ?? 0} residual Chinese character(s) in SearchPanel.tsx`,
    ).toBeNull();
  });

  it("has no hardcoded English visible strings outside t() calls", () => {
    const cleaned = stripSafeContexts(source);
    const hardcodedPatterns = [
      /"Search documents, memories, knowledge\.\.\."/,
      /"Search across projects\.\.\."/,
      /"Enter a search term to find documents"/,
      /"Semantic Search"/,
      /"Include Archived"/,
      /"Current Project"/,
      /"Search in all projects"/,
      /"Clear search"/,
      /"High Relevance"/,
      /"Entity"/,
      /"to navigate"/,
      /"to open"/,
      /"to close"/,
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
