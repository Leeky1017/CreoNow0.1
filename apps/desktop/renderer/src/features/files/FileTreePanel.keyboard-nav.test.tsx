import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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
const openDocument = vi.fn();
const openCurrentDocumentForProject = vi.fn();

let fileItems: FileItem[] = [];

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: fileItems,
      currentDocumentId: "folder-1",
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

describe("FileTreePanel keyboard navigation", () => {
  beforeEach(() => {
    fileItems = [
      {
        documentId: "folder-1",
        title: "第一卷",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 0,
      },
      {
        documentId: "doc-in-folder",
        title: "卷内章节",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 1,
        parentId: "folder-1",
      },
      {
        documentId: "doc-root",
        title: "根章节",
        updatedAt: Date.now(),
        type: "chapter",
        status: "draft",
        sortOrder: 2,
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
    openDocument.mockReset().mockResolvedValue({ ok: true });
    openCurrentDocumentForProject.mockReset().mockResolvedValue({ ok: true });
  });

  it("should support Arrow/Enter/F2/Delete keyboard interactions for tree navigation", async () => {
    render(<FileTreePanel projectId="proj-1" />);

    const tree = screen.getByTestId("file-tree-list");
    tree.focus();

    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(
      screen.getByTestId("file-row-doc-in-folder").closest('[role="treeitem"]'),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tree, { key: "ArrowDown" });
    expect(
      screen.getByTestId("file-row-doc-root").closest('[role="treeitem"]'),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tree, { key: "ArrowUp" });
    expect(
      screen.getByTestId("file-row-doc-in-folder").closest('[role="treeitem"]'),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(
      screen.getByTestId("file-row-folder-1").closest('[role="treeitem"]'),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tree, { key: "Enter" });
    expect(openDocument).toHaveBeenCalledWith({
      projectId: "proj-1",
      documentId: "folder-1",
    });

    fireEvent.keyDown(tree, { key: "F2" });
    expect(
      screen.getByTestId("file-rename-input-folder-1"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("✕"));

    fireEvent.keyDown(tree, { key: "Delete" });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
