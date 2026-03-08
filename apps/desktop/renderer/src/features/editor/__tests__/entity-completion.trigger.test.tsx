import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../stores/layoutStore", () => ({
  useLayoutStore: (selector: (s: { zenMode: boolean }) => unknown) =>
    selector({ zenMode: false }),
}));
import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
  IpcResponseData,
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

type EntityItem = IpcResponseData<"knowledge:entity:list">["items"][number];

function createEntity(id: string, name: string): EntityItem {
  return {
    id,
    projectId: "project-1",
    name,
    type: "character",
    description: "",
    attributes: {},
    aliases: [],
    aiContextLevel: "always",
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-02-15T00:00:00.000Z",
    version: 1,
  };
}

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

describe("entity completion trigger", () => {
  it("S3-EC-S1 shows candidates and supports keyboard navigation + enter confirm", async () => {
    const store = createReadyEditorStore({
      entityListResult: {
        ok: true,
        data: {
          items: [createEntity("e-1", "Alice"), createEntity("e-2", "Aline")],
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
      editor.commands.insertContent("@Al");
    });

    await waitFor(() => {
      expect(screen.getByTestId("entity-completion-panel")).toBeInTheDocument();
    });
    expect(screen.getByTestId("entity-completion-item-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(() => {
      expect(screen.getByTestId("entity-completion-item-1")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => {
      expect(
        screen.queryByTestId("entity-completion-panel"),
      ).not.toBeInTheDocument();
    });
  });
});
