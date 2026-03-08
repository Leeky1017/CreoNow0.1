import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../stores/layoutStore", () => ({
  useLayoutStore: (selector: (s: { zenMode: boolean }) => unknown) =>
    selector({ zenMode: false }),
}));
import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

import {
  AiStoreProvider,
  createAiStore,
  type IpcInvoke,
} from "../../stores/aiStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";
import {
  VersionStoreProvider,
  createVersionStore,
  type IpcInvoke as VersionIpcInvoke,
} from "../../stores/versionStore";
import { EditorPane } from "./EditorPane";

function createReadyEditorStore() {
  const store = createEditorStore({
    invoke: async (channel, _payload) => {
      if (channel === "file:document:save") {
        return {
          ok: true,
          data: {
            contentHash: "hash-autosave",
            updatedAt: 101,
          },
        };
      }

      if (channel === "file:document:updatestatus") {
        return {
          ok: true,
          data: {
            updated: true,
            status: "draft",
          },
        };
      }

      throw new Error(`Unexpected channel: ${channel}`);
    },
  });

  store.setState({
    bootstrapStatus: "ready",
    projectId: "project-1",
    documentId: "doc-1",
    documentStatus: "draft",
    documentContentJson: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Initial text." }],
        },
      ],
    }),
    autosaveStatus: "idle",
    autosaveError: null,
  });

  return store;
}

function createVersionStoreForEditorPaneTests() {
  const invoke: VersionIpcInvoke = async () => {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "test stub",
      },
    };
  };

  return createVersionStore({
    invoke,
  });
}

function createAiStoreForWriteButtonTests(
  calls: Array<IpcRequest<"ai:skill:run">>,
) {
  const invoke: IpcInvoke = async <C extends IpcChannel>(
    channel: C,
    payload: IpcRequest<C>,
  ): Promise<IpcInvokeResult<C>> => {
    if (channel === "skill:registry:list") {
      return {
        ok: true,
        data: {
          items: [
            {
              id: "builtin:write",
              name: "Write",
              scope: "builtin",
              enabled: true,
              valid: true,
              source: "builtin",
              updatedAt: 1,
              error_code: null,
              error_message: null,
            },
          ],
        },
      } as unknown as IpcInvokeResult<C>;
    }

    if (channel === "ai:skill:run") {
      calls.push(payload as IpcRequest<"ai:skill:run">);
      return {
        ok: true,
        data: {
          executionId: "run-1",
          runId: "run-1",
          outputText: "continued text",
        },
      } as unknown as IpcInvokeResult<C>;
    }

    if (channel === "ai:skill:cancel") {
      return {
        ok: true,
        data: { runId: "run-1", canceled: true },
      } as unknown as IpcInvokeResult<C>;
    }

    throw new Error(`Unexpected AI channel: ${String(channel)}`);
  };

  return createAiStore({
    invoke,
  });
}

async function waitForEditorInstance(
  store: ReturnType<typeof createReadyEditorStore>,
) {
  await waitFor(() => {
    expect(store.getState().editor).not.toBeNull();
  });
  return store.getState().editor!;
}

describe("WriteButton", () => {
  it("S2-WB-1 should show write button group when editor cursor is in writable context", async () => {
    const runCalls: Array<IpcRequest<"ai:skill:run">> = [];
    const editorStore = createReadyEditorStore();
    const versionStore = createVersionStoreForEditorPaneTests();
    const aiStore = createAiStoreForWriteButtonTests(runCalls);

    render(
      <AiStoreProvider store={aiStore}>
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={editorStore}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>
      </AiStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(editorStore);
    act(() => {
      editor.commands.focus("end");
      editor.commands.setTextSelection({ from: 14, to: 14 });
    });

    fireEvent.mouseEnter(screen.getByTestId("editor-content-region"));

    expect(screen.getByTestId("write-button-group")).toBeInTheDocument();
    expect(screen.getByTestId("write-button-trigger")).toBeEnabled();
    expect(runCalls).toHaveLength(0);
  });

  it("S2-WB-2 should call write skill with minimal editor context when clicking write button", async () => {
    const runCalls: Array<IpcRequest<"ai:skill:run">> = [];
    const editorStore = createReadyEditorStore();
    const versionStore = createVersionStoreForEditorPaneTests();
    const aiStore = createAiStoreForWriteButtonTests(runCalls);

    render(
      <AiStoreProvider store={aiStore}>
        <VersionStoreProvider store={versionStore}>
          <EditorStoreProvider store={editorStore}>
            <EditorPane projectId="project-1" />
          </EditorStoreProvider>
        </VersionStoreProvider>
      </AiStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    await screen.findByTestId("tiptap-editor");

    const editor = await waitForEditorInstance(editorStore);
    act(() => {
      editor.commands.focus("end");
      editor.commands.setTextSelection({ from: 14, to: 14 });
    });

    fireEvent.mouseEnter(screen.getByTestId("editor-content-region"));
    fireEvent.click(screen.getByTestId("write-button-trigger"));

    await waitFor(() => {
      expect(runCalls).toHaveLength(1);
    });

    const firstCall = runCalls[0]!;
    expect(firstCall.skillId).toBe("builtin:write");
    expect(firstCall.context).toEqual({
      projectId: "project-1",
      documentId: "doc-1",
    });
    expect(firstCall.input).toContain("Initial text.");
  });
});
