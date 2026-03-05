import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StatusBar } from "./StatusBar";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../../stores/fileStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";

function createMockIpc() {
  return {
    invoke: vi.fn(async () => ({
      ok: true,
      data: { items: [], settings: {}, content: "" },
    })),
    on: (): (() => void) => () => {},
  };
}

function renderStatusBarFixture() {
  const ipc = createMockIpc();
  const projectStore = createProjectStore(
    ipc as Parameters<typeof createProjectStore>[0],
  );
  const fileStore = createFileStore(
    ipc as Parameters<typeof createFileStore>[0],
  );
  const editorStore = createEditorStore(
    ipc as Parameters<typeof createEditorStore>[0],
  );

  const view = render(
    <ProjectStoreProvider store={projectStore}>
      <FileStoreProvider store={fileStore}>
        <EditorStoreProvider store={editorStore}>
          <StatusBar />
        </EditorStoreProvider>
      </FileStoreProvider>
    </ProjectStoreProvider>,
  );

  return { view, projectStore, fileStore, editorStore };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("StatusBar", () => {
  it("should show project/document/word-count/time when context is ready", () => {
    const { projectStore, fileStore, editorStore } = renderStatusBarFixture();

    act(() => {
      projectStore.setState({
        current: { projectId: "project-1", rootPath: "/tmp/project-1" },
        items: [
          {
            projectId: "project-1",
            name: "暗流",
            rootPath: "/tmp/project-1",
            updatedAt: 1700000000000,
          },
        ],
      });
    });
    act(() => {
      fileStore.setState({
        currentDocumentId: "doc-1",
        items: [
          {
            documentId: "doc-1",
            title: "第三章",
            status: "draft",
            type: "chapter",
            sortOrder: 0,
            updatedAt: 1700000000000,
          },
        ],
      });
    });
    act(() => {
      editorStore.setState({
        documentId: "doc-1",
        documentCharacterCount: 3250,
        autosaveStatus: "idle",
      });
    });

    expect(screen.getByTestId("status-project-name")).toHaveTextContent("暗流");
    expect(screen.getByTestId("status-document-name")).toHaveTextContent(
      "第三章",
    );
    expect(screen.getByTestId("status-word-count")).toHaveTextContent(
      "3,250 chars",
    );
    expect(screen.getByTestId("editor-autosave-status")).toHaveTextContent("");
    expect(screen.getByTestId("status-current-time").textContent ?? "").toMatch(
      /^\d{2}:\d{2}$/,
    );
  });

  it("should follow autosave state machine: saving -> saved -> idle", () => {
    vi.useFakeTimers();
    const { editorStore } = renderStatusBarFixture();

    act(() => {
      editorStore.setState({ autosaveStatus: "saving" });
    });
    expect(screen.getByTestId("editor-autosave-status")).toHaveTextContent(
      "Saving...",
    );

    act(() => {
      editorStore.setState({ autosaveStatus: "saved" });
    });
    expect(screen.getByTestId("editor-autosave-status")).toHaveTextContent(
      "Saved",
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("editor-autosave-status")).toHaveTextContent("");
  });

  it("should allow retry from error state", () => {
    const { editorStore } = renderStatusBarFixture();
    const retryLastAutosave = vi.fn().mockResolvedValue(undefined);

    act(() => {
      editorStore.setState({
        autosaveStatus: "error",
        retryLastAutosave,
      });
    });

    const indicator = screen.getByTestId("editor-autosave-status");
    expect(indicator).toHaveTextContent("Save failed");
    fireEvent.click(indicator);

    expect(retryLastAutosave).toHaveBeenCalledTimes(1);
  });
});
