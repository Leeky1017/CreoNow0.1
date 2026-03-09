import { describe, expect, it } from "vitest";
import zhCN from "../../../i18n/locales/zh-CN.json";
import en from "../../../i18n/locales/en.json";

type NestedObject = { [key: string]: string | NestedObject };

function collectKeys(obj: NestedObject, prefix: string): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      keys.push(fullKey);
    } else {
      keys.push(...collectKeys(v as NestedObject, fullKey));
    }
  }
  return keys;
}

const EXPECTED_INLINE_AI_KEYS = [
  "editor.inlineAi.placeholder",
  "editor.inlineAi.accept",
  "editor.inlineAi.reject",
  "editor.inlineAi.regenerate",
  "editor.inlineAi.generating",
  "editor.inlineAi.executionError",
  "editor.inlineAi.conflictError",
  "editor.inlineAi.quickPolish",
  "editor.inlineAi.quickRewrite",
  "editor.inlineAi.quickTranslate",
  "editor.inlineAi.a11y.dialogLabel",
  "editor.inlineAi.a11y.inputLabel",
  "editor.inlineAi.a11y.previewLabel",
  "editor.inlineAi.a11y.acceptButton",
  "editor.inlineAi.a11y.rejectButton",
  "editor.inlineAi.a11y.regenerateButton",
];

describe("Inline AI i18n key completeness", () => {
  const zhKeys = collectKeys(zhCN as NestedObject, "");
  const enKeys = collectKeys(en as NestedObject, "");

  it("zh-CN.json should contain all inlineAi keys", () => {
    for (const key of EXPECTED_INLINE_AI_KEYS) {
      expect(zhKeys, `missing key in zh-CN: ${key}`).toContain(key);
    }
  });

  it("en.json should contain all inlineAi keys", () => {
    for (const key of EXPECTED_INLINE_AI_KEYS) {
      expect(enKeys, `missing key in en: ${key}`).toContain(key);
    }
  });

  it("zh-CN and en should have the same inlineAi key count", () => {
    const zhInlineKeys = zhKeys.filter((k) => k.startsWith("editor.inlineAi."));
    const enInlineKeys = enKeys.filter((k) => k.startsWith("editor.inlineAi."));
    expect(zhInlineKeys.length).toBe(enInlineKeys.length);
  });
});
