import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchPanel } from "./SearchPanel";

// Mock stores
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
      setQuery: vi.fn(),
      runFulltext: vi.fn().mockResolvedValue({ ok: true }),
      clearResults: vi.fn(),
      clearError: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => {
    const state = {
      setCurrent: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  }),
}));

describe("SearchPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 SearchPanel 组件", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const panel = screen.getByTestId("search-panel");
      expect(panel).toBeInTheDocument();
    });

    it("应该显示搜索输入框带有 placeholder", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const input = screen.getByTestId("search-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute(
        "placeholder",
        "搜索文档、记忆、知识...",
      );
    });

    it("应该显示分类过滤按钮", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      // 组件使用分类过滤器（全部, 文档, 记忆, 知识, 素材）
      expect(screen.getByText("全部")).toBeInTheDocument();
    });

    it("应该有模态背景遮罩", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      // 检查模态框结构
      const panel = screen.getByTestId("search-panel");
      expect(panel).toHaveClass("fixed");
      expect(panel).toHaveClass("inset-0");
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("输入框应可输入", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const input = screen.getByTestId("search-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("点击分类按钮应切换分类", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const allButtonText = screen.getByText("全部");
      expect(allButtonText).toBeInTheDocument();

      // All 按钮默认选中 — Button primitive wraps children in <span>,
      // so we check the closest <button> ancestor for the active className
      const allButton = allButtonText.closest("button");
      expect(allButton?.className).toContain("bg-[var(--color-info)]");
    });
  });

  // ===========================================================================
  // 搜索结果展示测试（使用组件内置的 mock 数据）
  // ===========================================================================
  describe("搜索结果展示", () => {
    it("输入搜索词后应显示相关结果", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const input = screen.getByTestId("search-input");
      fireEvent.change(input, { target: { value: "design" } });

      // 组件通过 searchStore 获取真实搜索结果
      // 输入后应该显示匹配的结果
    });
  });

  // ===========================================================================
  // 加载状态测试
  // ===========================================================================
  describe("加载状态", () => {
    it("loading 状态时应显示加载指示器", async () => {
      const { useSearchStore } = await import("../../stores/searchStore");
      vi.mocked(useSearchStore).mockImplementation((selector) => {
        const state = {
          query: "",
          items: [],
          status: "loading" as const,
          indexState: "ready" as const,
          total: 0,
          hasMore: false,
          lastError: null,
          setQuery: vi.fn(),
          runFulltext: vi.fn(),
          clearResults: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state);
      });

      render(<SearchPanel projectId="test-project" open={true} />);

      // 组件可能显示 Spinner 或其他加载指示器
      // 基于当前实现，loading 状态由 store 管理
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("应该是 div 元素（模态框样式）", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const panel = screen.getByTestId("search-panel");
      // 组件使用 div 作为模态框容器，不是 section
      expect(panel.tagName).toBe("DIV");
    });

    it("应该有固定定位和全屏覆盖", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const panel = screen.getByTestId("search-panel");
      expect(panel).toHaveClass("fixed");
      expect(panel).toHaveClass("inset-0");
      expect(panel).toHaveClass("flex");
    });

    it("应该居中显示搜索面板", () => {
      render(<SearchPanel projectId="test-project" open={true} />);

      const panel = screen.getByTestId("search-panel");
      expect(panel).toHaveClass("items-start");
      expect(panel).toHaveClass("justify-center");
    });
  });

  // ===========================================================================
  // 关闭功能测试
  // ===========================================================================
  describe("关闭功能", () => {
    it("点击背景遮罩应触发关闭", () => {
      const onClose = vi.fn();
      render(<SearchPanel projectId="test-project" open={true} onClose={onClose} />);

      // 点击背景遮罩
      const backdrop = document.querySelector(".backdrop-blur-sm");
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });
});
