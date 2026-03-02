import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("i18n dynamic-lng guard", () => {
  it("i18n/index.ts does not hardcode lng to a string literal", () => {
    const filePath = path.resolve(__dirname, "../index.ts");
    const content = fs.readFileSync(filePath, "utf-8");

    // Must NOT contain a hardcoded  lng: "zh-CN"  or  lng: 'zh-CN'
    expect(content).not.toMatch(/lng:\s*["']zh-CN["']/);

    // Must reference the dynamic getter
    expect(content).toContain("getLanguagePreference");
  });
});
