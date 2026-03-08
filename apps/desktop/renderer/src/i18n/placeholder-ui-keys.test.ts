import { describe, expect, it } from "vitest";
import enJson from "./locales/en.json";
import zhCNJson from "./locales/zh-CN.json";

const REQUIRED_KEYS: [string, string, ...string[]][] = [
  ["common", "comingSoon"],
  ["common", "featureInDevelopment"],
  ["settingsDialog", "account", "comingSoonTooltip"],
  ["versionHistory", "panel", "restoreComingSoon"],
];

function getNestedValue(
  obj: Record<string, unknown>,
  path: readonly string[],
): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

describe("A0-15 placeholder UI i18n keys", () => {
  it.each(REQUIRED_KEYS)(
    "en.json contains key %s.%s",
    (...path: string[]) => {
      const value = getNestedValue(
        enJson as unknown as Record<string, unknown>,
        path,
      );
      expect(value).toBeDefined();
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    },
  );

  it.each(REQUIRED_KEYS)(
    "zh-CN.json contains key %s.%s",
    (...path: string[]) => {
      const value = getNestedValue(
        zhCNJson as unknown as Record<string, unknown>,
        path,
      );
      expect(value).toBeDefined();
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    },
  );

  it("en.json and zh-CN.json have the same number of required keys", () => {
    const enCount = REQUIRED_KEYS.filter(
      (path) =>
        getNestedValue(enJson as unknown as Record<string, unknown>, path) !==
        undefined,
    ).length;
    const zhCount = REQUIRED_KEYS.filter(
      (path) =>
        getNestedValue(
          zhCNJson as unknown as Record<string, unknown>,
          path,
        ) !== undefined,
    ).length;
    expect(enCount).toBe(zhCount);
    expect(enCount).toBe(REQUIRED_KEYS.length);
  });
});
