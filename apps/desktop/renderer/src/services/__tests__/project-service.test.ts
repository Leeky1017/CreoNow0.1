import { describe, expect, it } from "vitest";

import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";

import { createProjectService } from "../projectService";

describe("projectService.switchProject (IPC-P2-S2)", () => {
  it("invokes IPC switch and returns a typed, normalized domain result", async () => {
    const calls: Array<{ channel: IpcChannel; payload: unknown }> = [];
    let getCurrentCalls = 0;

    const invoke = async <C extends IpcChannel>(
      channel: C,
      payload: IpcRequest<C>,
    ): Promise<IpcInvokeResult<C>> => {
      calls.push({ channel, payload });

      if (channel === "project:project:getcurrent") {
        const data =
          getCurrentCalls++ === 0
            ? { projectId: "from", rootPath: "/from" }
            : { projectId: "to", rootPath: "/to" };
        return { ok: true, data } as IpcInvokeResult<C>;
      }

      if (channel === "project:project:switch") {
        return {
          ok: true,
          data: { currentProjectId: "to", switchedAt: "2026-02-22T00:00:00Z" },
        } as IpcInvokeResult<C>;
      }

      throw new Error(`Unexpected channel: ${channel}`);
    };

    const service = createProjectService({
      invoke,
      getOperatorId: () => "renderer-test",
      createTraceId: () => "trace-test",
    });

    const result = await service.switchProject("to");

    expect(result).toEqual({
      ok: true,
      data: { projectId: "to", rootPath: "/to" },
    });

    expect(calls).toEqual([
      { channel: "project:project:getcurrent", payload: {} },
      {
        channel: "project:project:switch",
        payload: {
          projectId: "to",
          fromProjectId: "from",
          operatorId: "renderer-test",
          traceId: "trace-test",
        },
      },
      { channel: "project:project:getcurrent", payload: {} },
    ]);
  });
});
