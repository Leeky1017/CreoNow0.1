import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { ProjectStore } from "../../stores/projectStore";
import type { ProjectTemplate } from "../../stores/templateStore";

/**
 * Build a fully-typed project store shape for tests.
 *
 * Why: CreateProjectDialog tests should stay resilient as ProjectStore actions grow.
 */
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

// Mock stores
vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => {
    const state = createMockProjectState();
    return selector(state);
  }),
}));

vi.mock("../../stores/templateStore", () => ({
  useTemplateStore: vi.fn((selector) => selector(templateStoreState)),
}));

// Mock CreateTemplateDialog
vi.mock("./CreateTemplateDialog", () => ({
  CreateTemplateDialog: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="create-template-dialog">Create Template Dialog</div>
    ) : null,
}));

describe("CreateProjectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateStoreState = createMockTemplateState();
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("open 为 true 时应该渲染对话框", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
    });

    it("应该显示 Create New Project Title", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Create New Project")).toBeInTheDocument();
    });

    it("应该显示Name输入框", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId("create-project-name")).toBeInTheDocument();
    });

    it("应该显示 Create Project 按钮", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByTestId("create-project-submit")).toBeInTheDocument();
      expect(screen.getByText("Create Project")).toBeInTheDocument();
    });

    it("应该显示 Cancel 按钮", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("应该显示预设模板选项", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Novel")).toBeInTheDocument();
      expect(screen.getByText("Short Story")).toBeInTheDocument();
      expect(screen.getByText("Screenplay")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
    });

    it("应该显示Description输入框", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(
        screen.getByTestId("create-project-description"),
      ).toBeInTheDocument();
    });

    it("应该显示 Create Template 按钮", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Create Template")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 表单测试
  // ===========================================================================
  describe("表单", () => {
    it("Name输入框应有 placeholder", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId("create-project-name");
      expect(input).toHaveAttribute("placeholder", "e.g., The Silent Echo");
    });

    it("输入应更新值", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId("create-project-name");
      fireEvent.change(input, { target: { value: "My Project" } });

      expect(input).toHaveValue("My Project");
    });

    it("Name输入框应有 autoFocus", () => {
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByTestId("create-project-name");
      expect(input).toHaveFocus();
    });
  });

  // ===========================================================================
  // 验证测试
  // ===========================================================================
  describe("验证", () => {
    it("空Name应该显示错误", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      // Submit without entering name
      await user.click(screen.getByTestId("create-project-submit"));

      expect(screen.getByText("Project name is required")).toBeInTheDocument();
    });

    it("只有空格的Name应该显示错误", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      await user.type(screen.getByTestId("create-project-name"), "   ");
      await user.click(screen.getByTestId("create-project-submit"));

      expect(screen.getByText("Project name is required")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击 Cancel 应调用 onOpenChange(false)", () => {
      const onOpenChange = vi.fn();
      render(<CreateProjectDialog open={true} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("提交有效表单应调用 createAndSetCurrent", async () => {
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

    it("点击 Create Template 应to open CreateTemplateDialog", async () => {
      const user = userEvent.setup();
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      await user.click(screen.getByText("Create Template"));

      expect(screen.getByTestId("create-template-dialog")).toBeInTheDocument();
    });

    it("默认模板后到达时应同步为可提交的 preset", async () => {
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

    it("User手动Select模板后不应被默认模板同步覆盖", async () => {
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
        expect(createAndSetCurrent).toHaveBeenCalledWith({
          name: "New Project",
          description: "",
          type: undefined,
          template: {
            kind: "builtin",
            id: "short-story",
          },
          coverImage: null,
          cropArea: null,
        });
      });
    });
  });
});

describe("CreateProjectDialog — error and edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    templateStoreState = createMockTemplateState();
  });

  // ===========================================================================
  // 错误状态测试
  // ===========================================================================
  describe("错误状态", () => {
    it("有错误时应显示错误Info", async () => {
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

    it("ProjectCreateGo back错误时应显示可见错误并记录诊断上下文", async () => {
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

    it("ProjectCreate抛异常时应展示错误并输出诊断日志", async () => {
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
  // 提交中状态测试
  // ===========================================================================
  describe("提交中状态", () => {
    it("提交时 Create 按钮应显示 loading", async () => {
      const { useProjectStore } = await import("../../stores/projectStore");
      const createAndSetCurrent = vi.fn(
        () =>
          new Promise<{
            ok: true;
            data: { projectId: string; rootPath: string };
          }>(() => {}),
      ); // Never resolves
      vi.mocked(useProjectStore).mockImplementation((selector) => {
        const state = createMockProjectState({ createAndSetCurrent });
        return selector(state);
      });

      const user = userEvent.setup();
      render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

      await user.type(
        screen.getByTestId("create-project-name"),
        "Test Project",
      );
      await user.click(screen.getByTestId("create-project-submit"));

      await waitFor(() => {
        expect(screen.getByText("Creating…")).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 清理测试
  // ===========================================================================
  describe("清理", () => {
    it("Close时应Clear错误", async () => {
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

  // ===========================================================================
  // PM1-S3 AI Assisted降级测试
  // ===========================================================================
  describe("AI Assisted降级", () => {
    it("should show fallback message and keep manual mode available", async () => {
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
});
