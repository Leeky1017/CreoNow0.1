import { describe, it, expect } from "vitest";
import en from "../../i18n/locales/en.json";
import zhCN from "../../i18n/locales/zh-CN.json";

const REQUIRED_KEYS = [
  "pdfStructuredHint",
  "docxStructuredHint",
  "markdownStructuredHint",
  "txtBoundaryHint",
] as const;

describe("export format i18n keys (A0-19)", () => {
  it.each(REQUIRED_KEYS)("en.json contains export.format.%s", (key) => {
    const val = (en as Record<string, unknown>).export as Record<
      string,
      Record<string, string>
    >;
    expect(val.format[key]).toBeDefined();
    expect(val.format[key].length).toBeGreaterThan(0);
  });

  it.each(REQUIRED_KEYS)("zh-CN.json contains export.format.%s", (key) => {
    const val = (zhCN as Record<string, unknown>).export as Record<
      string,
      Record<string, string>
    >;
    expect(val.format[key]).toBeDefined();
    expect(val.format[key].length).toBeGreaterThan(0);
  });

  it("en and zh-CN have the same export.format keys", () => {
    const enFormat = (
      (en as Record<string, unknown>).export as Record<
        string,
        Record<string, string>
      >
    ).format;
    const zhFormat = (
      (zhCN as Record<string, unknown>).export as Record<
        string,
        Record<string, string>
      >
    ).format;
    expect(Object.keys(enFormat).sort()).toEqual(Object.keys(zhFormat).sort());
  });
});
