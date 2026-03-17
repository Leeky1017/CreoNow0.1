import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { useTemplateStore } from "../../stores/templateStore";

// Mock the template store
vi.mock("../../stores/templateStore", () => ({
  useTemplateStore: vi.fn(),
}));

describe("CreateTemplateDialog", () => {
  const mockCreateTemplate = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockOnCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useTemplateStore to return our mock function
    (
      useTemplateStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (
        selector: (state: {
          createTemplate: typeof mockCreateTemplate;
        }) => typeof mockCreateTemplate,
      ) => {
        return selector({ createTemplate: mockCreateTemplate });
      },
    );

    mockCreateTemplate.mockResolvedValue({ id: "custom-123" });
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("打开时应该渲染对话框", () => {
      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.getByTestId("create-template-dialog")).toBeInTheDocument();
    });

    it("关闭时不应该渲染对话框内容", () => {
      render(
        <CreateTemplateDialog open={false} onOpenChange={mockOnOpenChange} />,
      );

      expect(
        screen.queryByTestId("create-template-dialog"),
      ).not.toBeInTheDocument();
    });

    it("应该渲染模板名称输入框", () => {
      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.getByTestId("create-template-name")).toBeInTheDocument();
    });

    it("应该渲染描述输入框", () => {
      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(
        screen.getByTestId("create-template-description"),
      ).toBeInTheDocument();
    });

    it("应该渲染创建按钮", () => {
      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(screen.getByTestId("create-template-submit")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 表单提交测试
  // ===========================================================================
  describe("表单提交", () => {
    it("没有名称时不应该提交", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      await user.click(screen.getByTestId("create-template-submit"));

      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it("输入名称后应该能提交", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />,
      );

      await user.type(
        screen.getByTestId("create-template-name"),
        "My Template",
      );
      await user.click(screen.getByTestId("create-template-submit"));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          name: "My Template",
          description: undefined,
          structure: { folders: [], files: [] },
        });
      });
    });

    it("提交成功后应该调用 onCreated", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />,
      );

      await user.type(
        screen.getByTestId("create-template-name"),
        "My Template",
      );
      await user.click(screen.getByTestId("create-template-submit"));

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith("custom-123");
      });
    });

    it("提交成功后应该关闭对话框", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      await user.type(
        screen.getByTestId("create-template-name"),
        "My Template",
      );
      await user.click(screen.getByTestId("create-template-submit"));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  // ===========================================================================
  // 文件夹/文件管理测试
  // ===========================================================================
  describe("文件夹管理", () => {
    it("应该能添加文件夹", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />,
      );

      // Find folder input (placeholder: "e.g., chapters")
      const folderInputs = screen.getAllByPlaceholderText("e.g., chapters");
      await user.type(folderInputs[0], "my-folder");

      // Click add button
      const addButtons = screen.getAllByText("Add");
      await user.click(addButtons[0]);

      // Should show the folder in the list
      expect(screen.getByText("my-folder")).toBeInTheDocument();
    });

    it("应该能移除文件夹", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      // Add a folder first
      const folderInputs = screen.getAllByPlaceholderText("e.g., chapters");
      await user.type(folderInputs[0], "my-folder");
      const addButtons = screen.getAllByText("Add");
      await user.click(addButtons[0]);

      // Now remove it
      const removeButton = screen.getByLabelText("Remove my-folder");
      await user.click(removeButton);

      // Should not be in the document anymore
      expect(screen.queryByText("my-folder")).not.toBeInTheDocument();
    });
  });

  describe("文件管理", () => {
    it("应该能添加文件", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      // Find file input (placeholder: "e.g., outline.md")
      const fileInputs = screen.getAllByPlaceholderText("e.g., outline.md");
      await user.type(fileInputs[0], "readme.md");

      // Click add button (second one)
      const addButtons = screen.getAllByText("Add");
      await user.click(addButtons[1]);

      // Should show the file in the list
      expect(screen.getByText("readme.md")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 取消测试
  // ===========================================================================
  describe("取消", () => {
    it("点击 Cancel 应该关闭对话框", async () => {
      const user = userEvent.setup();

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      await user.click(screen.getByText("Cancel"));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ===========================================================================
  // 错误处理测试
  // ===========================================================================
  describe("错误处理", () => {
    it("创建失败时应该显示错误", async () => {
      const user = userEvent.setup();
      mockCreateTemplate.mockRejectedValueOnce(new Error("Network error"));

      render(
        <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      await user.type(
        screen.getByTestId("create-template-name"),
        "My Template",
      );
      await user.click(screen.getByTestId("create-template-submit"));

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });
});
