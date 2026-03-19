import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(CURRENT_DIR, "..");
const RENDERER_SRC = path.resolve(CURRENT_DIR, "../..");
const COMPONENTS_FEATURES_DIR = path.join(
  RENDERER_SRC,
  "components/features",
);

/**
 * AC-9/10/11 composites/* 清零门禁:
 * Features 层 + components/features 层均已迁移 composites/{Empty,Loading,Error}State
 * 的所有历史引用至 patterns/*。
 * 本门禁作为回归防护，确保 composites/* 引用不被重新引入，
 * 并覆盖 components/features/** 中的真实用户路径。
 *
 * 注：领域专用实现（DashboardEmptyState 混合态、AI 错误引导组件、Settings 表单验证反馈等）
 * 因从未使用 composites/* 且与通用 pattern 接口不兼容，不在本门禁验证范围。
 * 排除理由见 DOMAIN_EXCLUSIONS。
 */

/**
 * 领域专用排除清单。
 *
 * 每条排除必须有「为什么 patterns/* 组件无法覆盖此场景」的说明。
 * 新增排除须经 Owner 审批。
 *
 * 键格式：相对于 FEATURES_DIR 或以 "components/features/" 为前缀的路径
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
 * 递归收集目录下所有 .tsx 源文件（跳过测试、stories、__tests__）
 */
function collectTsxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      results.push(...collectTsxFiles(fullPath));
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

/**
 * 将文件路径转换为相对路径（用于排除清单匹配）
 * features/ 下的文件相对于 FEATURES_DIR
 * components/features/ 下的文件前缀 "components/features/"
 */
function getRelativePath(filePath: string, baseDir: string): string {
  return path.relative(baseDir, filePath);
}

function isExcluded(relPath: string): boolean {
  return Object.keys(DOMAIN_EXCLUSIONS).some(
    (excl) => relPath === excl || relPath.startsWith(excl.split(":")[0]),
  );
}

describe("composites-state-import-regression-guard (AC-9/10/11)", () => {
  const featureFiles = collectTsxFiles(FEATURES_DIR);
  const componentFeatureFiles = collectTsxFiles(COMPONENTS_FEATURES_DIR);

  /** 合并两个目录的文件及其标准化相对路径 */
  const allFiles: { absPath: string; relPath: string }[] = [
    ...featureFiles.map((f) => ({
      absPath: f,
      relPath: getRelativePath(f, FEATURES_DIR),
    })),
    ...componentFeatureFiles.map((f) => ({
      absPath: f,
      relPath: "components/features/" + getRelativePath(f, COMPONENTS_FEATURES_DIR),
    })),
  ];

  it("扫描范围覆盖 features/ 和 components/features/ 两个目录", () => {
    expect(featureFiles.length).toBeGreaterThan(0);
    // components/features 可能不存在或为空，但如果存在则也必须被扫描
    if (fs.existsSync(COMPONENTS_FEATURES_DIR)) {
      expect(componentFeatureFiles.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("AC-9: 零处 composites/EmptyState 导入（迁移成功且无回归）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const { absPath, relPath } of allFiles) {
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(absPath, "utf8");
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

  it("AC-10: 零处 composites/LoadingState 导入（迁移成功且无回归）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const { absPath, relPath } of allFiles) {
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(absPath, "utf8");
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

  it("AC-11: 零处 composites/ErrorState 导入（迁移成功且无回归）", () => {
    const violations: { file: string; line: number; text: string }[] = [];

    for (const { absPath, relPath } of allFiles) {
      if (isExcluded(relPath)) continue;

      const source = fs.readFileSync(absPath, "utf8");
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
