import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const zenModeSrc = readFileSync(
  resolve(__dirname, "../ZenMode.tsx"),
  "utf-8",
);
const zenModeStatusSrc = readFileSync(
  resolve(__dirname, "../ZenModeStatus.tsx"),
  "utf-8",
);
const tokensSrc = readFileSync(
  resolve(__dirname, "../../../styles/tokens.css"),
  "utf-8",
);

describe("ZenMode token escape guard", () => {
  it("ZenMode.tsx contains no raw rgba values (ED-FE-ZEN-S1)", () => {
    const lines = zenModeSrc.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (/rgba\s*\(/.test(line)) {
        violations.push(`L${i + 1}: ${line.trim()}`);
      }
    });
    expect(violations, `Found raw rgba in ZenMode.tsx:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("ZenMode.tsx contains no magic pixel values in className (ED-FE-ZEN-S2)", () => {
    const magicPatterns = [
      /text-\[\d+px\]/,
      /px-\[\d+px\]/,
      /py-\[\d+px\]/,
      /max-w-\[\d+px\]/,
      /leading-\[\d[\d.]*\]/, // bare leading with number not var
    ];
    const lines = zenModeSrc.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      for (const pattern of magicPatterns) {
        if (pattern.test(line)) {
          violations.push(`L${i + 1}: ${line.trim()}`);
          break;
        }
      }
    });
    expect(violations, `Found magic pixel values in ZenMode.tsx:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("ZenModeStatus.tsx contains no raw rgba values (ED-FE-ZEN-S3)", () => {
    const lines = zenModeStatusSrc.split("\n");
    const violations: string[] = [];
    lines.forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (/rgba\s*\(/.test(line)) {
        violations.push(`L${i + 1}: ${line.trim()}`);
      }
    });
    expect(violations, `Found raw rgba in ZenModeStatus.tsx:\n${violations.join("\n")}`).toHaveLength(0);
  });

  it("tokens.css defines all required zen-mode tokens (ED-FE-ZEN-S4)", () => {
    const requiredTokens = [
      "--color-zen-hover",
      "--color-zen-statusbar-bg",
      "--zen-content-max-width",
      "--zen-content-padding-x",
      "--zen-content-padding-y",
      "--zen-title-size",
      "--zen-body-size",
      "--zen-body-line-height",
      "--zen-label-size",
    ];
    const missing = requiredTokens.filter((t) => !tokensSrc.includes(t));
    expect(missing, `Missing tokens in tokens.css: ${missing.join(", ")}`).toHaveLength(0);
  });
});
