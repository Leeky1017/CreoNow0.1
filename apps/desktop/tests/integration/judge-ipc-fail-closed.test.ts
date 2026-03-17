import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../../main/src/logging/logger";
import { registerJudgeIpcHandlers } from "../../main/src/ipc/judge";
import type { JudgeQualityService } from "../../main/src/services/ai/judgeQualityService";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type LoggedError = {
  code: string;
  context: Record<string, unknown> | undefined;
};

function createLogger(loggedErrors: LoggedError[]): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: (code, context) => {
      loggedErrors.push({ code, context });
    },
  };
}

async function invokeEvaluate(args: {
  evaluate: JudgeQualityService["evaluate"];
  senderSend: (channel: string, payload: unknown) => void;
}): Promise<IpcResponse<{ accepted: true }>> {
  const handlers = new Map<string, Handler>();
  const loggedErrors: LoggedError[] = [];

  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  registerJudgeIpcHandlers({
    ipcMain,
    judgeService: {
      getState: () => ({ status: "ready" }),
      ensure: async () => ({ ok: true, data: { status: "ready" } }),
    },
    judgeQualityService: {
      evaluate: args.evaluate,
    },
    logger: createLogger(loggedErrors),
  });

  const evaluate = handlers.get("judge:quality:evaluate");
  assert.ok(
    evaluate,
    "expected judge:quality:evaluate handler to be registered",
  );
  if (!evaluate) {
    throw new Error("missing judge:quality:evaluate handler");
  }

  const response = (await evaluate(
    {
      sender: {
        send: args.senderSend,
      },
    },
    {
      projectId: "project-judge-fail-closed",
      traceId: "trace-judge-fail-closed",
      text: "一段测试文本",
      contextSummary: "严格第一人称叙述",
    },
  )) as IpcResponse<{ accepted: true }>;

  return response;
}

const senderFailureResponse = await invokeEvaluate({
  evaluate: async () => ({
    ok: true,
    data: {
      severity: "low",
      labels: [],
      summary: "ok",
      partialChecksSkipped: false,
    },
  }),
  senderSend: () => {
    throw new Error("webContents destroyed");
  },
});

assert.equal(senderFailureResponse.ok, false);
assert.equal(senderFailureResponse.error?.code, "INTERNAL_ERROR");
assert.equal(
  senderFailureResponse.error?.message,
  "Failed to push judge result",
);

const evaluateThrowResponse = await invokeEvaluate({
  evaluate: async () => {
    throw new Error("unexpected judge failure");
  },
  senderSend: () => {},
});

assert.equal(evaluateThrowResponse.ok, false);
assert.equal(evaluateThrowResponse.error?.code, "INTERNAL_ERROR");
assert.equal(
  evaluateThrowResponse.error?.message,
  "Failed to evaluate judge quality",
);
