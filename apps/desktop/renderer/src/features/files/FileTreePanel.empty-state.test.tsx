import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { FileTreePanel } from "./FileTreePanel";

const createAndSetCurrent = vi.fn();
const rename = vi.fn();
const updateStatus = vi.fn();
const deleteDoc = vi.fn();
const setCurrent = vi.fn();
const clearError = vi.fn();
const openDocument = vi.fn();
const openCurrentDocumentForProject = vi.fn();

vi.mock("../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      items: [],
      currentDocumentId: null,
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

async function renderFileTreePanel(projectId: string): Promise<void> {
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

describe("FileTreePanel empty state", () => {
  beforeEach(() => {
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

  it("should render empty state message and new file entry action when no documents exist", async () => {
    await renderFileTreePanel("proj-empty");

    expect(
      screen.getByText("暂无文件"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("开始创建你的第一个文件"),
    ).toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: "新建文件" });
    fireEvent.click(createButton);
    await flushFileTreeAsyncUpdates();

    expect(createAndSetCurrent).toHaveBeenCalledWith({
      projectId: "proj-empty",
      type: "chapter",
    });
  });
});
