/**
 * A0-21 错误展示组件收口 — 全局泄露检测测试
 *
 * 扫描 renderer 源码目录，确保无 error.code / error.message 直接渲染模式，
 * 也无 ACTION_FAILED / NO_PROJECT 硬编码字符串。
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const RENDERER_SRC = path.resolve(__dirname, "..");

/** 排除的文件 — errorMessages.ts 本身、测试文件及 ErrorBoundary（框架组件） */
function shouldSkip(filePath: string): boolean {
  const base = path.basename(filePath);
  if (base === "errorMessages.ts" || base === "errorMessages.test.ts") return true;
  if (/\.test\.\w+$/u.test(base) || /\.spec\.\w+$/u.test(base)) return true;
  if (base === "ipc-generated.ts" || base === "ipc-contract.ts") return true;
  // ErrorBoundary 使用 JS Error.name / Error.message，非 IPC 错误码
  if (base === "ErrorBoundary.tsx" || base === "RegionErrorBoundary.tsx") return true;
  return false;
}

/** 递归收集 .ts / .tsx 文件 */
function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, acc);
    } else if (/\.tsx?$/u.test(entry.name) && !shouldSkip(full)) {
      acc.push(full);
    }
  }
  return acc;
}

const JSX_DIRECT_RENDER_PATTERNS = [
  /\{\s*\w*[Ee]rror\.\s*code\s*\}/u,
  /\{\s*\w*[Ee]rror\.\s*message\s*\}/u,
  /\{\s*state\.\w*[Ee]rror\.\s*code\s*\}/u,
  /\{\s*state\.\w*[Ee]rror\.\s*message\s*\}/u,
  /\{\s*last[Ee]rror\.\s*code\s*\}/u,
  /\{\s*last[Ee]rror\.\s*message\s*\}/u,
  /\{\s*props\.\w*[Ee]rror\.\s*code\s*\}/u,
  /\{\s*props\.\w*[Ee]rror\.\s*message\s*\}/u,
  /\{\s*\w*[Ee]rror\.\s*errorCode\s*\}/u,
];

const TEMPLATE_STRING_PATTERNS = [
  /`[^`]*\$\{[^}]*\.error\.code\}[^`]*`/u,
  /`[^`]*\$\{[^}]*\.error\.message\}[^`]*`/u,
  /`[^`]*\$\{[^}]*error\.code\}[^`]*`/u,
  /`[^`]*\$\{[^}]*error\.message\}[^`]*`/u,
];

const HARDCODED_ERROR_STRINGS = [
  /"ACTION_FAILED:/u,
  /"NO_PROJECT:/u,
];

describe("A0-21 错误展示收口 — 全局泄露检测", () => {
  const files = collectFiles(RENDERER_SRC);

  it("renderer 源码中无 JSX 直接渲染 error.code / error.message 模式", () => {
    const violations: string[] = [];

    for (const file of files) {
      if (!file.endsWith(".tsx")) continue;
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of JSX_DIRECT_RENDER_PATTERNS) {
          if (pattern.test(line)) {
            const rel = path.relative(RENDERER_SRC, file);
            violations.push(`${rel}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("renderer 源码中无模板字符串拼接 error.code / error.message 模式", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of TEMPLATE_STRING_PATTERNS) {
          if (pattern.test(line)) {
            const rel = path.relative(RENDERER_SRC, file);
            violations.push(`${rel}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("renderer 源码中无 ACTION_FAILED: / NO_PROJECT: 硬编码字符串", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of HARDCODED_ERROR_STRINGS) {
          if (pattern.test(line)) {
            const rel = path.relative(RENDERER_SRC, file);
            violations.push(`${rel}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
