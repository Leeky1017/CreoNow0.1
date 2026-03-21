import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { ProjectStore } from "../../stores/projectStore";
import type { ProjectTemplate } from "../../stores/templateStore";

// =============================================================================
// Mock 工具函数
// =============================================================================

function createMockProjectState(
  overrides: Partial<ProjectStore> = {},
): ProjectStore {
  return {
    current: null,
    items: [],
    bootstrapStatus: "ready",
    lastError: null,
    bootstrap: vi.fn(),
    createAndSetCurrent: vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "new-project", rootPath: "/mock/path" },
    }),
    createAiAssistDraft: vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "RATE_LIMITED", message: "mock limited" },
    }),
    setCurrentProject: vi.fn(),
    deleteProject: vi
      .fn()
      .mockResolvedValue({ ok: true, data: { deleted: true } }),
    renameProject: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: "new-project",
        name: "Renamed",
        updatedAt: Date.now(),
      },
    }),
    duplicateProject: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: "new-project-copy",
        rootPath: "/mock/path-copy",
        name: "Copy",
      },
    }),
    setProjectArchived: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: "new-project",
        archived: true,
        archivedAt: Date.now(),
      },
    }),
    clearError: vi.fn(),
    ...overrides,
  };
}

function createPresetTemplate(
  id: string,
  name: string,
): ProjectTemplate & { type: "preset" } {
  return {
    id,
    name,
    type: "preset",
    structure: { folders: [], files: [] },
  };
}

const DEFAULT_PRESET_TEMPLATES: Array<ProjectTemplate & { type: "preset" }> = [
  createPresetTemplate("preset-novel", "Novel"),
  createPresetTemplate("preset-short", "Short Story"),
  createPresetTemplate("preset-script", "Screenplay"),
  createPresetTemplate("preset-other", "Other"),
];

type MockTemplateStoreState = {
  presets: ProjectTemplate[];
  customs: ProjectTemplate[];
  loading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
  createTemplate: () => Promise<ProjectTemplate>;
  updateTemplate: () => Promise<void>;
  deleteTemplate: () => Promise<void>;
  getAllTemplates: () => ProjectTemplate[];
  getTemplateById: (id: string) => ProjectTemplate | undefined;
  clearError: () => void;
};

function createMockTemplateState(
  overrides: Partial<MockTemplateStoreState> = {},
): MockTemplateStoreState {
  const state: MockTemplateStoreState = {
    presets: DEFAULT_PRESET_TEMPLATES,
    customs: [],
    loading: false,
    error: null,
    loadTemplates: vi.fn().mockResolvedValue(undefined),
    createTemplate: vi.fn().mockRejectedValue(new Error("Not implemented")),
    updateTemplate: vi.fn().mockResolvedValue(undefined),
    deleteTemplate: vi.fn().mockResolvedValue(undefined),
    getAllTemplates: vi.fn().mockReturnValue(DEFAULT_PRESET_TEMPLATES),
    getTemplateById: vi
      .fn<(id: string) => ProjectTemplate | undefined>()
      .mockImplementation((id: string) =>
        [...state.presets, ...state.customs].find(
          (template) => template.id === id,
        ),
      ),
    clearError: vi.fn(),
  };
  return { ...state, ...overrides };
}

let templateStoreState = createMockTemplateState();

// =============================================================================
// Mock 设置
// =============================================================================

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => {
    const state = createMockProjectState();
    return selector(state);
  }),
}));

vi.mock("../../stores/templateStore", () => ({
  useTemplateStore: vi.fn((selector) => selector(templateStoreState)),
}));

vi.mock("./CreateTemplateDialog", () => ({
  CreateTemplateDialog: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="create-template-dialog">Create Template Dialog</div>
    ) : null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  templateStoreState = createMockTemplateState();
});

// ===========================================================================
// 渲染 — 对话框结构与初始状态
// ===========================================================================
describe("渲染", () => {
  it("open 为 true 时渲染对话框", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
  });

  it("显示对话框标题 Create New Project", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Create New Project")).toBeInTheDocument();
  });

  it("显示项目名称输入框，带 placeholder 且自动聚焦", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByTestId("create-project-name");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "e.g., The Silent Echo");
    expect(input).toHaveFocus();
  });

  it("显示描述输入框", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByTestId("create-project-description"),
    ).toBeInTheDocument();
  });

  it("显示 Create Project 和 Cancel 按钮", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("create-project-submit")).toBeInTheDocument();
    expect(screen.getByText("Create Project")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("显示所有预设模板选项", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Novel")).toBeInTheDocument();
    expect(screen.getByText("Short Story")).toBeInTheDocument();
    expect(screen.getByText("Screenplay")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("显示 Create Template 按钮", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Create Template")).toBeInTheDocument();
  });

  it("显示 Manual 和 AI Assisted 两个标签页", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "Manual" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "AI Assisted" }),
    ).toBeInTheDocument();
  });
});

// ===========================================================================
// 表单 — 输入与数据变更
// ===========================================================================
describe("表单", () => {
  it("输入项目名称后值更新", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    const input = screen.getByTestId("create-project-name");
    await user.type(input, "My Project");

    expect(input).toHaveValue("My Project");
  });

  it("输入描述后值更新", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    const textarea = screen.getByTestId("create-project-description");
    await user.type(textarea, "A story about silence");

    expect(textarea).toHaveValue("A story about silence");
  });
});

// ===========================================================================
// 验证 — 名称校验
// ===========================================================================
describe("验证", () => {
  it("空名称提交时显示错误消息", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByTestId("create-project-submit"));

    expect(screen.getByText("Project name is required")).toBeInTheDocument();
  });

  it("仅空格的名称提交时显示错误消息", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId("create-project-name"), "   ");
    await user.click(screen.getByTestId("create-project-submit"));

    expect(screen.getByText("Project name is required")).toBeInTheDocument();
  });
});

// ===========================================================================
// 交互 — 按钮、模板选择、标签页
// ===========================================================================
describe("交互", () => {
  it("点击 Cancel 调用 onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CreateProjectDialog open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByText("Cancel"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("提交有效表单调用 createAndSetCurrent 并传递正确参数", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent = vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "new-project", rootPath: "/mock/path" },
    });
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ createAndSetCurrent });
      return selector(state);
    });

    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId("create-project-name"), "New Project");
    await user.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(createAndSetCurrent).toHaveBeenCalledWith({
        name: "New Project",
        description: "",
        type: undefined,
        template: {
          kind: "builtin",
          id: "novel",
        },
        coverImage: null,
        cropArea: null,
      });
    });
  });

  it("选择模板后提交使用所选模板", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent = vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "new-project", rootPath: "/mock/path" },
    });
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ createAndSetCurrent });
      return selector(state);
    });

    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "Short Story" }));
    await user.type(screen.getByTestId("create-project-name"), "New Project");
    await user.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(createAndSetCurrent).toHaveBeenCalledWith(
        expect.objectContaining({
          template: { kind: "builtin", id: "short-story" },
        }),
      );
    });
  });

  it("点击 Create Template 打开 CreateTemplateDialog", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByText("Create Template"));

    expect(screen.getByTestId("create-template-dialog")).toBeInTheDocument();
  });

  it("预设模板后到达时自动同步默认值", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent = vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "new-project", rootPath: "/mock/path" },
    });
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ createAndSetCurrent });
      return selector(state);
    });

    templateStoreState = createMockTemplateState({ presets: [] });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <CreateProjectDialog open={true} onOpenChange={onOpenChange} />,
    );

    templateStoreState = createMockTemplateState();
    rerender(<CreateProjectDialog open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByTestId("create-project-name"), "New Project");
    await user.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(createAndSetCurrent).toHaveBeenCalledWith(
        expect.objectContaining({
          template: { kind: "builtin", id: "novel" },
        }),
      );
    });
  });

  it("用户手动选择模板后不被默认同步覆盖", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent = vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "new-project", rootPath: "/mock/path" },
    });
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ createAndSetCurrent });
      return selector(state);
    });

    const user = userEvent.setup();
    const { rerender } = render(
      <CreateProjectDialog open={true} onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("radio", { name: "Short Story" }));

    templateStoreState = createMockTemplateState({
      presets: [...DEFAULT_PRESET_TEMPLATES],
    });
    rerender(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId("create-project-name"), "New Project");
    await user.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(createAndSetCurrent).toHaveBeenCalledWith(
        expect.objectContaining({
          template: { kind: "builtin", id: "short-story" },
        }),
      );
    });
  });
});

// ===========================================================================
// 标签页切换 — Manual / AI Assisted
// ===========================================================================
describe("标签页切换", () => {
  it("点击 AI Assisted 标签页显示 AI 生成区域", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: "AI Assisted" }));

    expect(screen.getByTestId("create-project-ai-prompt")).toBeInTheDocument();
    expect(
      screen.getByTestId("create-project-ai-generate"),
    ).toBeInTheDocument();
  });

  it("Manual 标签页默认选中", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "Manual" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("AI Assisted 降级时显示回退消息且 Manual 标签页仍可用", async () => {
    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("tab", { name: "AI Assisted" }));
    await user.type(
      screen.getByTestId("create-project-ai-prompt"),
      "帮我Create一部校园推理小说",
    );
    await user.click(screen.getByTestId("create-project-ai-generate"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "AI-assisted creation is temporarily unavailable. Please create manually or try again later",
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: "Manual" })).toBeInTheDocument();
  });
});

// ===========================================================================
// 错误状态 — Store 错误与 IPC 错误展示
// ===========================================================================
describe("错误状态", () => {
  it("Store lastError 存在时显示人类可读错误消息", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({
        lastError: {
          code: "IO_ERROR",
          message: "Failed to create project",
        },
      });
      return selector(state);
    });

    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(
      screen.getByText(/Read\/write operation failed/),
    ).toBeInTheDocument();
  });

  it("IPC 返回 ok:false 时显示错误并记录诊断日志", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent: ProjectStore["createAndSetCurrent"] = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        error: {
          code: "NAME_CONFLICT",
          message: "Project already exists",
        },
      });
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({
        createAndSetCurrent,
        lastError: null,
      });
      return selector(state);
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    try {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      await user.type(
        screen.getByTestId("create-project-name"),
        "Duplicate Project",
      );
      await user.click(screen.getByTestId("create-project-submit"));

      await waitFor(() => {
        expect(
          screen.getByText(/Something unexpected happened/),
        ).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreateProjectDialog] createProject failed:",
        expect.objectContaining({
          operation: "createAndSetCurrent",
          code: "NAME_CONFLICT",
        }),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("IPC 抛异常时显示错误并记录诊断日志", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent: ProjectStore["createAndSetCurrent"] = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error("Disk full"), { code: "IO_ERROR" }),
      );
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({
        createAndSetCurrent,
        lastError: null,
      });
      return selector(state);
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    try {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      await user.type(
        screen.getByTestId("create-project-name"),
        "Disk Full Project",
      );
      await user.click(screen.getByTestId("create-project-submit"));

      await waitFor(() => {
        expect(
          screen.getByText(/Read\/write operation failed/),
        ).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreateProjectDialog] createProject failed:",
        expect.objectContaining({
          operation: "createAndSetCurrent",
          code: "IO_ERROR",
        }),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});

// ===========================================================================
// 状态 — 提交中与清理
// ===========================================================================
describe("状态", () => {
  it("提交过程中 Create 按钮显示 Creating…", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const createAndSetCurrent = vi.fn(
      () =>
        new Promise<{
          ok: true;
          data: { projectId: string; rootPath: string };
        }>(() => {}),
    );
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ createAndSetCurrent });
      return selector(state);
    });

    const user = userEvent.setup();
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByTestId("create-project-name"), "Test Project");
    await user.click(screen.getByTestId("create-project-submit"));

    await waitFor(() => {
      expect(screen.getByText("Creating…")).toBeInTheDocument();
    });
  });

  it("关闭对话框时清除 Store 错误", async () => {
    const { useProjectStore } = await import("../../stores/projectStore");
    const clearError = vi.fn();
    vi.mocked(useProjectStore).mockImplementation((selector) => {
      const state = createMockProjectState({ clearError });
      return selector(state);
    });

    const { rerender } = render(
      <CreateProjectDialog open={true} onOpenChange={vi.fn()} />,
    );
    rerender(<CreateProjectDialog open={false} onOpenChange={vi.fn()} />);

    expect(clearError).toHaveBeenCalled();
  });
});
