/**
 * A0-16 Guard: editor / version-history / slash-command i18n 收口
 *
 * 「巧妇难为无米之炊」—— 但有了 i18n 键，便不再有硬编码裸字符串。
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const RENDERER_SRC = resolve(CURRENT_DIR, "..", "..", "renderer", "src");
const LOCALES_DIR = resolve(RENDERER_SRC, "i18n", "locales");

function src(relativePath: string): string {
  return readFileSync(resolve(RENDERER_SRC, relativePath), "utf8");
}

function locale(lang: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, `${lang}.json`), "utf8"));
}

function deepGet(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => {
    if (cur && typeof cur === "object")
      return (cur as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// ─── New keys introduced by A0-16 ──────────────────────────────────
const A016_KEYS = [
  // editor
  "editor.contextMenu.ai",
  "editor.confirmSwitchToDraft",
  // slash commands (6 × 2)
  "editor.slash.continue.label",
  "editor.slash.continue.description",
  "editor.slash.describe.label",
  "editor.slash.describe.description",
  "editor.slash.dialogue.label",
  "editor.slash.dialogue.description",
  "editor.slash.character.label",
  "editor.slash.character.description",
  "editor.slash.outline.label",
  "editor.slash.outline.description",
  "editor.slash.search.label",
  "editor.slash.search.description",
  // version history container
  "versionHistory.container.author.you",
  "versionHistory.container.author.ai",
  "versionHistory.container.author.auto",
  "versionHistory.container.author.unknown",
  "versionHistory.container.timeGroup.justNow",
  "versionHistory.container.timeGroup.today",
  "versionHistory.container.timeGroup.yesterday",
  "versionHistory.container.timeGroup.earlier",
  "versionHistory.container.timeGroup.minutesAgo",
  "versionHistory.container.loadingVersions",
  // useVersionCompare
  "versionHistory.compare.noDifferences",
  "versionHistory.compare.unknownError",
];

// ─── 1. i18n key completeness ──────────────────────────────────────
describe("A0-16: i18n key completeness", () => {
  const en = locale("en");
  const zhCN = locale("zh-CN");

  for (const key of A016_KEYS) {
    it(`en.json has key "${key}"`, () => {
      expect(deepGet(en, key)).toBeDefined();
      expect(typeof deepGet(en, key)).toBe("string");
    });

    it(`zh-CN.json has key "${key}"`, () => {
      expect(deepGet(zhCN, key)).toBeDefined();
      expect(typeof deepGet(zhCN, key)).toBe("string");
    });
  }

  it("en and zh-CN have the same set of A0-16 keys", () => {
    const enPresent = A016_KEYS.filter((k) => deepGet(en, k) !== undefined);
    const zhPresent = A016_KEYS.filter((k) => deepGet(zhCN, k) !== undefined);
    expect(enPresent).toEqual(zhPresent);
  });
});

// ─── 2. Source scan: no hardcoded English in target files ──────────
describe("A0-16: no hardcoded English strings remain", () => {
  it("EditorPane.tsx: no bare 'Entity suggestions unavailable.'", () => {
    const code = src("features/editor/EditorPane.tsx");
    expect(code).not.toContain('"Entity suggestions unavailable."');
  });

  it("EditorPane.tsx: no bare 'This document is final. Editing will switch'", () => {
    const code = src("features/editor/EditorPane.tsx");
    expect(code).not.toContain(
      "This document is final. Editing will switch it back to draft. Continue?",
    );
  });

  it("EditorContextMenu.tsx: AI label uses t()", () => {
    const code = src("features/editor/EditorContextMenu.tsx");
    // Should not have bare "AI" as a ContextMenu.Label child
    expect(code).not.toMatch(/>AI</);
    expect(code).toMatch(/t\(["']editor\.contextMenu\.ai["']\)/);
  });

  it("slashCommands.ts: all labels and descriptions use t()", () => {
    const code = src("features/editor/slashCommands.ts");
    // No hardcoded Chinese slash labels
    expect(code).not.toContain('"/续写"');
    expect(code).not.toContain('"/描写"');
    expect(code).not.toContain('"/对白"');
    expect(code).not.toContain('"/角色"');
    expect(code).not.toContain('"/大纲"');
    expect(code).not.toContain('"/搜索"');
    // No hardcoded Chinese descriptions
    expect(code).not.toContain("基于当前光标附近上下文继续创作");
    expect(code).not.toContain("扩展场景细节与氛围描写");
    // Should reference i18n keys
    expect(code).toMatch(/editor\.slash\.continue\.label/);
    expect(code).toMatch(/editor\.slash\.search\.description/);
  });

  it("VersionHistoryContainer.tsx: author names use i18n", () => {
    const code = src("features/version-history/VersionHistoryContainer.tsx");
    // getAuthorName should not return bare English
    expect(code).not.toMatch(/return\s+["']You["']/);
    expect(code).not.toMatch(/return\s+["']Auto["']/);
    expect(code).not.toMatch(/return\s+["']Unknown["']/);
  });

  it("VersionHistoryContainer.tsx: time group labels use i18n", () => {
    const code = src("features/version-history/VersionHistoryContainer.tsx");
    // getTimeGroupLabel should not return bare English
    expect(code).not.toMatch(/return\s+["']Today["']/);
    expect(code).not.toMatch(/return\s+["']Yesterday["']/);
    expect(code).not.toMatch(/return\s+["']Earlier["']/);
    expect(code).not.toMatch(/return\s+["']Just now["']/);
  });

  it("VersionHistoryContainer.tsx: 'Loading versions...' uses t()", () => {
    const code = src("features/version-history/VersionHistoryContainer.tsx");
    expect(code).not.toContain("Loading versions...");
  });

  it("VersionHistoryPanel.tsx: tooltip strings use t()", () => {
    const code = src("features/version-history/VersionHistoryPanel.tsx");
    // Tooltip content should not be bare English
    expect(code).not.toMatch(/content="Restore"/);
    expect(code).not.toMatch(/content="Compare"/);
    expect(code).not.toMatch(/content="Preview"/);
  });

  it("useVersionCompare.ts: fallback strings use i18n", () => {
    const code = src("features/version-history/useVersionCompare.ts");
    expect(code).not.toMatch(/["']No differences found\.["']/);
    expect(code).not.toMatch(/["']Unknown error["']/);
  });
});
