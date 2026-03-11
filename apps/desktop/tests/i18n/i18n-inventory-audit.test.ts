import { describe, expect, it } from "vitest";
import path from "node:path";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import {
  scanFileContent,
  collectSourceFiles,
  runScan,
  isCssClassName,
  isTechnicalConstant,
  classifyModule,
  classifyPriority,
  type NakedStringEntry,
} from "../../renderer/src/utils/i18n-inventory-scanner";

const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const RENDERER_SRC = path.join(DESKTOP_ROOT, "renderer/src");

/* ================================================================== */
/* Task 1.1 — 已知裸字符串覆盖测试 (AC-1)                              */
/* ================================================================== */

describe("AC-1: 已知裸字符串覆盖", () => {
  const knownNakedStrings: { file: string; content: string }[] = [
    { file: "EditorPane.tsx", content: "Entity suggestions unavailable." },
    {
      file: "EditorPane.tsx",
      content:
        "This document is final. Editing will switch it back to draft. Continue?",
    },
    { file: "slashCommands.ts", content: "/续写" },
    { file: "slashCommands.ts", content: "基于当前光标附近上下文继续创作。" },
    { file: "slashCommands.ts", content: "/描写" },
    { file: "slashCommands.ts", content: "扩展场景细节与氛围描写。" },
    { file: "slashCommands.ts", content: "/对白" },
    { file: "slashCommands.ts", content: "生成角色间自然对话。" },
    { file: "slashCommands.ts", content: "/角色" },
    { file: "slashCommands.ts", content: "补充角色设定与人物动机。" },
    { file: "slashCommands.ts", content: "/大纲" },
    { file: "slashCommands.ts", content: "整理章节结构与叙事节奏。" },
    { file: "slashCommands.ts", content: "/搜索" },
    { file: "slashCommands.ts", content: "检索项目中的相关信息。" },
    { file: "VersionHistoryContainer.tsx", content: "You" },
    { file: "VersionHistoryContainer.tsx", content: "AI" },
    { file: "VersionHistoryContainer.tsx", content: "Auto" },
    { file: "VersionHistoryContainer.tsx", content: "Just now" },
    { file: "VersionHistoryContainer.tsx", content: "Today" },
    { file: "VersionHistoryContainer.tsx", content: "Yesterday" },
    { file: "VersionHistoryContainer.tsx", content: "Earlier" },
    { file: "VersionHistoryContainer.tsx", content: "Loading versions..." },
    { file: "VersionHistoryPanel.tsx", content: "Restore" },
    { file: "VersionHistoryPanel.tsx", content: "Compare" },
    { file: "VersionHistoryPanel.tsx", content: "Preview" },
    { file: "useVersionCompare.ts", content: "No differences found." },
    { file: "useVersionCompare.ts", content: "Unknown error" },
    { file: "AiPanel.tsx", content: " Then restart the app." },
    { file: "AiPanel.tsx", content: "AI" },
  ];

  let scanResults: NakedStringEntry[];

  // Run the scan once before all tests
  it("should execute scan successfully", () => {
    scanResults = runScan({
      rootDir: RENDERER_SRC,
      basePath: DESKTOP_ROOT,
    });
    expect(scanResults.length).toBeGreaterThan(0);
  });

  it("should cover all known naked strings from §三", () => {
    const uncovered: { file: string; content: string }[] = [];

    for (const known of knownNakedStrings) {
      const found = scanResults.some(
        (r) =>
          r.filePath.includes(known.file) &&
          r.rawString.includes(known.content.trim()),
      );
      if (!found) {
        uncovered.push(known);
      }
    }

    expect(uncovered).toEqual([]);
  });

  it("should have zero uncovered items", () => {
    let uncoveredCount = 0;
    for (const known of knownNakedStrings) {
      const found = scanResults.some(
        (r) =>
          r.filePath.includes(known.file) &&
          r.rawString.includes(known.content.trim()),
      );
      if (!found) uncoveredCount++;
    }
    expect(uncoveredCount).toBe(0);
  });
});

/* ================================================================== */
/* Task 1.2 — 扫描输出格式测试 (AC-3)                                  */
/* ================================================================== */

describe("AC-3: 扫描输出格式", () => {
  let scanResults: NakedStringEntry[];

  it("should produce results with all six required fields", () => {
    scanResults = runScan({
      rootDir: RENDERER_SRC,
      basePath: DESKTOP_ROOT,
    });

    for (const entry of scanResults.slice(0, 50)) {
      expect(entry).toHaveProperty("module");
      expect(entry).toHaveProperty("filePath");
      expect(entry).toHaveProperty("line");
      expect(entry).toHaveProperty("rawString");
      expect(entry).toHaveProperty("suggestedKey");
      expect(entry).toHaveProperty("priority");
    }
  });

  it("should only produce P0 or P1 priority values", () => {
    scanResults = runScan({
      rootDir: RENDERER_SRC,
      basePath: DESKTOP_ROOT,
    });

    const invalidPriorities = scanResults.filter(
      (e) => e.priority !== "P0" && e.priority !== "P1",
    );
    expect(invalidPriorities).toEqual([]);
  });

  it("should assign valid module names", () => {
    scanResults = runScan({
      rootDir: RENDERER_SRC,
      basePath: DESKTOP_ROOT,
    });

    const validModules = new Set([
      "editor", "ai-service", "version-control", "search", "settings",
      "export", "diff", "outline", "knowledge-graph", "character",
      "onboarding", "dashboard", "shortcuts", "command-palette",
      "files", "memory", "projects", "analytics", "quality-gates",
      "zen-mode", "components", "stores", "hooks", "lib", "services",
      "workbench",
    ]);

    const invalidModules = scanResults.filter(
      (e) => !validModules.has(e.module),
    );
    expect(invalidModules).toEqual([]);
  });
});

/* ================================================================== */
/* Task 1.3 — 排除规则测试 (AC-4)                                      */
/* ================================================================== */

describe("AC-4: 排除规则", () => {
  it("should exclude Tailwind class strings", () => {
    expect(isCssClassName("flex items-center")).toBe(true);
    expect(isCssClassName("bg-[var(--color-bg-raised)]")).toBe(true);
    expect(isCssClassName("rounded-[var(--radius-md)]")).toBe(true);
    expect(isCssClassName("p-1")).toBe(true);
    expect(isCssClassName("text-sm")).toBe(true);
    expect(isCssClassName("shadow-[var(--shadow-lg)]")).toBe(true);
    expect(isCssClassName("data-[state=closed]:fade-out-0")).toBe(true);
    expect(isCssClassName("-translate-y-1/2")).toBe(true);
  });

  it("should not exclude user-visible text", () => {
    expect(isCssClassName("Entity suggestions unavailable.")).toBe(false);
    expect(isCssClassName("Loading versions...")).toBe(false);
    expect(isCssClassName("This is a sentence")).toBe(false);
  });

  it("should exclude console.log strings", () => {
    const code = `console.log("debug info: loading failed");`;
    const results = scanFileContent(code, "test.tsx");
    expect(results).toEqual([]);
  });

  it("should exclude strings in test files ", () => {
    const testFiles = collectSourceFiles(RENDERER_SRC);
    const hasTestFiles = testFiles.some(
      (f) => f.includes(".test.") || f.includes(".spec."),
    );
    expect(hasTestFiles).toBe(false);
  });

  it("should exclude import/require paths", () => {
    const code = `import { Button } from "../../components/primitives";`;
    const results = scanFileContent(code, "test.tsx");
    expect(results).toEqual([]);
  });

  it("should exclude type definitions", () => {
    const code = `type Severity = "error" | "warning" | "info";`;
    const results = scanFileContent(code, "test.tsx");
    expect(results).toEqual([]);
  });

  it("should exclude i18n t() wrapped strings", () => {
    const code = `<span>{t("workbench.title")}</span>`;
    const results = scanFileContent(code, "test.tsx");
    expect(results).toEqual([]);
  });

  it("should exclude technical constants", () => {
    expect(isTechnicalConstant("service_error")).toBe(true);
    expect(isTechnicalConstant("rate_limit")).toBe(true);
    expect(isTechnicalConstant("auto-save")).toBe(true);
    expect(isTechnicalConstant("STORAGE_KEY")).toBe(true);
    expect(isTechnicalConstant("version:snapshot:diff")).toBe(true);
    expect(isTechnicalConstant("#ff0000")).toBe(true);
    expect(isTechnicalConstant("var(--color-bg)")).toBe(true);
    expect(isTechnicalConstant("workbench.iconBar.files")).toBe(true);
    expect(isTechnicalConstant("https://example.com")).toBe(true);
    expect(isTechnicalConstant("2-digit")).toBe(true);
    expect(isTechnicalConstant("--editor-line-height")).toBe(true);
    expect(isTechnicalConstant("pnpm -C apps/desktop rebuild:native")).toBe(true);
    expect(isTechnicalConstant("\\u00A0")).toBe(true);
    expect(isTechnicalConstant("${lineIndex}")).toBe(true);
  });

  it("should not exclude user-visible text as technical constants", () => {
    expect(isTechnicalConstant("Loading versions...")).toBe(false);
    expect(isTechnicalConstant("Entity suggestions unavailable.")).toBe(false);
    expect(isTechnicalConstant("This document is final")).toBe(false);
    expect(isTechnicalConstant("No differences found.")).toBe(false);
  });

  it("should exclude className attribute values", () => {
    const code = `<div className="flex items-center gap-2">text</div>`;
    const results = scanFileContent(code, "test.tsx");
    const classNames = results.filter(
      (r) => r.rawString === "flex items-center gap-2",
    );
    expect(classNames).toEqual([]);
  });

  it("should exclude non-visible JSX attributes", () => {
    const code = `<Button variant="primary" size="sm" data-testid="test-btn">Click</Button>`;
    const results = scanFileContent(code, "test.tsx");
    const propValues = results.filter(
      (r) =>
        r.rawString === "primary" ||
        r.rawString === "sm" ||
        r.rawString === "test-btn",
    );
    expect(propValues).toEqual([]);
  });

  it("should exclude JSX conditional fragments", () => {
    const code = `<div>{isOpen ? <span>Ready</span> : null}</div>`;
    const results = scanFileContent(code, "test.tsx");
    const fragments = results.filter((r) => r.rawString.includes("null") || r.rawString.includes(") :"));
    expect(fragments).toEqual([]);
  });

  it("should exclude expression fragments that are not user copy", () => {
    const code = `<div>{items.length === 0 ? <span>Empty</span> : props.items.length === 0 ? null : null}</div>`;
    const results = scanFileContent(code, "test.tsx");
    const fragments = results.filter(
      (r) => r.rawString.includes("props.") || r.rawString.includes("===") || r.rawString.includes("&&"),
    );
    expect(fragments).toEqual([]);
  });

  it("should exclude type-signature fragments that leak from code parsing", () => {
    const code = `<div>{formatter as unknown as (value: string): Record<string, string>}</div>`;
    const results = scanFileContent(code, "test.tsx");
    const fragments = results.filter((r) => r.rawString.includes("string): Record"));
    expect(fragments).toEqual([]);
  });
});

/* ================================================================== */
/* PASS / FAIL Fixtures                                                */
/* ================================================================== */

describe("PASS fixtures (should be skipped)", () => {
  const passCases = [
    { desc: "CSS class name", code: `className="flex items-center"` },
    { desc: "console.log", code: `console.log("Server started on port 3000")` },
    { desc: "import path", code: `import { foo } from "./utils/bar"` },
    { desc: "type def", code: `type Mode = "light" | "dark"` },
    { desc: "i18n wrapped", code: `t("workbench.save")` },
    { desc: "data-testid", code: `data-testid="my-component"` },
    { desc: "IPC channel", code: `invoke("version:snapshot:diff", {})` },
    { desc: "color hex", code: `color="#ff0000"` },
    { desc: "number", code: `width="100"` },
    { desc: "pure punctuation", code: `separator="---"` },
    { desc: "Tailwind single", code: `"rounded-[var(--radius-md)]"` },
  ];

  for (const tc of passCases) {
    it(`should skip: ${tc.desc}`, () => {
      const results = scanFileContent(tc.code, "fixture.tsx");
      expect(results.length).toBe(0);
    });
  }
});

describe("FAIL fixtures (should be detected)", () => {
  const failCases = [
    {
      desc: "naked title attribute",
      code: `<Panel title="AI">content</Panel>`,
      expectedString: "AI",
    },
    {
      desc: "naked tooltip content",
      code: `<Tooltip content="Restore">icon</Tooltip>`,
      expectedString: "Restore",
    },
    {
      desc: "naked JSX text",
      code: `<span>Loading versions...</span>`,
      expectedString: "Loading versions...",
    },
    {
      desc: "naked placeholder",
      code: `<input placeholder="Enter your name" />`,
      expectedString: "Enter your name",
    },
    {
      desc: "naked error message in .ts file",
      code: `message: "Entity suggestions unavailable."`,
      expectedTsString: "Entity suggestions unavailable.",
    },
    {
      desc: "naked label in object literal",
      code: `label: "/续写"`,
      expectedTsString: "/续写",
    },
  ];

  for (const tc of failCases) {
    it(`should detect: ${tc.desc}`, () => {
      if (tc.expectedString) {
        const results = scanFileContent(tc.code, "fixture.tsx");
        const found = results.some((r) =>
          r.rawString.includes(tc.expectedString!),
        );
        expect(found).toBe(true);
      }
      if (tc.expectedTsString) {
        const results = scanFileContent(tc.code, "fixture.ts");
        const found = results.some((r) =>
          r.rawString.includes(tc.expectedTsString!),
        );
        expect(found).toBe(true);
      }
    });
  }
});

/* ================================================================== */
/* Task 1.4 — 只读约束测试 (AC-6)                                      */
/* ================================================================== */

describe("AC-6: 只读约束（扫描不修改源码）", () => {
  function hashDir(dir: string): Map<string, string> {
    const hashes = new Map<string, string>();

    function walk(d: string): void {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          walk(full);
          continue;
        }
        if (entry.isFile()) {
          const content = readFileSync(full);
          const hash = createHash("sha256").update(content).digest("hex");
          hashes.set(path.relative(RENDERER_SRC, full), hash);
        }
      }
    }

    walk(dir);
    return hashes;
  }

  it("should not modify any files in renderer/src/", () => {
    const beforeHashes = hashDir(RENDERER_SRC);

    // Run the scan
    runScan({ rootDir: RENDERER_SRC, basePath: DESKTOP_ROOT });

    const afterHashes = hashDir(RENDERER_SRC);

    // Compare
    for (const [file, hash] of beforeHashes) {
      expect(afterHashes.get(file)).toBe(hash);
    }
    expect(afterHashes.size).toBe(beforeHashes.size);
  });
});

/* ================================================================== */
/* Module classification tests                                         */
/* ================================================================== */

describe("Module classification", () => {
  it("should classify editor files correctly", () => {
    expect(classifyModule("renderer/src/features/editor/EditorPane.tsx")).toBe(
      "editor",
    );
  });

  it("should classify AI files correctly", () => {
    expect(classifyModule("renderer/src/features/ai/AiPanel.tsx")).toBe(
      "ai-service",
    );
  });

  it("should classify version-history files correctly", () => {
    expect(
      classifyModule(
        "renderer/src/features/version-history/VersionHistoryPanel.tsx",
      ),
    ).toBe("version-control");
  });

  it("should classify settings files correctly", () => {
    expect(
      classifyModule("renderer/src/features/settings-dialog/SettingsDialog.tsx"),
    ).toBe("settings");
  });

  it("should fallback to workbench for unknown paths", () => {
    expect(classifyModule("renderer/src/App.tsx")).toBe("workbench");
  });
});

describe("Priority classification", () => {
  it("should mark editor as P0", () => {
    expect(classifyPriority("renderer/src/features/editor/EditorPane.tsx")).toBe(
      "P0",
    );
  });

  it("should mark version-history as P0", () => {
    expect(
      classifyPriority("renderer/src/features/version-history/VersionHistoryPanel.tsx"),
    ).toBe("P0");
  });

  it("should mark settings as P1", () => {
    expect(
      classifyPriority("renderer/src/features/settings-dialog/SettingsDialog.tsx"),
    ).toBe("P1");
  });
});
