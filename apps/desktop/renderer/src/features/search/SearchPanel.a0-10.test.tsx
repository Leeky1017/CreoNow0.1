import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchPanel } from "./SearchPanel";

const mockSetQuery = vi.fn();

vi.mock("../../stores/searchStore", () => ({
  useSearchStore: vi.fn((selector) => {
    const state = {
      query: "",
      items: [],
      status: "idle" as const,
      indexState: "ready" as const,
      total: 0,
      hasMore: false,
      lastError: null,
      setQuery: mockSetQuery,
      runFulltext: vi.fn().mockResolvedValue({ ok: true }),
      clearResults: vi.fn(),
      clearError: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => {
    const state = { setCurrent: vi.fn().mockResolvedValue({ ok: true }) };
    return selector(state);
  }),
}));

describe("SearchPanel — A0-10 基础全文搜索入口", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // AC-2: 打开后搜索输入框自动获得焦点
  // ===========================================================================
  describe("自动聚焦 (AC-2)", () => {
    it("打开 SearchPanel 后，搜索输入框获得焦点", () => {
      render(<SearchPanel projectId="test-project" open={true} />);
      const input = screen.getByTestId("search-input");
      expect(document.activeElement).toBe(input);
    });
  });

  // ===========================================================================
  // AC-10: Escape 键退出搜索
  // ===========================================================================
  describe("Escape 行为 (AC-10)", () => {
    it("搜索输入框为空时按 Escape 关闭 SearchPanel", () => {
      const onClose = vi.fn();
      render(
        <SearchPanel projectId="test-project" open={true} onClose={onClose} />,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("搜索输入框有文本时按 Escape 清空文本，不关闭面板", () => {
      const onClose = vi.fn();
      render(
        <SearchPanel
          projectId="test-project"
          open={true}
          onClose={onClose}
          mockQuery="test query"
        />,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockSetQuery).toHaveBeenCalledWith("");
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // AC-11: 无障碍属性
  // ===========================================================================
  describe("无障碍属性 (AC-11)", () => {
    it("搜索输入框具有 role='searchbox'", () => {
      render(<SearchPanel projectId="test-project" open={true} />);
      const input = screen.getByRole("searchbox");
      expect(input).toBeInTheDocument();
    });

    it("搜索输入框具有非空 aria-label", () => {
      render(<SearchPanel projectId="test-project" open={true} />);
      const input = screen.getByRole("searchbox");
      expect(input.getAttribute("aria-label")).toBeTruthy();
    });
  });

  // ===========================================================================
  // AC-8: 搜索无结果展示
  // ===========================================================================
  describe("无结果状态 (AC-8)", () => {
    it("搜索有查询但无结果时渲染无结果提示", () => {
      render(
        <SearchPanel
          projectId="test-project"
          open={true}
          mockQuery="nonexistent"
          mockResults={[]}
          mockStatus="idle"
        />,
      );
      // 应该渲染无结果提示
      expect(screen.getByText("No matching results")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // AC-9: 键盘导航 — Arrow Down/Up 和 Enter
  // ===========================================================================
  describe("键盘导航 (AC-9)", () => {
    const mockResults = [
      {
        id: "doc1",
        documentId: "doc1",
        type: "document" as const,
        title: "First Document",
        snippet: "some text",
      },
      {
        id: "doc2",
        documentId: "doc2",
        type: "document" as const,
        title: "Second Document",
        snippet: "other text",
      },
      {
        id: "doc3",
        documentId: "doc3",
        type: "document" as const,
        title: "Third Document",
        snippet: "more text",
      },
    ];

    it("初始态第一项被选中（aria-selected='true'），按 Arrow Down 后第二项被选中", () => {
      render(
        <SearchPanel
          projectId="test-project"
          open={true}
          mockQuery="test"
          mockResults={mockResults}
          mockStatus="idle"
        />,
      );
      // 初始状态第一项已选中
      const firstItem = screen.getByTestId("search-result-item-doc1");
      expect(firstItem.closest("[aria-selected='true']")).toBeTruthy();

      // Arrow Down → 第二项选中
      fireEvent.keyDown(document, { key: "ArrowDown" });
      const secondItem = screen.getByTestId("search-result-item-doc2");
      expect(secondItem.closest("[aria-selected='true']")).toBeTruthy();
      // 第一项不再选中
      expect(firstItem.closest("[aria-selected='true']")).toBeNull();
    });
  });
});
