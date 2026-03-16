import assert from "node:assert/strict";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { registerMemoryIpcHandlers } from "../../../main/src/ipc/memory";
import {
  createEpisodicMemoryService,
  createInMemoryEpisodeRepository,
} from "../../../main/src/services/memory/episodicMemoryService";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

// Scenario: AC-3 conflict resolution flow should be enterable and completable
{
  const handlers = new Map<
    string,
    (event: unknown, payload: unknown) => Promise<unknown>
  >();
  const ipcMain = {
    handle: (
      channel: string,
      handler: (event: unknown, payload: unknown) => Promise<unknown>,
    ) => {
      handlers.set(channel, handler);
    },
  };

  const service = createEpisodicMemoryService({
    repository: createInMemoryEpisodeRepository(),
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    now: () => 1_700_000_000_000,
    distillLlm: () => [
      {
        rule: "动作场景偏好长句",
        category: "pacing",
        confidence: 0.9,
        supportingEpisodes: ["ep-a"],
        contradictingEpisodes: ["ep-b"],
      },
      {
        rule: "动作场景偏好短句",
        category: "pacing",
        confidence: 0.92,
        supportingEpisodes: ["ep-c"],
        contradictingEpisodes: ["ep-d"],
      },
    ],
  });

  registerMemoryIpcHandlers({
    ipcMain: ipcMain as unknown as IpcMain,
    db: {} as Database.Database,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    episodicService: service,
  });

  const distillHandler = handlers.get("memory:semantic:distill");
  const listHandler = handlers.get("memory:semantic:list");
  const resolveHandler = handlers.get("memory:conflict:resolve");
  assert.ok(distillHandler, "Missing handler memory:semantic:distill");
  assert.ok(listHandler, "Missing handler memory:semantic:list");
  assert.ok(resolveHandler, "Missing handler memory:conflict:resolve");

  const distill = (await distillHandler!(
    {},
    { projectId: "proj-1", trigger: "manual" },
  )) as IpcResponse<{ accepted: true }>;
  assert.equal(distill.ok, true);

  const listedBefore = (await listHandler!(
    {},
    { projectId: "proj-1" },
  )) as IpcResponse<{
    items: Array<{ id: string; rule: string }>;
    conflictQueue: Array<{
      id: string;
      ruleIds: string[];
      status: "pending" | "resolved";
    }>;
  }>;
  assert.equal(listedBefore.ok, true);
  if (!listedBefore.ok) {
    throw new Error("expected listedBefore.ok");
  }

  assert.equal(listedBefore.data.conflictQueue.length, 1);
  assert.equal(listedBefore.data.conflictQueue[0]!.status, "pending");
  const conflict = listedBefore.data.conflictQueue[0]!;
  const chosenRuleId = conflict.ruleIds[1]!;

  const resolved = (await resolveHandler!(
    {},
    {
      projectId: "proj-1",
      conflictId: conflict.id,
      chosenRuleId,
    },
  )) as IpcResponse<{
    item: { id: string; status: "pending" | "resolved" };
    keptRule: { id: string };
  }>;
  assert.equal(resolved.ok, true);
  if (!resolved.ok) {
    throw new Error("expected resolved.ok");
  }
  assert.equal(resolved.data.item.status, "resolved");
  assert.equal(resolved.data.keptRule.id, chosenRuleId);

  const listedAfter = (await listHandler!(
    {},
    { projectId: "proj-1" },
  )) as IpcResponse<{
    items: Array<{ id: string; rule: string }>;
    conflictQueue: Array<{
      id: string;
      ruleIds: string[];
      status: "pending" | "resolved";
    }>;
  }>;
  assert.equal(listedAfter.ok, true);
  if (!listedAfter.ok) {
    throw new Error("expected listedAfter.ok");
  }

  assert.equal(listedAfter.data.conflictQueue[0]!.status, "resolved");
  assert.equal(
    listedAfter.data.items.some((item) => item.id === chosenRuleId),
    true,
  );
  assert.equal(listedAfter.data.items.length, 1);
}
