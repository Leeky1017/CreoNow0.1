import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * V1-19 Accessibility Guard Tests
 *
 * Guard 测试：验证关键组件包含必要的无障碍标记和键盘导航支持。
 * 这些是代码约束检查（Guard），确保 ARIA 属性不会被意外移除。
 */
describe("V1-19 Accessibility Guard", () => {
  // --- Phase 1: 语义化标记 ---

  it("FileTreePanel 包含 tree role 和 aria-label", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../features/files/FileTreePanel.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain('role="tree"');
    expect(content).toContain("aria-label");
  });

  it("FileTreeNodeRow 包含 treeitem role 和 aria-expanded/aria-level", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../features/files/FileTreeNodeRow.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain('role="treeitem"');
    expect(content).toContain("aria-expanded");
    expect(content).toContain("aria-level");
  });

  it("OutlinePanel 包含 tree role", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../features/outline/OutlinePanel.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain('role="tree"');
  });

  it("AI 消息区域包含 aria-live region 和 role log", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../features/ai/AiMessageList.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain("aria-live");
    expect(content).toContain('role="log"');
  });

  // --- Phase 2: 键盘导航 ---

  it("FileTreePanel 支持键盘导航", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../features/files/useFileTreeKeyboard.ts",
      ),
      "utf-8",
    );
    expect(content).toContain("handleTreeKeyDown");
    expect(content).toContain("ArrowUp");
    expect(content).toContain("ArrowDown");
    expect(content).toContain("Home");
    expect(content).toContain("End");
  });

  it("LayoutShell 包含 skip-to-content 链接", () => {
    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        "../components/layout/LayoutShell.tsx",
      ),
      "utf-8",
    );
    expect(content).toContain("skip");
    expect(content).toContain("main-content");
  });

  // --- Phase 3: 高对比模式 ---

  it("样式包含 prefers-contrast 媒体查询", () => {
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    const tokensCss = fs.readFileSync(
      path.resolve(__dirname, "../../../../../design/system/01-tokens.css"),
      "utf-8",
    );
    const combined = mainCss + tokensCss;
    expect(combined).toContain("prefers-contrast");
  });

  it("样式包含 forced-colors 支持", () => {
    const mainCss = fs.readFileSync(
      path.resolve(__dirname, "../styles/main.css"),
      "utf-8",
    );
    const tokensCss = fs.readFileSync(
      path.resolve(__dirname, "../../../../../design/system/01-tokens.css"),
      "utf-8",
    );
    const combined = mainCss + tokensCss;
    expect(combined).toContain("forced-colors");
  });
});
