import { describe, it, expect } from "vitest";
import en from "../../renderer/src/i18n/locales/en.json";
import zhCN from "../../renderer/src/i18n/locales/zh-CN.json";

const REQUIRED_KEYS = [
  "pdfPlainTextHint",
  "docxPlainTextHint",
  "plainTextOnly",
] as const;

describe("export format i18n key completeness", () => {
  for (const key of REQUIRED_KEYS) {
    it(`en.json contains export.format.${key}`, () => {
      expect(en.export.format).toHaveProperty(key);
      expect((en.export.format as Record<string, string>)[key]).toBeTruthy();
    });

    it(`zh-CN.json contains export.format.${key}`, () => {
      expect(zhCN.export.format).toHaveProperty(key);
      expect((zhCN.export.format as Record<string, string>)[key]).toBeTruthy();
    });
  }

  it("en and zh-CN have the same export.format keys", () => {
    const enKeys = Object.keys(en.export.format).sort();
    const zhKeys = Object.keys(zhCN.export.format).sort();
    expect(enKeys).toEqual(zhKeys);
  });
});
