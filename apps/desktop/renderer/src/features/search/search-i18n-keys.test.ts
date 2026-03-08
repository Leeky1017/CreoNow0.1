import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve(
  __dirname,
  "../../i18n/locales",
);

const REQUIRED_KEYS = [
  "search.input.placeholder",
  "search.input.ariaLabel",
  "search.noResults.title",
  "search.resultCount",
  "search.shortcut.label",
];

function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

describe("search i18n key 覆盖验证 (AC-14)", () => {
  const zhRaw = fs.readFileSync(path.join(LOCALES_DIR, "zh-CN.json"), "utf-8");
  const enRaw = fs.readFileSync(path.join(LOCALES_DIR, "en.json"), "utf-8");
  const zh = JSON.parse(zhRaw) as Record<string, unknown>;
  const en = JSON.parse(enRaw) as Record<string, unknown>;

  for (const key of REQUIRED_KEYS) {
    it(`zh-CN.json 包含 ${key}`, () => {
      expect(getNestedValue(zh, key)).toBeDefined();
      expect(typeof getNestedValue(zh, key)).toBe("string");
    });

    it(`en.json 包含 ${key}`, () => {
      expect(getNestedValue(en, key)).toBeDefined();
      expect(typeof getNestedValue(en, key)).toBe("string");
    });
  }
});
