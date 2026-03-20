/**
 * AI 面板视觉 Token 守卫测试
 *
 * AC-8:  AI 回复消息左侧 accent 边框
 * AC-9:  代码块 monospace 字体
 * AC-12: ErrorGuideCard 严重等级边框颜色
 * AC-19: 所有新增视觉使用 Design Token
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

function readAiFile(filename: string): string {
  const dir = resolveAiDir();
  const path = resolve(dir, filename);
  if (!existsSync(path)) throw new Error(`File not found: ${filename}`);
  return readFileSync(path, "utf8");
}

describe("AI panel visual token guards", () => {
  describe("AC-8: AI reply accent border", () => {
    it("AiMessageList uses --color-accent for AI message border", () => {
      const source = readAiFile("AiMessageList.tsx");
      expect(source).toMatch(/--color-accent/);
      // Should have 2px left border for AI messages
      expect(source).toMatch(/border-l-2|border-left.*2px/);
    });
  });

  describe("AC-9: code block monospace font", () => {
    it("CodeBlock uses --font-family-mono token", () => {
      // CodeBlock may be in AiPanel.tsx or extracted to its own file
      const possibleFiles = ["CodeBlock.tsx", "AiPanel.tsx"];
      let source = "";
      for (const file of possibleFiles) {
        try {
          source = readAiFile(file);
          if (source.includes("CodeBlock")) break;
        } catch {
          continue;
        }
      }
      expect(source).toMatch(/--font-family-mono|font-mono/);
    });
  });

  describe("AC-12: ErrorGuideCard severity colors", () => {
    const errorGuideFiles = ["ErrorGuideCard.tsx", "AiMessageList.tsx", "AiPanel.tsx"];

    function readErrorGuideSource(): string {
      let source = "";
      for (const file of errorGuideFiles) {
        try {
          source = readAiFile(file);
          if (source.includes("ErrorGuideCard")) break;
        } catch {
          continue;
        }
      }
      return source;
    }

    it("ErrorGuideCard supports error severity with --color-error", () => {
      expect(readErrorGuideSource()).toMatch(/--color-error/);
    });

    it("ErrorGuideCard supports warning severity with --color-warning", () => {
      expect(readErrorGuideSource()).toMatch(/--color-warning/);
    });

    it("ErrorGuideCard supports info severity with --color-info", () => {
      expect(readErrorGuideSource()).toMatch(/--color-info/);
    });

    it("ErrorGuideCard accepts severity prop", () => {
      expect(readErrorGuideSource()).toMatch(/severity.*('error'|'warning'|'info'|"error"|"warning"|"info")/);
    });
  });

  describe("AC-19: no new arbitrary color values", () => {
    it("AiEmptyState uses only token-based styles", () => {
      const source = readAiFile("AiEmptyState.tsx");
      // No arbitrary hex colors (e.g. #xxx or rgb())
      const hexMatches = source.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
      // Filter out comment-only or string-only hex values
      expect(hexMatches.length).toBe(0);
    });

    it("AiUsageStats uses only token-based styles", () => {
      const source = readAiFile("AiUsageStats.tsx");
      const hexMatches = source.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
      expect(hexMatches.length).toBe(0);
    });

    it("AiPanelTabBar uses only token-based styles", () => {
      const source = readAiFile("AiPanelTabBar.tsx");
      const hexMatches = source.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
      expect(hexMatches.length).toBe(0);
    });
  });
});
