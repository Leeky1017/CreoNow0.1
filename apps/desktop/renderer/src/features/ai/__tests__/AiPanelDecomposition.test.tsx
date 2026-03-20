/**
 * AiPanel 拆分守卫测试
 *
 * AC-1: AiPanel.tsx ≤ 300 行
 * AC-2+: 子组件文件存在
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const AI_DIR_CANDIDATES = [
  resolve(process.cwd(), "renderer/src/features/ai"),
  resolve(process.cwd(), "apps/desktop/renderer/src/features/ai"),
];

function resolveAiDir(): string {
  const dir = AI_DIR_CANDIDATES.find((d) => existsSync(d));
  if (!dir) throw new Error("Unable to resolve AI feature directory");
  return dir;
}

function countLines(filename: string): number {
  const dir = resolveAiDir();
  const content = readFileSync(resolve(dir, filename), "utf8");
  return content.endsWith("\n")
    ? content.split("\n").length - 1
    : content.split("\n").length;
}

function fileExists(filename: string): boolean {
  const dir = resolveAiDir();
  return existsSync(resolve(dir, filename));
}

describe("AiPanel decomposition guard", () => {
  describe("AC-1: AiPanel.tsx ≤ 300 lines", () => {
    it("AiPanel.tsx should be ≤ 300 lines after decomposition", () => {
      const lines = countLines("AiPanel.tsx");
      expect(lines).toBeLessThanOrEqual(300);
    });
  });

  describe("AC-2/3/4/5/6/7: sub-component files exist", () => {
    it("AiPanelTabBar.tsx exists", () => {
      expect(fileExists("AiPanelTabBar.tsx")).toBe(true);
    });

    it("AiMessageList.tsx exists", () => {
      expect(fileExists("AiMessageList.tsx")).toBe(true);
    });

    it("AiInputArea.tsx exists as a separate file", () => {
      expect(fileExists("AiInputArea.tsx")).toBe(true);
    });

    it("AiProposalView.tsx exists as a separate file", () => {
      expect(fileExists("AiProposalView.tsx")).toBe(true);
    });

    it("AiEmptyState.tsx exists", () => {
      expect(fileExists("AiEmptyState.tsx")).toBe(true);
    });

    it("AiUsageStats.tsx exists", () => {
      expect(fileExists("AiUsageStats.tsx")).toBe(true);
    });
  });
});
