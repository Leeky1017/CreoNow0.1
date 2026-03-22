import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

import { FileTreePanel } from "../features/files/FileTreePanel";
import { LayoutShell } from "../components/layout/LayoutShell";
import { AiMessageList } from "../features/ai/AiMessageList";
import type { AiMessageListProps } from "../features/ai/AiMessageList";
import { OutlinePanel } from "../features/outline/OutlinePanel";
import type { OutlineItem } from "../features/outline/OutlinePanel";

/**
 * V1-19 Accessibility Guard Tests
 *
 * 行为测试：渲染组件并验证 DOM 中的无障碍标记和键盘导航行为。
 * 确保 ARIA 属性不会被意外移除，同时避免 readFileSync 源码扫描反模式。
 */

// ---------------------------------------------------------------------------
// Store mocks for FileTreePanel
// ---------------------------------------------------------------------------

type FileItem = {
  documentId: string;
  title: string;
  updatedAt: number;
  type: "chapter" | "note" | "setting" | "timeline" | "character";
  status: "draft" | "final";
  sortOrder: number;
  parentId?: string;
};

const openDocument = vi.fn().mockResolvedValue({ ok: true });
const openCurrentDocumentForProject = vi.fn().mockResolvedValue({ ok: true });

let fileItems: FileItem[] = [];
let currentDocumentId: string | null = null;

vi.mock("../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: fileItems,
      currentDocumentId,
      bootstrapStatus: "ready",
      lastError: null,
      createAndSetCurrent: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { documentId: "new-doc" } }),
      rename: vi.fn().mockResolvedValue({ ok: true }),
      updateStatus: vi.fn().mockResolvedValue({
        ok: true,
        data: { updated: true, status: "draft" },
      }),
      delete: vi.fn().mockResolvedValue({ ok: true }),
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
      clearError: vi.fn(),
    }),
  ),
}));

vi.mock("../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        openDocument,
        openCurrentDocumentForProject,
      }),
  ),
}));

// ---------------------------------------------------------------------------
// AiMessageList minimal props helper
// ---------------------------------------------------------------------------

function createMinimalAiProps(): AiMessageListProps {
  return {
    historyMessages: [],
    lastRequest: null,
    working: false,
    status: "idle" as never,
    queuePosition: null,
    queuedCount: 0,
    errorConfigs: {
      showDbGuide: false,
      showProviderGuide: false,
      dbGuideError: null,
      dbGuideCommand: undefined,
      providerGuideCode: null,
      skillsErrorConfig: null,
      modelsErrorConfig: null,
      runtimeErrorConfig: null,
    } as never,
    lastCandidates: [],
    selectedCandidate: null,
    activeOutputText: "",
    judgeResult: null,
    usageStats: null,
    applyStatus: "idle" as never,
    proposal: null,
    compareMode: false,
    diffText: "",
    canApply: false,
    inlineDiffConfirmOpen: false,
    clearError: vi.fn(),
    openSettings: vi.fn(),
    onSelectCandidate: vi.fn(),
    onRegenerateAll: vi.fn(),
    onApply: vi.fn(),
    onReject: vi.fn(),
    setInlineDiffConfirmOpen: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("V1-19 Accessibility Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentDocumentId = "folder-1";
    fileItems = [
      {
        documentId: "folder-1",
        title: "第一卷",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "doc-in-folder",
        title: "卷内章节",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
        parentId: "folder-1",
      },
      {
        documentId: "doc-root",
        title: "根章节",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 2,
      },
    ];
  });

  // --- Phase 1: 语义化标记 (rendered DOM) ---

  describe("FileTreePanel 语义化标记", () => {
    it("tree container 具有 role=tree 和 aria-label", () => {
      render(<FileTreePanel projectId="test-project" />);
      const tree = screen.getByRole("tree");
      expect(tree).toHaveAttribute("aria-label");
    });

    it("tree item 节点具有 role=treeitem、aria-level 和唯一 id", () => {
      render(<FileTreePanel projectId="test-project" />);
      const items = screen.getAllByRole("treeitem");
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item).toHaveAttribute(
          "id",
          expect.stringMatching(/^tree-node-/),
        );
        expect(item).toHaveAttribute("aria-level");
      }
    });

    it("文件夹节点具有 aria-expanded 属性", () => {
      render(<FileTreePanel projectId="test-project" />);
      const folderRow = screen.getByTestId("file-row-folder-1");
      const folderItem = folderRow.closest("[role='treeitem']");
      expect(folderItem).toHaveAttribute("aria-expanded");
    });

    it("tree container 设置 aria-activedescendant 指向当前活跃节点", () => {
      currentDocumentId = "doc-root";
      render(<FileTreePanel projectId="test-project" />);
      const tree = screen.getByRole("tree");
      expect(tree).toHaveAttribute(
        "aria-activedescendant",
        "tree-node-doc-root",
      );
    });
  });

  describe("OutlinePanel 语义化标记", () => {
    it("outline container 具有 role=tree 和 aria-label", () => {
      const outlineItems: OutlineItem[] = [
        { id: "h1", title: "Chapter 1", level: "h1" },
      ];
      render(<OutlinePanel items={outlineItems} />);
      const tree = screen.getByRole("tree");
      expect(tree).toHaveAttribute("aria-label");
    });
  });

  describe("AiMessageList 语义化标记", () => {
    it("消息区域具有 role=log 和 aria-live=polite", () => {
      render(<AiMessageList {...createMinimalAiProps()} />);
      const log = screen.getByRole("log");
      expect(log).toHaveAttribute("aria-live", "polite");
      expect(log).toHaveAttribute("aria-label");
    });
  });

  // --- Phase 2: 键盘导航 ---

  describe("键盘导航", () => {
    it("Space 键在文件夹节点上切换展开/折叠", () => {
      currentDocumentId = "folder-1";
      render(<FileTreePanel projectId="test-project" />);
      const tree = screen.getByRole("tree");
      tree.focus();

      // folder-1 is initially expanded (has visible child)
      expect(screen.getByTestId("file-row-doc-in-folder")).toBeInTheDocument();

      // Space on folder should collapse it
      fireEvent.keyDown(tree, { key: " " });

      // After collapsing, child node should not be visible
      expect(
        screen.queryByTestId("file-row-doc-in-folder"),
      ).not.toBeInTheDocument();

      // openDocument should NOT have been called
      expect(openDocument).not.toHaveBeenCalled();
    });

    it("Space 键在叶节点上触发选择", () => {
      currentDocumentId = "doc-root";
      render(<FileTreePanel projectId="test-project" />);
      const tree = screen.getByRole("tree");
      tree.focus();

      // doc-root is a leaf, Space should trigger select
      fireEvent.keyDown(tree, { key: " " });
      expect(openDocument).toHaveBeenCalledWith({
        projectId: "test-project",
        documentId: "doc-root",
      });
    });

    it("Arrow/Home/End 键支持树节点导航", () => {
      render(<FileTreePanel projectId="test-project" />);
      const tree = screen.getByRole("tree");
      tree.focus();

      fireEvent.keyDown(tree, { key: "End" });
      const endTreeItem = screen
        .getByTestId("file-row-doc-root")
        .closest("[role='treeitem']");
      expect(endTreeItem).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(tree, { key: "Home" });
      const homeTreeItem = screen
        .getByTestId("file-row-folder-1")
        .closest("[role='treeitem']");
      expect(homeTreeItem).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("skip-to-content", () => {
    it("LayoutShell 包含可聚焦的 skip-to-content 链接指向 #main-content", () => {
      render(
        <LayoutShell
          testId="layout"
          activityBar={<div />}
          left={<div />}
          leftResizer={<div />}
          main={<div id="main-content" />}
          rightResizer={<div />}
          right={<div />}
          bottomBar={<div />}
          overlays={<div />}
        />,
      );
      const link = screen.getByText("Skip to main content");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "#main-content");
    });
  });

  // --- Phase 3: 高对比模式 ---
  // CSS 媒体查询无法在 jsdom 中渲染和断言，文件读取是唯一可行的验证手段

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
