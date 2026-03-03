import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * WB-FE-I18N-CORE-S5: OnboardingPage must have no hardcoded visible strings.
 *
 * Why: After i18n keying, all user-visible text must go through t() so that
 * switching language renders the correct locale.  This guard reads the source
 * file and asserts zero residual Chinese characters outside of safe contexts
 * (comments, imports, classNames, console, data-testid, t()-keys).
 */
describe("WB-FE-I18N-CORE-S5: OnboardingPage i18n guard", () => {
  const filePath = path.resolve(__dirname, "OnboardingPage.tsx");
  const source = fs.readFileSync(filePath, "utf-8");

  /**
   * Strip contexts where Chinese characters are acceptable:
   * - single-line comments  // …
   * - block comments        /* … *\/
   * - console.log/warn/error calls
   * - import statements
   */
  function stripSafeContexts(src: string): string {
    let result = src;
    // Remove block comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    // Remove single-line comments
    result = result.replace(/\/\/.*$/gm, "");
    // Remove import lines
    result = result.replace(/^import\s.+$/gm, "");
    // Remove console.* lines
    result = result.replace(/console\.\w+\([^)]*\)/g, "");
    return result;
  }

  it("has no hardcoded Chinese characters in visible strings", () => {
    const cleaned = stripSafeContexts(source);
    const chinesePattern = /[\u4e00-\u9fff]/g;
    const matches = cleaned.match(chinesePattern);
    expect(
      matches,
      `Found ${matches?.length ?? 0} residual Chinese character(s) in OnboardingPage.tsx`,
    ).toBeNull();
  });

  it("has no hardcoded English visible strings outside t() calls", () => {
    const cleaned = stripSafeContexts(source);
    // Look for common hardcoded English strings that should be i18n-keyed
    const hardcodedPatterns = [
      /"Welcome to CreoNow"/,
      /"AI-powered Writing IDE"/,
      /"Select Language"/,
      /"Choose your preferred/,
      /"AI Writing Assistant"/,
      /"Smart Continuation/,
      /"AI Settings Are/,
      /"Open Workspace"/,
      /"Open Folder"/,
      /"Skip, choose later"/,
      /"Next"/,
      /"Back"/,
      /"Skip"/,
      /"English interface"/,
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
