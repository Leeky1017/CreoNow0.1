import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AC-8: All zen mode i18n keys present in both zh-CN and en locales.
 */

const REQUIRED_ZEN_MODE_KEYS = [
  "zenMode.untitledDocument",
  "zenMode.startWriting",
  "zenMode.a11y.dialogLabel",
  "zenMode.pressEscToExit",
  "zenMode.exitAriaLabel",
  "zenMode.pressEscOrF11ToExit",
  "zenMode.status.wordCount",
  "zenMode.status.readTime",
];

function loadLocale(filename: string): Record<string, unknown> {
  const filePath = resolve(
    __dirname,
    "../../renderer/src/i18n/locales",
    filename,
  );
  return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
}

function getNestedKey(obj: Record<string, unknown>, keyPath: string): unknown {
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

const en = loadLocale("en.json");
const zhCN = loadLocale("zh-CN.json");

// Verify all required keys exist in en.json
for (const key of REQUIRED_ZEN_MODE_KEYS) {
  const value = getNestedKey(en, key);
  assert.ok(
    typeof value === "string" && value.length > 0,
    `en.json missing key: ${key}`,
  );
}

// Verify all required keys exist in zh-CN.json
for (const key of REQUIRED_ZEN_MODE_KEYS) {
  const value = getNestedKey(zhCN, key);
  assert.ok(
    typeof value === "string" && value.length > 0,
    `zh-CN.json missing key: ${key}`,
  );
}

// Verify en and zh-CN zenMode key counts match
const enZenKeys = en["zenMode"] as Record<string, unknown>;
const zhZenKeys = zhCN["zenMode"] as Record<string, unknown>;
assert.equal(
  JSON.stringify(Object.keys(enZenKeys).sort()),
  JSON.stringify(Object.keys(zhZenKeys).sort()),
  "zenMode key structure mismatch between en and zh-CN",
);
