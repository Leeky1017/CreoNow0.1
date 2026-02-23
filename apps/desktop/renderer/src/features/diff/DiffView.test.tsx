import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffView, parseDiffLines } from "./DiffView";

describe("DiffView", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 DiffView 组件", () => {
      render(<DiffView diffText="test diff" />);

      const panel = screen.getByTestId("ai-diff");
      expect(panel).toBeInTheDocument();
    });

    it("应该显示 diff 文本", () => {
      const diffText = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 Line 1
-Old line
+New line
 Line 3`;

      render(<DiffView diffText={diffText} />);

      expect(screen.getByText("Line 1")).toBeInTheDocument();
      expect(screen.getByText("Old line")).toBeInTheDocument();
      expect(screen.getByText("New line")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 空状态测试
  // ===========================================================================
  describe("空状态", () => {
    it("空 diffText 时应渲染空容器", () => {
      render(<DiffView diffText="" />);

      const panel = screen.getByTestId("ai-diff");
      expect(panel).toBeInTheDocument();
    });

    it("空 diffText 时应显示无变化提示", () => {
      render(<DiffView diffText="" />);

      expect(screen.getByText("No changes to display")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 长文本测试
  // ===========================================================================
  describe("长文本", () => {
    it("应该正确显示长 diff", () => {
      const diffText = `@@ -1,5 +1,5 @@
 First line
 Second line
-Old content
+New content
 Fourth line
 Last line`;

      render(<DiffView diffText={diffText} />);

      expect(screen.getByText("First line")).toBeInTheDocument();
      expect(screen.getByText("Last line")).toBeInTheDocument();
    });

    it("容器应该有 overflow 限制", () => {
      const diffText = `@@ -1,3 +1,3 @@
Context
-Old
+New`;

      render(<DiffView diffText={diffText} />);

      // 外层容器有 max-h 和 overflow-hidden
      const panel = screen.getByTestId("ai-diff").parentElement;
      expect(panel).toHaveClass("max-h-[300px]");
      expect(panel).toHaveClass("overflow-hidden");
    });

    it("[ED-SCROLL-02] Diff 内容滚动区域应由 ScrollArea viewport 承载", () => {
      const diffText = `@@ -1,2 +1,2 @@
-old
+new`;

      render(<DiffView diffText={diffText} />);

      expect(screen.getByTestId("ai-diff-scroll-viewport")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("空状态时应该有边框和圆角", () => {
      render(<DiffView diffText="" />);

      const panel = screen.getByTestId("ai-diff");
      expect(panel).toHaveClass("border");
      expect(panel.className).toContain("rounded");
    });

    it("空状态时应该有 padding", () => {
      render(<DiffView diffText="" />);

      const panel = screen.getByTestId("ai-diff");
      expect(panel).toHaveClass("p-2.5");
    });

    it("有内容时内层应该使用代码字体", () => {
      const diffText = `@@ -1 +1 @@
-old
+new`;
      render(<DiffView diffText={diffText} />);

      // 内层 UnifiedDiffView 有代码字体
      const panel = screen.getByTestId("ai-diff");
      expect(panel.className).toContain("font-[var(--font-family-mono)]");
    });

    it("行内容应该保留空白和可断行", () => {
      const diffText = `@@ -1 +1 @@
 test content`;
      render(<DiffView diffText={diffText} />);

      // 行内容使用 whitespace-pre-wrap 和 break-words
      const contentElements = document.querySelectorAll(
        "[class*='whitespace-pre-wrap']",
      );
      expect(contentElements.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 特殊字符测试
  // ===========================================================================
  describe("特殊字符", () => {
    it("应该正确显示特殊字符", () => {
      const specialDiff = `@@ -1 +1 @@
-<div class="old">Hello</div>
+<div class="new">Hello</div>`;

      render(<DiffView diffText={specialDiff} />);

      // 查找包含 Hello 的元素
      const container = screen.getByTestId("ai-diff");
      expect(container.textContent).toContain("Hello");
    });
  });

  // ===========================================================================
  // parseDiffLines 函数测试
  // ===========================================================================
  describe("parseDiffLines", () => {
    it("应该正确解析 diff header", () => {
      const diffText = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 Context`;

      const { lines } = parseDiffLines(diffText);

      // 应该有 4 行（2 个文件头 + 1 个 hunk 头 + 1 个 context）
      expect(lines).toHaveLength(4);
      expect(lines[0].type).toBe("header");
      expect(lines[1].type).toBe("header");
      expect(lines[2].type).toBe("header");
      expect(lines[3].type).toBe("context");
    });

    it("应该正确统计添加和删除行数", () => {
      const diffText = `@@ -1,3 +1,4 @@
 Context
-Removed
+Added 1
+Added 2`;

      const { stats } = parseDiffLines(diffText);

      expect(stats.addedLines).toBe(2);
      expect(stats.removedLines).toBe(1);
      expect(stats.changedHunks).toBe(1);
    });

    it("空文本应该返回空结果", () => {
      const { lines, stats } = parseDiffLines("");

      expect(lines).toHaveLength(0);
      expect(stats.addedLines).toBe(0);
      expect(stats.removedLines).toBe(0);
      expect(stats.changedHunks).toBe(0);
    });
  });
});
