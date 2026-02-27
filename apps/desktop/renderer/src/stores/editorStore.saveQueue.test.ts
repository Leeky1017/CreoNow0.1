import { beforeEach, describe, expect, it, vi } from "vitest";

const { enqueueMock, createEditorSaveQueueMock } = vi.hoisted(() => {
  const enqueue = vi.fn<
    (request: {
      projectId: string;
      documentId: string;
      contentJson: string;
      actor: "user" | "auto";
      reason: "manual-save" | "autosave";
    }) => Promise<void>
  >();

  const createQueue = vi.fn(() => ({
    enqueue,
  }));

  return {
    enqueueMock: enqueue,
    createEditorSaveQueueMock: createQueue,
  };
});

vi.mock("./editorSaveQueue", () => ({
  createEditorSaveQueue: createEditorSaveQueueMock,
}));

import { createEditorStore, type IpcInvoke } from "./editorStore";

describe("editorStore save queue delegation", () => {
  beforeEach(() => {
    enqueueMock.mockReset();
    enqueueMock.mockResolvedValue(undefined);
    createEditorSaveQueueMock.mockClear();
  });

  it("should delegate save requests to editorSaveQueue", async () => {
    const invoke: IpcInvoke = async (channel) => {
      throw new Error(`Unexpected invoke in mocked queue test: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    const request = {
      projectId: "project-1",
      documentId: "doc-1",
      contentJson: '{"v":1}',
      actor: "auto" as const,
      reason: "autosave" as const,
    };

    await store.getState().save(request);

    expect(createEditorSaveQueueMock).toHaveBeenCalledTimes(1);
    expect(createEditorSaveQueueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        executeSave: expect.any(Function),
        onUnexpectedError: expect.any(Function),
      }),
    );
    expect(enqueueMock).toHaveBeenCalledTimes(1);
    expect(enqueueMock).toHaveBeenCalledWith(request);
  });
  it("should map queue unexpected errors to autosave error state for current document", () => {
    const invoke: IpcInvoke = async (channel) => {
      throw new Error(`Unexpected invoke in mocked queue test: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    store.setState({ projectId: "project-1", documentId: "doc-1" });

    const queueFactoryCall = createEditorSaveQueueMock.mock.calls.at(0);
    expect(queueFactoryCall).toBeDefined();

    const queueDeps = (queueFactoryCall as unknown[] | undefined)?.[0] as
      | {
          onUnexpectedError?: (
            error: unknown,
            request: { projectId: string; documentId: string },
          ) => void;
        }
      | undefined;

    queueDeps?.onUnexpectedError?.(
      new Error("queue failed"),
      {
        projectId: "project-1",
        documentId: "doc-1",
      },
    );

    expect(store.getState().autosaveStatus).toBe("error");
    expect(store.getState().autosaveError).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "queue failed",
    });
  });

});
