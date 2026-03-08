import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileTreePanel } from "./FileTreePanel";

// Mock stores
vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => {
    const state = {
      items: [],
      currentDocumentId: null,
      bootstrapStatus: "ready" as const,
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
    };
    return selector(state as never);
  }),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector) => {
    const state = {
      openDocument: vi.fn().mockResolvedValue({ ok: true }),
      openCurrentDocumentForProject: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state as never);
  }),
}));

describe("FileTreePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 FileTreePanel 组件", () => {
      render(<FileTreePanel projectId="test-project" />);

      const panel = screen.getByTestId("sidebar-files");
      expect(panel).toBeInTheDocument();
    });

    it("应该显示 Files Title", () => {
      render(<FileTreePanel projectId="test-project" />);

      expect(screen.getByText("Files")).toBeInTheDocument();
    });

    it("应该显示 New 按钮", () => {
      render(<FileTreePanel projectId="test-project" />);

      expect(screen.getByTestId("file-create")).toBeInTheDocument();
      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 空状态测试
  // ===========================================================================
  describe("空状态", () => {
    it("当无Documents时应显示空状态提示", () => {
      render(<FileTreePanel projectId="test-project" />);

      expect(
        screen.getByText("No Files"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Start by creating your first file"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New File" }),
      ).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 加载状态测试
  // ===========================================================================
  describe("加载状态", () => {
    it("bootstrapStatus 为 loading 时应显示加载提示", async () => {
      const { useFileStore } = await import("../../stores/fileStore");
      vi.mocked(useFileStore).mockImplementation((selector) => {
        const state = {
          projectId: "test-project",
          items: [],
          currentDocumentId: null,
          bootstrapStatus: "loading" as const,
          lastError: null,
          bootstrapForProject: vi.fn(),
          refreshForProject: vi.fn(),
          createAndSetCurrent: vi.fn(),
          rename: vi.fn(),
          updateStatus: vi.fn(),
          delete: vi.fn(),
          setCurrent: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state as never);
      });

      render(<FileTreePanel projectId="test-project" />);

      expect(screen.getByText("Loading files…")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 错误状态测试
  // ===========================================================================
  describe("错误状态", () => {
    it("有错误时应显示错误Info", async () => {
      const { useFileStore } = await import("../../stores/fileStore");
      vi.mocked(useFileStore).mockImplementation((selector) => {
        const state = {
          projectId: "test-project",
          items: [],
          currentDocumentId: null,
          bootstrapStatus: "ready" as const,
          lastError: {
            code: "IO_ERROR" as const,
            message: "Failed to load files",
          },
          bootstrapForProject: vi.fn(),
          refreshForProject: vi.fn(),
          createAndSetCurrent: vi.fn(),
          rename: vi.fn(),
          updateStatus: vi.fn(),
          delete: vi.fn(),
          setCurrent: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state as never);
      });

      render(<FileTreePanel projectId="test-project" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Failed to load files/)).toBeInTheDocument();
      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DocumentsList测试
  // ===========================================================================
  describe("DocumentsList", () => {
    it("应该渲染DocumentsList项", async () => {
      const { useFileStore } = await import("../../stores/fileStore");
      vi.mocked(useFileStore).mockImplementation((selector) => {
        const state = {
          projectId: "test-project",
          items: [
            {
              documentId: "doc-1",
              type: "chapter",
              title: "Document 1",
              status: "draft",
              sortOrder: 0,
              updatedAt: Date.now() - 1000,
            },
            {
              documentId: "doc-2",
              type: "chapter",
              title: "Document 2",
              status: "draft",
              sortOrder: 1,
              updatedAt: Date.now() - 2000,
            },
          ],
          currentDocumentId: "doc-1",
          bootstrapStatus: "ready" as const,
          lastError: null,
          bootstrapForProject: vi.fn(),
          refreshForProject: vi.fn(),
          createAndSetCurrent: vi.fn(),
          rename: vi.fn(),
          updateStatus: vi.fn(),
          delete: vi.fn(),
          setCurrent: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state as never);
      });

      render(<FileTreePanel projectId="test-project" />);

      expect(screen.getByTestId("file-row-doc-1")).toBeInTheDocument();
      expect(screen.getByTestId("file-row-doc-2")).toBeInTheDocument();
      expect(screen.getByText("Document 1")).toBeInTheDocument();
      expect(screen.getByText("Document 2")).toBeInTheDocument();
    });

    it("选中项应有 aria-selected Properties", async () => {
      const { useFileStore } = await import("../../stores/fileStore");
      vi.mocked(useFileStore).mockImplementation((selector) => {
        const state = {
          projectId: "test-project",
          items: [
            {
              documentId: "doc-1",
              type: "chapter",
              title: "Document 1",
              status: "draft",
              sortOrder: 0,
              updatedAt: Date.now() - 1000,
            },
            {
              documentId: "doc-2",
              type: "chapter",
              title: "Document 2",
              status: "draft",
              sortOrder: 1,
              updatedAt: Date.now() - 2000,
            },
          ],
          currentDocumentId: "doc-1",
          bootstrapStatus: "ready" as const,
          lastError: null,
          bootstrapForProject: vi.fn(),
          refreshForProject: vi.fn(),
          createAndSetCurrent: vi.fn(),
          rename: vi.fn(),
          updateStatus: vi.fn(),
          delete: vi.fn(),
          setCurrent: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state as never);
      });

      render(<FileTreePanel projectId="test-project" />);

      const selectedItem = screen.getByTestId("file-row-doc-1");
      expect(selectedItem).toHaveAttribute("aria-selected", "true");
    });

    it("to open ⋯ 菜单后应显示 Rename 和 Delete", async () => {
      const { useFileStore } = await import("../../stores/fileStore");
      vi.mocked(useFileStore).mockImplementation((selector) => {
        const state = {
          projectId: "test-project",
          items: [
            {
              documentId: "doc-1",
              type: "chapter",
              title: "Document 1",
              status: "draft",
              sortOrder: 0,
              updatedAt: Date.now() - 1000,
            },
          ],
          currentDocumentId: null,
          bootstrapStatus: "ready" as const,
          lastError: null,
          bootstrapForProject: vi.fn(),
          refreshForProject: vi.fn(),
          createAndSetCurrent: vi.fn(),
          rename: vi.fn(),
          updateStatus: vi.fn(),
          delete: vi.fn(),
          setCurrent: vi.fn(),
          clearError: vi.fn(),
        };
        return selector(state as never);
      });

      render(<FileTreePanel projectId="test-project" />);

      fireEvent.click(screen.getByTestId("file-actions-doc-1"));
      expect(screen.getByTestId("file-rename-doc-1")).toBeInTheDocument();
      expect(screen.getByTestId("file-delete-doc-1")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("应该有 flex column Layout", () => {
      render(<FileTreePanel projectId="test-project" />);

      const panel = screen.getByTestId("sidebar-files");
      expect(panel).toHaveClass("flex");
      expect(panel).toHaveClass("flex-col");
    });
  });
});
