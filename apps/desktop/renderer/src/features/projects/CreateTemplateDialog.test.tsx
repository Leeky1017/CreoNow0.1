import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { useTemplateStore } from "../../stores/templateStore";

// =============================================================================
// Mock 设置
// =============================================================================

vi.mock("../../stores/templateStore", () => ({
  useTemplateStore: vi.fn(),
}));

const mockCreateTemplate = vi.fn();
const mockOnOpenChange = vi.fn();
const mockOnCreated = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  (useTemplateStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
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
// 渲染 — 对话框结构与可见性
// ===========================================================================
describe("渲染", () => {
  it("open 为 true 时渲染对话框表单", () => {
    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    expect(screen.getByTestId("create-template-dialog")).toBeInTheDocument();
  });

  it("open 为 false 时不渲染对话框内容", () => {
    render(
      <CreateTemplateDialog open={false} onOpenChange={mockOnOpenChange} />,
    );

    expect(
      screen.queryByTestId("create-template-dialog"),
    ).not.toBeInTheDocument();
  });

  it("显示名称输入框，带 autoFocus", () => {
    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const nameInput = screen.getByTestId("create-template-name");
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveFocus();
  });

  it("显示描述输入框", () => {
    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    expect(
      screen.getByTestId("create-template-description"),
    ).toBeInTheDocument();
  });

  it("显示创建和取消按钮", () => {
    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    expect(screen.getByTestId("create-template-submit")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("显示文件夹和文件添加区域", () => {
    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    expect(screen.getByPlaceholderText("e.g., chapters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., outline.md")).toBeInTheDocument();
  });
});

// ===========================================================================
// 验证 — 名称必填校验
// ===========================================================================
describe("验证", () => {
  it("名称为空时提交不调用 createTemplate", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.click(screen.getByTestId("create-template-submit"));

    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });

  it("名称为空时提交显示验证错误消息", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.click(screen.getByTestId("create-template-submit"));

    expect(screen.getByText("Template name is required")).toBeInTheDocument();
  });

  it("仅空格的名称提交不调用 createTemplate", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByTestId("create-template-name"), "   ");
    await user.click(screen.getByTestId("create-template-submit"));

    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 表单提交 — 正常流程与回调
// ===========================================================================
describe("表单提交", () => {
  it("输入名称后提交传递正确参数", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
      />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: "My Template",
        description: undefined,
        structure: { folders: [], files: [] },
      });
    });
  });

  it("名称和描述都填写时传递正确参数", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
      />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.type(
      screen.getByTestId("create-template-description"),
      "A great template",
    );
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: "My Template",
        description: "A great template",
        structure: { folders: [], files: [] },
      });
    });
  });

  it("提交成功后调用 onCreated 回调并传递模板 ID", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
      />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalledWith("custom-123");
    });
  });

  it("提交成功后自动关闭对话框", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("添加文件夹和文件后提交包含完整 structure", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
      />,
    );

    // 添加文件夹
    await user.type(screen.getByPlaceholderText("e.g., chapters"), "chapters");
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[0]);

    // 添加文件
    await user.type(
      screen.getByPlaceholderText("e.g., outline.md"),
      "readme.md",
    );
    await user.click(addButtons[1]);

    // 提交
    await user.type(
      screen.getByTestId("create-template-name"),
      "Full Template",
    );
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: "Full Template",
        description: undefined,
        structure: {
          folders: ["chapters"],
          files: [{ path: "readme.md" }],
        },
      });
    });
  });
});

// ===========================================================================
// 文件夹管理 — 添加、移除、重复防护
// ===========================================================================
describe("文件夹管理", () => {
  it("输入文件夹名并点击 Add 后显示在列表中", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByPlaceholderText("e.g., chapters"), "my-folder");
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[0]);

    expect(screen.getByText("my-folder")).toBeInTheDocument();
  });

  it("按 Enter 键添加文件夹", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const input = screen.getByPlaceholderText("e.g., chapters");
    await user.type(input, "enter-folder{enter}");

    expect(screen.getByText("enter-folder")).toBeInTheDocument();
  });

  it("添加后输入框自动清空", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const input = screen.getByPlaceholderText("e.g., chapters");
    await user.type(input, "my-folder");
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[0]);

    expect(input).toHaveValue("");
  });

  it("点击移除按钮删除文件夹", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByPlaceholderText("e.g., chapters"), "my-folder");
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[0]);
    expect(screen.getByText("my-folder")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Remove my-folder"));
    expect(screen.queryByText("my-folder")).not.toBeInTheDocument();
  });

  it("重复文件夹名不会添加第二次", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const input = screen.getByPlaceholderText("e.g., chapters");
    const addButtons = screen.getAllByText("Add");

    await user.type(input, "chapters");
    await user.click(addButtons[0]);
    await user.type(input, "chapters");
    await user.click(addButtons[0]);

    const items = screen.getAllByText("chapters");
    expect(items).toHaveLength(1);
  });
});

// ===========================================================================
// 文件管理 — 添加文件
// ===========================================================================
describe("文件管理", () => {
  it("输入文件名并添加后显示在列表中", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(
      screen.getByPlaceholderText("e.g., outline.md"),
      "readme.md",
    );
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[1]);

    expect(screen.getByText("readme.md")).toBeInTheDocument();
  });

  it("按 Enter 键添加文件", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const input = screen.getByPlaceholderText("e.g., outline.md");
    await user.type(input, "notes.txt{enter}");

    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("重复文件名不会添加第二次", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    const input = screen.getByPlaceholderText("e.g., outline.md");
    const addButtons = screen.getAllByText("Add");

    await user.type(input, "readme.md");
    await user.click(addButtons[1]);
    await user.type(input, "readme.md");
    await user.click(addButtons[1]);

    const items = screen.getAllByText("readme.md");
    expect(items).toHaveLength(1);
  });
});

// ===========================================================================
// 取消 — 关闭对话框
// ===========================================================================
describe("取消", () => {
  it("点击 Cancel 调用 onOpenChange(false)", async () => {
    const user = userEvent.setup();

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.click(screen.getByText("Cancel"));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

// ===========================================================================
// 错误处理 — 创建失败反馈
// ===========================================================================
describe("错误处理", () => {
  it("创建失败时显示错误消息", async () => {
    const user = userEvent.setup();
    mockCreateTemplate.mockRejectedValueOnce(new Error("Network error"));

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("非 Error 对象异常时显示通用错误消息", async () => {
    const user = userEvent.setup();
    mockCreateTemplate.mockRejectedValueOnce("string error");

    render(
      <CreateTemplateDialog open={true} onOpenChange={mockOnOpenChange} />,
    );

    await user.type(screen.getByTestId("create-template-name"), "My Template");
    await user.click(screen.getByTestId("create-template-submit"));

    await waitFor(() => {
      expect(screen.getByText("Failed to create template")).toBeInTheDocument();
    });
  });
});
