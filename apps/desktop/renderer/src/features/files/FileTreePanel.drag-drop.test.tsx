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
  sortOrder: number;
  parentId?: string;
};

const createAndSetCurrent = vi.fn();
const rename = vi.fn();
const updateStatus = vi.fn();
const deleteDoc = vi.fn();
const setCurrent = vi.fn();
const clearError = vi.fn();
const reorder = vi.fn();
const moveToFolder = vi.fn();
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
      reorder,
      moveToFolder,
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

describe("FileTreePanel drag and folder hierarchy", () => {
  beforeEach(() => {
    fileItems = [
      {
        documentId: "doc-1",
        title: "第一章",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "doc-2",
        title: "第二章",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
      },
      {
        documentId: "doc-3",
        title: "第三章",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 2,
      },
      {
        documentId: "folder-1",
        title: "第一卷",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 3,
      },
      {
        documentId: "doc-side",
        title: "番外一",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 4,
      },
    ];

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
    reorder
      .mockReset()
      .mockResolvedValue({ ok: true, data: { updated: true } });
    moveToFolder
      .mockReset()
      .mockResolvedValue({ ok: true, data: { updated: true } });
    openDocument.mockReset().mockResolvedValue({ ok: true });
    openCurrentDocumentForProject.mockReset().mockResolvedValue({ ok: true });
  });

  it("should reorder sibling documents and persist via file:document:reorder", async () => {
    await renderFileTreePanel("proj-1");

    const source = screen.getByTestId("file-row-doc-3");
    const target = screen.getByTestId("file-row-doc-1");

    fireEvent.dragStart(source);
    await flushFileTreeAsyncUpdates();
    fireEvent.dragOver(target);
    await flushFileTreeAsyncUpdates();
    fireEvent.drop(target);
    await flushFileTreeAsyncUpdates();

    expect(reorder).toHaveBeenCalledWith({
      projectId: "proj-1",
      orderedDocumentIds: ["doc-3", "doc-1", "doc-2", "folder-1", "doc-side"],
    });
  });

  it("should move document into target folder and persist parentId", async () => {
    await renderFileTreePanel("proj-1");

    const source = screen.getByTestId("file-row-doc-side");
    const targetFolder = screen.getByTestId("file-row-folder-1");

    fireEvent.dragStart(source);
    await flushFileTreeAsyncUpdates();
    fireEvent.dragOver(targetFolder);
    await flushFileTreeAsyncUpdates();
    fireEvent.drop(targetFolder);
    await flushFileTreeAsyncUpdates();

    expect(moveToFolder).toHaveBeenCalledWith({
      projectId: "proj-1",
      documentId: "doc-side",
      parentId: "folder-1",
    });
  });
});
