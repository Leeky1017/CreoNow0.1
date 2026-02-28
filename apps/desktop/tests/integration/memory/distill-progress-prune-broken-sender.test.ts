import assert from "node:assert/strict";

import Database from "better-sqlite3";
import type { IpcResponse } from "@shared/types/ipc-generated";
import { registerMemoryIpcHandlers } from "../../../main/src/ipc/memory";

import type { IpcMain } from "electron";

// Scenario Mapping: memory distill progress stale subscriber pruning
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

  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY
    );

    CREATE TABLE memory_episodes (
      episode_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      version INTEGER NOT NULL,
      chapter_id TEXT NOT NULL,
      scene_type TEXT NOT NULL,
      skill_used TEXT NOT NULL,
      input_context TEXT NOT NULL,
      candidates_json TEXT NOT NULL,
      selected_index INTEGER NOT NULL,
      final_text TEXT NOT NULL,
      explicit_feedback TEXT,
      edit_distance REAL NOT NULL,
      implicit_signal TEXT NOT NULL,
      implicit_weight REAL NOT NULL,
      importance REAL NOT NULL,
      recall_count INTEGER NOT NULL DEFAULT 0,
      last_recalled_at INTEGER,
      compressed INTEGER NOT NULL DEFAULT 0,
      user_confirmed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE memory_semantic_placeholders (
      rule_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      version INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'style',
      rule_text TEXT NOT NULL,
      confidence REAL NOT NULL,
      supporting_episodes_json TEXT NOT NULL DEFAULT '[]',
      contradicting_episodes_json TEXT NOT NULL DEFAULT '[]',
      user_confirmed INTEGER NOT NULL DEFAULT 0,
      user_modified INTEGER NOT NULL DEFAULT 0,
      conflict_marked INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  db.prepare("INSERT INTO projects(project_id) VALUES (?)").run("proj-1");

  let sendCalls = 0;
  const brokenSender = {
    id: 7,
    send: () => {
      sendCalls += 1;
      throw new Error("webContents destroyed");
    },
  };

  registerMemoryIpcHandlers({
    ipcMain: ipcMain as unknown as IpcMain,
    db,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    distillScheduler: (job) => job(),
    distillLlm: () => [
      {
        rule: "动作场景偏好短句",
        category: "pacing",
        confidence: 0.9,
        supportingEpisodes: [],
        contradictingEpisodes: [],
      },
    ],
  });

  const listHandler = handlers.get("memory:semantic:list");
  const recordHandler = handlers.get("memory:episode:record");
  const distillHandler = handlers.get("memory:semantic:distill");
  assert.ok(listHandler, "Missing handler memory:semantic:list");
  assert.ok(recordHandler, "Missing handler memory:episode:record");
  assert.ok(distillHandler, "Missing handler memory:semantic:distill");

  await listHandler!({ sender: brokenSender }, { projectId: "proj-1" });

  for (let i = 0; i < 50; i += 1) {
    const response = (await recordHandler!(
      {},
      {
        projectId: "proj-1",
        chapterId: `chapter-${i}`,
        sceneType: "action",
        skillUsed: "continue",
        inputContext: "动作场景上下文",
        candidates: ["A", "B"],
        selectedIndex: 0,
        finalText: `片段-${i}`,
        editDistance: 0.1,
      },
    )) as IpcResponse<{ accepted: true }>;
    assert.equal(response.ok, true);
  }

  const firstDistill = (await distillHandler!(
    {},
    { projectId: "proj-1", trigger: "manual" },
  )) as IpcResponse<{ accepted: true; runId: string }>;

  const sendCallsAfterFirstDistill = sendCalls;

  const secondDistill = (await distillHandler!(
    {},
    { projectId: "proj-1", trigger: "manual" },
  )) as IpcResponse<{ accepted: true; runId: string }>;

  assert.equal(firstDistill.ok, true);
  assert.equal(secondDistill.ok, true);
  assert.equal(sendCallsAfterFirstDistill, 1);
  assert.equal(
    sendCalls,
    sendCallsAfterFirstDistill,
    "broken sender should be pruned after first failed send",
  );

  db.close();
}
