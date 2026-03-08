/**
 * A0-21 — CommandPalette i18n 错误 key 完整性测试
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const LOCALES_DIR = path.resolve(__dirname, "../i18n/locales");

function loadLocale(name: string): Record<string, unknown> {
  const raw = fs.readFileSync(path.join(LOCALES_DIR, `${name}.json`), "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

type Nested = Record<string, unknown>;

function getNestedValue(obj: Nested, keyPath: string): unknown {
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Nested)[part];
  }
  return current;
}

const REQUIRED_ERROR_KEYS = [
  "settingsUnavailable",
  "exportUnavailable",
  "layoutActionFailed",
  "noProject",
  "actionFailed",
] as const;

describe("CommandPalette i18n 错误 key 完整性", () => {
  const zhCN = loadLocale("zh-CN");
  const en = loadLocale("en");

  it("zh-CN.json 包含全部 commandPalette.error.* key", () => {
    const errors = getNestedValue(zhCN, "workbench.commandPalette.error") as
      | Record<string, string>
      | undefined;
    expect(errors).toBeDefined();
    for (const key of REQUIRED_ERROR_KEYS) {
      expect(errors).toHaveProperty(key);
      expect(errors![key].length).toBeGreaterThan(0);
    }
  });

  it("en.json 包含全部 commandPalette.error.* key", () => {
    const errors = getNestedValue(en, "workbench.commandPalette.error") as
      | Record<string, string>
      | undefined;
    expect(errors).toBeDefined();
    for (const key of REQUIRED_ERROR_KEYS) {
      expect(errors).toHaveProperty(key);
      expect(errors![key].length).toBeGreaterThan(0);
    }
  });

  it("zh-CN 和 en 的 key 数量一致", () => {
    const zhErrors = getNestedValue(
      zhCN,
      "workbench.commandPalette.error",
    ) as Record<string, string>;
    const enErrors = getNestedValue(
      en,
      "workbench.commandPalette.error",
    ) as Record<string, string>;
    expect(Object.keys(zhErrors).length).toBe(Object.keys(enErrors).length);
  });

  it("所有值不含 ACTION_FAILED 或 NO_PROJECT 前缀", () => {
    for (const [localeName, locale] of [
      ["zh-CN", zhCN],
      ["en", en],
    ] as const) {
      const errors = getNestedValue(
        locale,
        "workbench.commandPalette.error",
      ) as Record<string, string>;
      for (const [key, value] of Object.entries(errors)) {
        expect(
          value,
          `${localeName}.commandPalette.error.${key}`,
        ).not.toMatch(/ACTION_FAILED|NO_PROJECT/u);
      }
    }
  });

  it("export.error.noProject 值不含 NO_PROJECT 前缀", () => {
    for (const [localeName, locale] of [
      ["zh-CN", zhCN],
      ["en", en],
    ] as const) {
      const val = getNestedValue(locale, "export.error.noProject") as string;
      expect(val, `${localeName}.export.error.noProject`).not.toMatch(
        /NO_PROJECT/u,
      );
    }
  });
});
