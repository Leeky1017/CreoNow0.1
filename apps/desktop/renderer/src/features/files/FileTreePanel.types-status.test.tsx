import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { FileTreePanel } from "./FileTreePanel";

type DocType = "chapter" | "note" | "setting" | "timeline" | "character";
type DocStatus = "draft" | "final";

type FileItem = {
  documentId: string;
  title: string;
  updatedAt: number;
  type: DocType;
  status: DocStatus;
};

const createAndSetCurrent = vi.fn();
const rename = vi.fn();
const updateStatus = vi.fn();
const deleteDoc = vi.fn();
const setCurrent = vi.fn();
const clearError = vi.fn();
const openDocument = vi.fn();
const openCurrentDocumentForProject = vi.fn();

let fileItems: FileItem[] = [];

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: fileItems,
      currentDocumentId: fileItems[0]?.documentId ?? null,
      bootstrapStatus: "ready",
      lastError: null,
      createAndSetCurrent,
      rename,
      updateStatus,
      delete: deleteDoc,
      setCurrent,
      clearError,
    }),
  ),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        openDocument,
        openCurrentDocumentForProject,
      }),
  ),
}));

async function renderFileTreePanel(projectId = "proj-1"): Promise<void> {
  await act(async () => {
    render(<FileTreePanel projectId={projectId} />);
  });

  await waitFor(() => {
    expect(screen.getByTestId("sidebar-files")).toBeInTheDocument();
  });
}

async function flushFileTreeAsyncUpdates(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("FileTreePanel type/status baseline", () => {
  beforeEach(() => {
    fileItems = [];
    createAndSetCurrent.mockReset().mockResolvedValue({
      ok: true,
      data: { documentId: "doc-new" },
    });
    rename.mockReset().mockResolvedValue({ ok: true });
    updateStatus.mockReset().mockResolvedValue({
      ok: true,
      data: { updated: true, status: "draft" },
    });
    deleteDoc.mockReset().mockResolvedValue({ ok: true });
    setCurrent.mockReset().mockResolvedValue({ ok: true });
    clearError.mockReset();
    openDocument.mockReset().mockResolvedValue({ ok: true });
    openCurrentDocumentForProject.mockReset().mockResolvedValue({ ok: true });
  });

  it("should create chapter document from default create button", async () => {
    await renderFileTreePanel("proj-1");

    fireEvent.click(screen.getByTestId("file-create"));
    await flushFileTreeAsyncUpdates();

    expect(createAndSetCurrent).toHaveBeenCalledWith({
      projectId: "proj-1",
      type: "chapter",
    });
  });

  it("should render note type icon in file row", async () => {
    fileItems = [
      {
        documentId: "doc-note",
        title: "Note A",
        updatedAt: Date.now(),
        type: "note",
        status: "draft",
      },
    ];

    await renderFileTreePanel("proj-1");

    expect(screen.getByTestId("file-type-icon-doc-note")).toBeInTheDocument();
  });

  it("should render final status indicator in file row", async () => {
    fileItems = [
      {
        documentId: "doc-final",
        title: "Chapter Final",
        updatedAt: Date.now(),
        type: "chapter",
        status: "final",
      },
    ];

    await renderFileTreePanel("proj-1");

    expect(
      screen.getByTestId("file-status-final-doc-final"),
    ).toBeInTheDocument();
  });
});
