import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import en from "../locales/en.json";
import zhCN from "../locales/zh-CN.json";

// ─── helpers ───

interface LocaleNode {
  [key: string]: LocaleNode | string;
}

function flattenEntries(
  node: LocaleNode,
  prefix = "",
): Array<[string, string]> {
  return Object.entries(node).flatMap(([key, value]) => {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[p, value] as [string, string]];
    return flattenEntries(value as LocaleNode, p);
  });
}

// ─── tests ───

describe("A0-22: i18n error copy cleanup", () => {
  // ── export.error.noProject ──

  it("zh-CN export.error.noProject has no technical prefix", () => {
    expect((zhCN as LocaleNode).export).toBeDefined();
    const val = ((zhCN as LocaleNode).export as LocaleNode).error as LocaleNode;
    expect(val.noProject).toBe("请先打开一个项目");
  });

  it("en export.error.noProject has no technical prefix", () => {
    const val = ((en as LocaleNode).export as LocaleNode).error as LocaleNode;
    expect(val.noProject).toBe("Please open a project first");
  });

  // ── rightPanel.quality.errorWithCode ──

  it("zh-CN rightPanel.quality.errorWithCode has no {{code}} interpolation", () => {
    const val = ((zhCN as LocaleNode).rightPanel as LocaleNode)
      .quality as LocaleNode;
    expect(val.errorWithCode).toBe("质量检测遇到问题");
  });

  it("en rightPanel.quality.errorWithCode has no {{code}} interpolation", () => {
    const val = ((en as LocaleNode).rightPanel as LocaleNode)
      .quality as LocaleNode;
    expect(val.errorWithCode).toBe("Quality check encountered an issue");
  });

  // ── full scan: no technical error code prefixes ──

  it("no locale value starts with UPPER_SNAKE_CASE: prefix", () => {
    const pattern = /^[A-Z][A-Z_]{2,}:\s/;
    const violations: string[] = [];

    for (const [label, entries] of [
      ["en", flattenEntries(en as LocaleNode)],
      ["zh-CN", flattenEntries(zhCN as LocaleNode)],
    ] as const) {
      for (const [key, value] of entries) {
        if (pattern.test(value)) {
          violations.push(`[${label}] ${key} = ${value}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  // ── full scan: no {{code}} / {{errorCode}} in error contexts ──

  it("no locale value contains {{code}} or {{errorCode}}", () => {
    const violations: string[] = [];

    for (const [label, entries] of [
      ["en", flattenEntries(en as LocaleNode)],
      ["zh-CN", flattenEntries(zhCN as LocaleNode)],
    ] as const) {
      for (const [key, value] of entries) {
        if (value.includes("{{code}}") || value.includes("{{errorCode}}")) {
          violations.push(`[${label}] ${key} = ${value}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  // ── no call site passes { code: ... } to errorWithCode ──

  it("no source file passes { code: ... } to t('rightPanel.quality.errorWithCode')", () => {
    const srcDir = path.resolve(__dirname, "../../");
    const violations: string[] = [];

    function scanDir(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules") {
          scanDir(full);
        } else if (
          /\.(ts|tsx)$/.test(entry.name) &&
          !entry.name.endsWith(".test.ts") &&
          !entry.name.endsWith(".test.tsx")
        ) {
          const content = fs.readFileSync(full, "utf-8");
          if (
            content.includes("errorWithCode") &&
            /errorWithCode['"]?\s*,\s*\{/.test(content)
          ) {
            violations.push(path.relative(srcDir, full));
          }
        }
      }
    }

    scanDir(srcDir);
    expect(violations).toEqual([]);
  });

  it("CommandPalette source no longer contains ACTION_FAILED / NO_PROJECT raw codes", () => {
    const commandPalettePath = path.resolve(
      __dirname,
      "../../features/commandPalette/CommandPalette.tsx",
    );
    const content = fs.readFileSync(commandPalettePath, "utf-8");
    expect(content).not.toContain("ACTION_FAILED:");
    expect(content).not.toContain("NO_PROJECT:");
  });
});
