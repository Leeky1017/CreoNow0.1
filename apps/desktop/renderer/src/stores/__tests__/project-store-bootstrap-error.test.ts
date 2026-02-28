import { describe, expect, it } from "vitest";

import { createProjectStore, type IpcInvoke } from "../projectStore";

describe("project store bootstrap error boundary", () => {
  it("captures invoke throw as INTERNAL error", async () => {
    const invoke: IpcInvoke = async (channel) => {
      if (channel === "project:project:getcurrent") {
        throw new Error("ipc bridge unavailable");
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createProjectStore({ invoke });

    await store.getState().bootstrap();

    const state = store.getState();
    expect(state.bootstrapStatus).toBe("error");
    expect(state.lastError).toMatchObject({
      code: "INTERNAL",
      message: "ipc bridge unavailable",
    });
  });
});
