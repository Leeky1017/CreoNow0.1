import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { ProjectStore } from "../../stores/projectStore";
import type { ProjectTemplate } from "../../stores/templateStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        [...state.presets, ...state.customs].find((t) => t.id === id),
      ),
    clearError: vi.fn(),
  };
  return { ...state, ...overrides };
}

let mockProjectState = createMockProjectState();
let templateStoreState = createMockTemplateState();

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => selector(mockProjectState)),
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

describe("CreateProjectDialog — ImageCropper integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectState = createMockProjectState();
    templateStoreState = createMockTemplateState();
  });

  it("submits cover with crop metadata", async () => {
    const user = userEvent.setup();
    const createAndSetCurrent = vi.fn().mockResolvedValue({
      ok: true,
      data: { projectId: "p1", rootPath: "/p" },
    });
    mockProjectState = createMockProjectState({ createAndSetCurrent });

    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    // Fill in name (required)
    const nameInput = screen.getByTestId("create-project-name");
    await user.type(nameInput, "My Novel");

    // Upload a cover image via the hidden file input inside ImageUpload
    const file = new File(["(binary)"], "cover.png", { type: "image/png" });
    const fileInput = screen.getByTestId(
      "image-upload-input",
    ) as HTMLInputElement;

    await user.upload(fileInput, file);

    // After uploading, the ImageCropper should appear
    await waitFor(() => {
      expect(screen.getByTestId("image-cropper")).toBeInTheDocument();
    });

    // Submit the form
    const submitBtn = screen.getByTestId("create-project-submit");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(createAndSetCurrent).toHaveBeenCalled();
    });
  });

  it("does not show cropper when no image selected", () => {
    render(<CreateProjectDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.queryByTestId("image-cropper")).not.toBeInTheDocument();
  });
});
