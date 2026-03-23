import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
const moveToFolder = vi.fn();
const openDocument = vi.fn();
const openCurrentDocumentForProject = vi.fn();
const FILE_TREE_EXIT_DELAY_MS = 150;

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

describe("FileTreePanel context menu actions", () => {
  beforeEach(() => {
    fileItems = [
      {
        documentId: "doc-1",
        title: "Untitled Chapter",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "folder-1",
        title: "第一卷",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
      },
    ];

    createAndSetCurrent.mockReset().mockResolvedValue({
      ok: true,
      data: { documentId: "doc-copy" },
    });
    rename.mockReset().mockResolvedValue({ ok: true });
    updateStatus.mockReset().mockResolvedValue({
      ok: true,
      data: { updated: true, status: "final" },
    });
    deleteDoc.mockReset().mockResolvedValue({ ok: true });
    setCurrent.mockReset().mockResolvedValue({ ok: true });
    clearError.mockReset();
    moveToFolder
      .mockReset()
      .mockResolvedValue({ ok: true, data: { updated: true } });
    openDocument.mockReset().mockResolvedValue({ ok: true });
    openCurrentDocumentForProject.mockReset().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show rename/delete/copy/move/status actions and invoke corresponding operations", async () => {
    await renderFileTreePanel("proj-1");

    await act(async () => {
      fireEvent.contextMenu(screen.getByTestId("file-row-doc-1"));
    });

    const renameItem = await screen.findByRole("menuitem", { name: "Rename" });
    const deleteItem = await screen.findByRole("menuitem", { name: "Delete" });
    const copyItem = await screen.findByRole("menuitem", { name: "Copy" });
    const moveItem = await screen.findByRole("menuitem", {
      name: "Move to Folder",
    });
    const historyItem = await screen.findByRole("menuitem", {
      name: "Version History",
    });
    const statusItem = await screen.findByRole("menuitem", {
      name: "Mark as Final",
    });

    expect(renameItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();
    expect(copyItem).toBeInTheDocument();
    expect(moveItem).toBeInTheDocument();
    expect(historyItem).toBeInTheDocument();
    expect(statusItem).toBeInTheDocument();

    fireEvent.click(copyItem);
    await flushFileTreeAsyncUpdates();

    expect(createAndSetCurrent).toHaveBeenCalledWith({
      projectId: "proj-1",
      type: "chapter",
      title: "Untitled Chapter Copy",
    });

    await act(async () => {
      fireEvent.contextMenu(screen.getByTestId("file-row-doc-1"));
    });

    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Move to Folder" }),
    );
    await flushFileTreeAsyncUpdates();

    expect(moveToFolder).toHaveBeenCalledWith({
      projectId: "proj-1",
      documentId: "doc-1",
      parentId: "folder-1",
    });
  });

  it("should apply exit animation before delete completes", async () => {
    deleteDoc.mockImplementation(
      async ({ documentId }: { documentId: string }) => {
        fileItems = fileItems.filter((item) => item.documentId !== documentId);
        return { ok: true };
      },
    );

    await renderFileTreePanel("proj-1");

    await act(async () => {
      fireEvent.contextMenu(screen.getByTestId("file-row-doc-1"));
    });

    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const confirmDeleteButton = await screen.findByTestId(
      "system-dialog-primary",
    );

    vi.useFakeTimers();
    fireEvent.click(confirmDeleteButton);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const rowContainer = screen.getByTestId("file-row-doc-1")
      .parentElement as HTMLElement;
    expect(rowContainer).toHaveClass("list-item-exit");
    expect(deleteDoc).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FILE_TREE_EXIT_DELAY_MS - 1);
    });

    expect(deleteDoc).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(deleteDoc).toHaveBeenCalledWith({
      projectId: "proj-1",
      documentId: "doc-1",
    });
    expect(screen.queryByTestId("file-row-doc-1")).not.toBeInTheDocument();
    expect(openCurrentDocumentForProject).toHaveBeenCalledWith("proj-1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  });
});
