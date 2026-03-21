import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const src = readFileSync(resolve(__dirname, "SearchPanel.tsx"), "utf-8");

describe("SearchPanel token guard", () => {
  it("does not contain raw hex color values (WB-FE-SRCH-S1)", () => {
    // Match #xxx, #xxxx, #xxxxxx, #xxxxxxxx but not CSS var() references or comments
    const hexPattern = /(?<!=\s*['"])#(?:[0-9a-fA-F]{3,8})\b/g;
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      // Skip comments and import lines
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("*") ||
        line.trim().startsWith("{/*") ||
        line.trim().startsWith("import")
      )
        return;
      const matches = line.match(hexPattern);
      if (matches) {
        violations.push(`L${i + 1}: ${matches.join(", ")}`);
      }
    });
    expect(
      violations,
      `Found raw hex values:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("does not contain raw rgba values (WB-FE-SRCH-S1)", () => {
    const rgbaPattern = /rgba\s*\(/g;
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (rgbaPattern.test(line)) {
        violations.push(`L${i + 1}: ${line.trim()}`);
        rgbaPattern.lastIndex = 0;
      }
    });
    expect(
      violations,
      `Found raw rgba:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("does not contain inline style attributes (WB-FE-SRCH-S1b)", () => {
    const stylePattern = /style\s*=\s*\{\{/g;
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (stylePattern.test(line)) {
        violations.push(`L${i + 1}: ${line.trim()}`);
        stylePattern.lastIndex = 0;
      }
    });
    expect(
      violations,
      `Found inline styles:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("does not use transition-all (WB-FE-SRCH-S3)", () => {
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.includes("transition-all")) {
        violations.push(`L${i + 1}: ${line.trim()}`);
      }
    });
    expect(
      violations,
      `Found transition-all:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("does not contain native <button or <input elements (WB-FE-SRCH-S2)", () => {
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      // Skip comments, import lines, and type annotations
      const trimmed = line.trim();
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("import")
      )
        return;
      // Check for native <button or <input (lowercase JSX tags)
      // Use \b to handle tags split across lines (e.g. "<button\n  type=...")
      if (/<button\b/.test(line) || /<input\b/.test(line)) {
        violations.push(`L${i + 1}: ${trimmed}`);
      }
    });
    expect(
      violations,
      `Found native elements (should use Primitives):\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("gates animations with motion-safe modifier (WB-FE-SRCH-S3b)", () => {
    const lines = src.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      // Skip @keyframes definitions — they are CSS, not Tailwind classes
      if (trimmed.startsWith("@keyframes")) return;
      // Check for animate-* classes not gate by motion-safe:
      if (/\banimate-/.test(line)) {
        // Remove motion-safe:animate- occurrences, then check if ungated animate- remains
        const cleaned = line.replace(/motion-safe:animate-/g, "");
        if (/\banimate-/.test(cleaned)) {
          violations.push(`L${i + 1}: ${trimmed}`);
        }
      }
    });
    expect(
      violations,
      `Found ungated animations (use motion-safe: prefix):\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
