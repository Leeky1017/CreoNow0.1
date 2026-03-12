import { describe, it, expect } from "vitest";
import en from "../../i18n/locales/en.json";
import zhCN from "../../i18n/locales/zh-CN.json";

/**
 * AC-11: 所有 Toast 文案通过 t() 函数获取，无裸字符串。
 *
 * 验证 zh-CN.json 和 en.json 都包含所有必需的 toast.* key。
 */

const REQUIRED_TOAST_KEYS = [
  "toast.save.success.title",
  "toast.save.error.title",
  "toast.save.error.description",
  "toast.save.error.retry",
  "toast.export.success.title",
  "toast.ai.error.title",
  "toast.ai.error.description",
  "toast.settings.success.title",
  "toast.autosave.retrySuccess.title",
  "toast.autosave.flushError.title",
  "toast.autosave.flushError.description",
] as const;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

describe("toast i18n key 完备性 (AC-11)", () => {
  it.each(REQUIRED_TOAST_KEYS)("en.json 包含 key: %s", (key) => {
    const value = getNestedValue(en as Record<string, unknown>, key);
    expect(value).toBeDefined();
    expect(typeof value).toBe("string");
    expect((value as string).length).toBeGreaterThan(0);
  });

  it.each(REQUIRED_TOAST_KEYS)("zh-CN.json 包含 key: %s", (key) => {
    const value = getNestedValue(zhCN as Record<string, unknown>, key);
    expect(value).toBeDefined();
    expect(typeof value).toBe("string");
    expect((value as string).length).toBeGreaterThan(0);
  });
});
