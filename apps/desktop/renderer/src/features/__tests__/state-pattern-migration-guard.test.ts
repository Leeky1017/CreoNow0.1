import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(CURRENT_DIR, "..");

/**
 * AC-9/10/11 全量迁移门禁：Features 层不得存在碎片化空/加载/错误状态实现。
 *
 * 该门禁扫描 features/ 下所有 .tsx 文件，检测以下反模式：
 * - 直接导入 composites/EmptyState（应使用 patterns/EmptyState）
 * - 非 Pattern 组件的 inline 状态渲染（纯文字型 empty/loading 占位）
 *
 * 排除清单（含技术理由）见 DOMAIN_EXCLUSIONS。
 */

/**
 * 领域专用排除清单。
 *
 * 每条排除必须有「为什么 patterns/* 组件无法覆盖此场景」的说明。
 * 新增排除须经 Owner 审批。
 */
const DOMAIN_EXCLUSIONS: Record<string, string> = {
  // DashboardEmptyState 融合了 IpcError 错误 banner + 空态双 CTA（新建+打开文件夹）,
  // patterns/EmptyState 没有 error-alert slot，无法一对一替换
  "dashboard/DashboardEmptyState.tsx":
    "Hybrid empty+error component with IpcError banner; patterns/EmptyState lacks error-alert slot",

  // AI Panel 空闲提示：单行 <Text> 占位，不需要 illustration/heading/action 的完整空态
  "ai/AiPanel.tsx":
    "Single-line chat idle hint; full EmptyState pattern would over-engineer",

  // ErrorGuideCard：带步骤引导、可复制命令的排错卡片，超出 patterns/ErrorState 能力
  "ai/AiPanel.tsx:ErrorGuideCard":
    "Guided error resolution with remediation steps and copyable commands",

  // AiNotConfiguredGuide：40 行 Card 引导组件，已用 Card variant='raised' 包裹
  "ai/AiNotConfiguredGuide.tsx":
    "Compact guidance card using Card variant='raised'; low ROI migration",

  // Settings 表单级 inline 错误反馈（非 pattern 级状态）
  "settings/AiSettingsSection.tsx":
    "Form-level inline validation feedback, not a state pattern",
  "settings/JudgeSection.tsx":
    "Form-level inline validation feedback, not a state pattern",
};

/**
 * 递归收集 features/ 下所有 .tsx 源文件（跳过测试、stories、__tests__）
 */
function collectFeatureTsx(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...collectFeatureTsx(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      if (
        entry.name.endsWith(".test.tsx") ||
        entry.name.endsWith(".stories.tsx")
      ) {
        continue;
      }
      results.push(fullPath);
    }
  }
  return results;
}

function getRelativePath(filePath: string): string {
  return path.relative(FEATURES_DIR, filePath);
}

function isExcluded(relPath: string): boolean {
  return Object.keys(DOMAIN_EXCLUSIONS).some(
    (excl) => relPath === excl || relPath.startsWith(excl.split(":")[0]),
  );
}

describe("state-pattern-migration-guard (AC-9/10/11)", () => {
  const files = collectFeatureTsx(FEATURES_DIR);

  it("features/ 目录下存在可扫描的 .tsx 文件", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("AC-9: 无碎片化 composites/EmptyState 导入（应使用 patterns/EmptyState）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const relPath = getRelativePath(file);
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(file, "utf8");
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("composites/EmptyState")) {
          violations.push({ file: relPath, line: i + 1, text: lines[i].trim() });
        }
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line} → ${v.text}`)
        .join("\n");
      expect.fail(
        `AC-9 violation: ${violations.length} file(s) still import composites/EmptyState (should use patterns/EmptyState):\n${report}`,
      );
    }
  });

  it("AC-10: 无碎片化 composites/LoadingState 导入（应使用 patterns/LoadingState）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const relPath = getRelativePath(file);
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(file, "utf8");
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("composites/LoadingState")) {
          violations.push({ file: relPath, line: i + 1, text: lines[i].trim() });
        }
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line} → ${v.text}`)
        .join("\n");
      expect.fail(
        `AC-10 violation: ${violations.length} file(s) still import composites/LoadingState:\n${report}`,
      );
    }
  });

  it("AC-11: 无碎片化 composites/ErrorState 导入（应使用 patterns/ErrorState）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      const relPath = getRelativePath(file);
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(file, "utf8");
      const lines = source.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("composites/ErrorState")) {
          violations.push({ file: relPath, line: i + 1, text: lines[i].trim() });
        }
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  ${v.file}:${v.line} → ${v.text}`)
        .join("\n");
      expect.fail(
        `AC-11 violation: ${violations.length} file(s) still import composites/ErrorState:\n${report}`,
      );
    }
  });

  it("排除清单中每个条目都有对应的文件", () => {
    const exclusionFiles = Object.keys(DOMAIN_EXCLUSIONS).map(
      (key) => key.split(":")[0],
    );
    const uniqueFiles = [...new Set(exclusionFiles)];
    for (const excl of uniqueFiles) {
      const fullPath = path.join(FEATURES_DIR, excl);
      expect(
        fs.existsSync(fullPath),
        `排除清单中 '${excl}' 对应的文件不存在，请移除过期排除项`,
      ).toBe(true);
    }
  });
});
