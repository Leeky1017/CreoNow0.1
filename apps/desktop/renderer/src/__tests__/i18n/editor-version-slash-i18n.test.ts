/**
 * A0-16: 编辑器/版本/Slash i18n 裸字符串消除验证
 *
 * 验证所有目标文件中的裸字符串已被 i18n t() 调用替换，
 * 且 zh-CN.json / en.json 的新增 key 完整对称。
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const RENDERER_SRC = resolve(__dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(resolve(RENDERER_SRC, relativePath), "utf-8");
}

function loadLocale(locale: string): Record<string, unknown> {
  const raw = readFileSync(
    resolve(RENDERER_SRC, `i18n/locales/${locale}.json`),
    "utf-8",
  );
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * Recursively collect all leaf keys from a nested object.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ─── AC-1: EditorPane 裸字符串消除 ───────────────────────────

describe("AC-1: EditorPane.tsx 裸字符串已被 t() 替换", () => {
  const source = readSource("features/editor/EditorPane.tsx");

  it("不包含裸字符串 'Entity suggestions unavailable.'", () => {
    expect(source).not.toContain('"Entity suggestions unavailable."');
  });

  it("不包含裸字符串 'This document is final...'", () => {
    expect(source).not.toContain(
      '"This document is final. Editing will switch it back to draft. Continue?"',
    );
  });

  it("包含 t('editor.entitySuggestionsUnavailable') 调用", () => {
    expect(source).toContain("t('editor.entitySuggestionsUnavailable')");
  });

  it("包含 t('editor.confirmSwitchToDraft') 调用", () => {
    expect(source).toContain("t('editor.confirmSwitchToDraft')");
  });
});

// ─── AC-2: EditorContextMenu AI 标签 ───────────────────────────

describe("AC-2: EditorContextMenu.tsx AI 标签已 i18n", () => {
  const source = readSource("features/editor/EditorContextMenu.tsx");

  it("AI 菜单标签使用 t('editor.contextMenu.ai') 而非裸字符串", () => {
    expect(source).toContain('t("editor.contextMenu.ai")');
    // 确保没有裸 >AI< 作为 ContextMenu.Label 内容
    expect(source).not.toMatch(/<ContextMenu\.Label[^>]*>AI<\/ContextMenu\.Label>/);
  });
});

// ─── AC-3: Slash command i18n ───────────────────────────────

describe("AC-3: slashCommands.ts label/description 已 i18n", () => {
  const source = readSource("features/editor/slashCommands.ts");

  const bareLabels = ["/续写", "/描写", "/对白", "/角色", "/大纲", "/搜索"];
  for (const label of bareLabels) {
    it(`不包含硬编码 label "${label}"`, () => {
      // keywords 数组中的中文触发词不算裸字符串
      const lines = source.split("\n");
      const nonKeywordLines = lines.filter((l) => !l.includes("keywords:"));
      expect(nonKeywordLines.join("\n")).not.toContain(`"${label}"`);
    });
  }

  const slashKeys = [
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
  ];

  it("zh-CN.json 包含全部 12 个 slash i18n key", () => {
    const zhCN = loadLocale("zh-CN");
    const allKeys = collectKeys(zhCN);
    for (const key of slashKeys) {
      expect(allKeys, `missing key: ${key}`).toContain(key);
    }
  });

  it("en.json 包含全部 12 个 slash i18n key", () => {
    const en = loadLocale("en");
    const allKeys = collectKeys(en);
    for (const key of slashKeys) {
      expect(allKeys, `missing key: ${key}`).toContain(key);
    }
  });
});

// ─── AC-4/5/6: VersionHistoryContainer 裸字符串消除 ──────────

describe("AC-4/5/6: VersionHistoryContainer.tsx 裸字符串已被 t() 替换", () => {
  const source = readSource(
    "features/version-history/VersionHistoryContainer.tsx",
  );

  it("作者名不包含裸字符串赋值", () => {
    // "You", "AI", "Auto", "Unknown" 不应作为 return 值
    const returnStatements = source
      .split("\n")
      .filter((l) => l.trim().startsWith("return "));
    for (const line of returnStatements) {
      expect(line).not.toMatch(/return "You"/);
      expect(line).not.toMatch(/return "Auto"/);
      expect(line).not.toMatch(/return "Unknown"/);
    }
    // "AI" 作为作者名 return 值也不应出现
    expect(
      returnStatements.some((l) => /return "AI"/.test(l) && !l.includes("i18n")),
    ).toBe(false);
  });

  it("时间分组不包含裸字符串 'Just now' / 'Today' / 'Yesterday' / 'Earlier'", () => {
    const returnStatements = source
      .split("\n")
      .filter((l) => l.trim().startsWith("return "));
    for (const line of returnStatements) {
      expect(line).not.toMatch(/return "Just now"/);
      expect(line).not.toMatch(/return "Today"/);
      expect(line).not.toMatch(/return "Yesterday"/);
      expect(line).not.toMatch(/return "Earlier"/);
    }
  });

  it("不包含裸字符串 'Loading versions...'", () => {
    expect(source).not.toContain("Loading versions...");
  });

  it("使用 i18n.t() 进行作者名翻译", () => {
    expect(source).toContain(
      'i18n.t("versionHistory.container.author.you")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.author.ai")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.author.auto")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.author.unknown")',
    );
  });

  it("使用 i18n.t() 进行时间分组翻译", () => {
    expect(source).toContain(
      'i18n.t("versionHistory.container.timeGroup.justNow")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.timeGroup.today")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.timeGroup.yesterday")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.container.timeGroup.earlier")',
    );
  });
});

// ─── AC-7: VersionHistoryPanel tooltips ──────────────────────

describe("AC-7: VersionHistoryPanel.tsx tooltip 裸字符串已被 t() 替换", () => {
  const source = readSource(
    "features/version-history/VersionHistoryPanel.tsx",
  );

  it("不包含裸字符串 tooltip 'Restore' / 'Compare' / 'Preview'", () => {
    expect(source).not.toMatch(/content="Restore"/);
    expect(source).not.toMatch(/content="Compare"/);
    expect(source).not.toMatch(/content="Preview"/);
  });

  it("使用 t() 进行 tooltip 翻译", () => {
    expect(source).toContain('t("versionHistory.panel.restore")');
    expect(source).toContain('t("versionHistory.panel.compare")');
    expect(source).toContain('t("versionHistory.panel.preview")');
  });
});

// ─── AC-8: useVersionCompare 错误消息 ───────────────────────

describe("AC-8: useVersionCompare.ts 裸字符串已被 i18n.t() 替换", () => {
  const source = readSource(
    "features/version-history/useVersionCompare.ts",
  );

  it("不包含裸字符串 'No differences found.'", () => {
    expect(source).not.toContain('"No differences found."');
  });

  it("不包含裸字符串 'Unknown error'", () => {
    expect(source).not.toContain('"Unknown error"');
  });

  it("使用 i18n.t() 进行翻译", () => {
    expect(source).toContain(
      'i18n.t("versionHistory.compare.noDifferencesFound")',
    );
    expect(source).toContain(
      'i18n.t("versionHistory.compare.unknownError")',
    );
  });
});

// ─── AC-9: i18n key 完整性与对称性 ──────────────────────────

describe("AC-9: i18n key 完整性与对称性", () => {
  const NEW_KEYS = [
    // editor (3 keys)
    "editor.entitySuggestionsUnavailable",
    "editor.confirmSwitchToDraft",
    "editor.contextMenu.ai",
    // slash commands (12 keys)
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
    // version history (13 keys)
    "versionHistory.container.author.you",
    "versionHistory.container.author.ai",
    "versionHistory.container.author.auto",
    "versionHistory.container.author.unknown",
    "versionHistory.container.timeGroup.justNow",
    "versionHistory.container.timeGroup.minutesAgo",
    "versionHistory.container.timeGroup.today",
    "versionHistory.container.timeGroup.yesterday",
    "versionHistory.container.timeGroup.earlier",
    "versionHistory.container.loadingVersions",
    "versionHistory.compare.noDifferencesFound",
    "versionHistory.compare.unknownError",
  ];

  it("zh-CN.json 包含全部新增 key", () => {
    const zhCN = loadLocale("zh-CN");
    const allKeys = collectKeys(zhCN);
    for (const key of NEW_KEYS) {
      expect(allKeys, `zh-CN missing key: ${key}`).toContain(key);
    }
  });

  it("en.json 包含全部新增 key", () => {
    const en = loadLocale("en");
    const allKeys = collectKeys(en);
    for (const key of NEW_KEYS) {
      expect(allKeys, `en missing key: ${key}`).toContain(key);
    }
  });

  it("zh-CN 与 en 新增 key 集合完全一致", () => {
    const zhCN = loadLocale("zh-CN");
    const en = loadLocale("en");
    const zhKeys = new Set(collectKeys(zhCN));
    const enKeys = new Set(collectKeys(en));

    for (const key of NEW_KEYS) {
      expect(zhKeys.has(key), `zh-CN 缺少 ${key}`).toBe(true);
      expect(enKeys.has(key), `en 缺少 ${key}`).toBe(true);
    }
  });
});
