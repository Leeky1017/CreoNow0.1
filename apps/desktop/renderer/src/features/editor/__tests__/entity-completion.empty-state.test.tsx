import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

import {
  EditorStoreProvider,
  createEditorStore,
  type IpcInvoke as EditorIpcInvoke,
} from "../../../stores/editorStore";
import {
  VersionStoreProvider,
  createVersionStore,
  type IpcInvoke as VersionIpcInvoke,
} from "../../../stores/versionStore";
import { EditorPane } from "../EditorPane";

function createVersionStoreForEditorPaneTests() {
  const invoke: VersionIpcInvoke = async (_channel, _payload) => {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "test stub" },
    };
  };
  return createVersionStore({ invoke });
}

function createReadyEditorStore(args: {
  entityListResult: IpcInvokeResult<"knowledge:entity:list">;
}) {
  const invoke: EditorIpcInvoke = async <C extends IpcChannel>(
    channel: C,
    payload: IpcRequest<C>,
  ): Promise<IpcInvokeResult<C>> => {
    if (channel === "knowledge:entity:list") {
      return args.entityListResult as IpcInvokeResult<C>;
    }
    if (channel === "file:document:save") {
      return {
        ok: true,
        data: { contentHash: "hash-1", updatedAt: 1 },
      } as IpcInvokeResult<C>;
    }
    if (channel === "file:document:updatestatus") {
      return {
        ok: true,
        data: { updated: true, status: "draft" },
      } as IpcInvokeResult<C>;
    }

    throw new Error(
      `Unexpected channel: ${String(channel)} payload=${JSON.stringify(payload)}`,
    );
  };

  const store = createEditorStore({ invoke });
  store.setState({
    bootstrapStatus: "ready",
    projectId: "project-1",
    documentId: "doc-1",
    documentStatus: "draft",
    documentContentJson: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Seed " }] },
      ],
    }),
    autosaveStatus: "idle",
    autosaveError: null,
  });
  return store;
}

async function waitForEditorInstance(
  store: ReturnType<typeof createReadyEditorStore>,
) {
  await waitFor(() => {
    expect(store.getState().editor).not.toBeNull();
  });
  return store.getState().editor!;
}

describe("entity completion empty/error states", () => {
  it("S3-EC-S3 shows deterministic empty state and keeps user input intact", async () => {
    const store = createReadyEditorStore({
      entityListResult: {
        ok: true,
        data: { items: [], totalCount: 0 },
      },
    });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("end");
      editor.commands.insertContent("@NoMatch");
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("entity-completion-empty-state"),
      ).toBeInTheDocument();
    });
    expect(editor.getText()).toContain("@NoMatch");
  });

  it("S3-EC-S3 shows deterministic error state and keeps user input intact", async () => {
    const store = createReadyEditorStore({
      entityListResult: {
        ok: false,
        error: {
          code: "KG_QUERY_TIMEOUT",
          message: "knowledge query timed out",
        },
      },
    });
    const versionStore = createVersionStoreForEditorPaneTests();

    render(
      <VersionStoreProvider store={versionStore}>
        <EditorStoreProvider store={store}>
          <EditorPane projectId="project-1" />
        </EditorStoreProvider>
      </VersionStoreProvider>,
    );

    await screen.findByTestId("editor-pane");
    const editor = await waitForEditorInstance(store);

    act(() => {
      editor.commands.focus("end");
      editor.commands.insertContent("@Error");
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("entity-completion-error-state"),
      ).toBeInTheDocument();
    });
    expect(editor.getText()).toContain("@Error");
  });
});
