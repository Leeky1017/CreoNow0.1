import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WB-FE-I18N-CORE-S4: Date formatting must not hardcode "en-US".
 *
 * Why: Hardcoding a locale in date/time formatting defeats i18n — the
 * output stays in one language regardless of the user's preference.
 * Date helpers should derive locale from i18n.language at runtime.
 */
describe("WB-FE-I18N-CORE-S4: date-format-locale guard", () => {
  const featuresDir = path.resolve(__dirname, "..");

  /**
   * Recursively find all .tsx files under a directory.
   */
  function findTsxFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findTsxFiles(full));
      } else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.") && !entry.name.includes(".stories.")) {
        results.push(full);
      }
    }
    return results;
  }

  it("no .tsx source file hardcodes 'en-US' in date formatting context", () => {
    const tsxFiles = findTsxFiles(featuresDir);
    const violations: string[] = [];

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      // Strip comments
      const stripped = content
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");

      // Match toLocaleString("en-US" or toLocaleDateString("en-US" etc.
      const dateLocalePattern = /toLocale\w*String\(\s*["']en-US["']/g;
      const match = dateLocalePattern.exec(stripped);
      if (match) {
        const relPath = path.relative(featuresDir, file);
        violations.push(relPath);
      }
    }

    expect(
      violations,
      `Files with hardcoded "en-US" in date formatting: ${violations.join(", ")}`,
    ).toHaveLength(0);
  });
});
