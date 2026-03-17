import { describe, expect, it, vi } from "vitest";

import {
  createEditorSaveQueue,
  type EditorSaveRequest,
} from "./editorSaveQueue";

function createDeferred() {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

function makeRequest(patch: Partial<EditorSaveRequest>): EditorSaveRequest {
  return {
    projectId: "project-1",
    documentId: "doc-1",
    contentJson: '{"v":1}',
    actor: "auto",
    reason: "autosave",
    ...patch,
  };
}

describe("editorSaveQueue", () => {
  it("should insert manual-save ahead of queued autosaves without interrupting current task", async () => {
    const order: string[] = [];
    const firstTaskGate = createDeferred();
    let firstStarted = false;

    const queue = createEditorSaveQueue({
      executeSave: async (request) => {
        order.push(request.contentJson);
        if (!firstStarted) {
          firstStarted = true;
          await firstTaskGate.promise;
        }
      },
    });

    const auto1 = queue.enqueue(
      makeRequest({ contentJson: "auto-1", reason: "autosave", actor: "auto" }),
    );
    const auto2 = queue.enqueue(
      makeRequest({ contentJson: "auto-2", reason: "autosave", actor: "auto" }),
    );
    const manual = queue.enqueue(
      makeRequest({
        contentJson: "manual",
        reason: "manual-save",
        actor: "user",
      }),
    );

    await vi.waitFor(() => {
      expect(order).toEqual(["auto-1"]);
    });

    firstTaskGate.resolve();
    await Promise.all([auto1, auto2, manual]);

    expect(order).toEqual(["auto-1", "manual", "auto-2"]);
  });

  it("should execute queued saves serially", async () => {
    const order: string[] = [];
    const gates = [createDeferred(), createDeferred(), createDeferred()];
    let active = 0;
    let maxActive = 0;
    let nextGateIndex = 0;

    const queue = createEditorSaveQueue({
      executeSave: async (request) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        order.push(request.contentJson);

        const gate = gates[nextGateIndex];
        nextGateIndex += 1;
        await gate.promise;

        active -= 1;
      },
    });

    const first = queue.enqueue(makeRequest({ contentJson: "first" }));
    const second = queue.enqueue(makeRequest({ contentJson: "second" }));
    const third = queue.enqueue(makeRequest({ contentJson: "third" }));

    await vi.waitFor(() => {
      expect(order).toEqual(["first"]);
    });

    gates[0].resolve();
    await vi.waitFor(() => {
      expect(order).toEqual(["first", "second"]);
    });

    gates[1].resolve();
    await vi.waitFor(() => {
      expect(order).toEqual(["first", "second", "third"]);
    });

    gates[2].resolve();
    await Promise.all([first, second, third]);

    expect(maxActive).toBe(1);
  });

  it("should continue processing tasks after a task throws", async () => {
    const order: string[] = [];

    const queue = createEditorSaveQueue({
      executeSave: async (request) => {
        order.push(request.contentJson);
        if (request.contentJson === "fail") {
          throw new Error("save failed");
        }
      },
    });

    const failed = queue.enqueue(makeRequest({ contentJson: "fail" }));
    const after1 = queue.enqueue(makeRequest({ contentJson: "after-1" }));
    const after2 = queue.enqueue(makeRequest({ contentJson: "after-2" }));

    await expect(failed).resolves.toBeUndefined();
    await Promise.all([failed, after1, after2]);

    expect(order).toEqual(["fail", "after-1", "after-2"]);
  });

  it("should report unexpected save errors while keeping the queue alive", async () => {
    const onUnexpectedError = vi.fn();

    const queue = createEditorSaveQueue({
      executeSave: async (request) => {
        if (request.contentJson === "broken") {
          throw new Error("unexpected");
        }
      },
      onUnexpectedError,
    });

    const broken = queue.enqueue(makeRequest({ contentJson: "broken" }));
    const next = queue.enqueue(makeRequest({ contentJson: "next" }));

    await Promise.all([broken, next]);

    expect(onUnexpectedError).toHaveBeenCalledTimes(1);
    expect(onUnexpectedError).toHaveBeenCalledWith({
      request: expect.objectContaining({ contentJson: "broken" }),
      error: expect.any(Error),
    });
  });
});
