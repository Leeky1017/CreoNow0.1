import assert from "node:assert/strict";

import Database from "better-sqlite3";
import type { IpcMainInvokeEvent } from "electron";

import { registerKnowledgeGraphIpcHandlers } from "../../../main/src/ipc/knowledgeGraph";
import { createValidatedIpcMain } from "../../../main/src/ipc/runtime-validation";
import type { Logger } from "../../../main/src/logging/logger";

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code?: string; message?: string } };

type HandleListener = (
  event: IpcMainInvokeEvent,
  payload: unknown,
) => Promise<unknown> | unknown;

function createMockIpcMain() {
  const handlers = new Map<string, HandleListener>();

  return {
    handle(channel: string, listener: HandleListener): void {
      handlers.set(channel, listener);
    },
    async invoke(channel: string, payload: unknown): Promise<unknown> {
      const listener = handlers.get(channel);
      if (!listener) {
        throw new Error(`Missing handler: ${channel}`);
      }
      return await listener(
        {
          senderFrame: { url: "file:///index.html" },
          sender: { id: 1 },
        } as IpcMainInvokeEvent,
        payload,
      );
    },
  };
}

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function bootstrapKgSchema(db: Database.Database, projectId: string): void {
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS kg_entities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      attributes_json TEXT NOT NULL,
      last_seen_state TEXT,
      ai_context_level TEXT NOT NULL DEFAULT 'when_detected',
      aliases TEXT NOT NULL DEFAULT '[]',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_entities_project_type_name
      ON kg_entities(project_id, type, name);

    CREATE INDEX IF NOT EXISTS idx_kg_entities_project
      ON kg_entities(project_id);

    CREATE INDEX IF NOT EXISTS idx_kg_entities_project_type
      ON kg_entities(project_id, type);

    CREATE INDEX IF NOT EXISTS idx_kg_entities_project_name
      ON kg_entities(project_id, name);

    CREATE INDEX IF NOT EXISTS idx_kg_entities_project_context_level
      ON kg_entities(project_id, ai_context_level);
  `);

  db.prepare("INSERT INTO projects (project_id) VALUES (?)").run(projectId);
}

// IPC-KG-ALIASES-S1
// should return ok list result when entity response contains aliases
// IPC-KG-ALIASES-S2
// should accept aliases in knowledge entity create request payload
// IPC-KG-ALIASES-S3
// should accept aliases in knowledge entity update patch payload
// IPC-KG-ALIASES-S4
// should reject non-array aliases with VALIDATION_ERROR on knowledge entity create
async function main(): Promise<void> {
  const db = new Database(":memory:");
  const projectId = "proj-ipc-aliases";
  const now = "2026-02-13T00:00:00.000Z";

  bootstrapKgSchema(db, projectId);

  const rawIpcMain = createMockIpcMain();
  const logger = createNoopLogger();
  const validatedIpcMain = createValidatedIpcMain({
    ipcMain: rawIpcMain as unknown as Parameters<
      typeof createValidatedIpcMain
    >[0]["ipcMain"],
    logger,
  });

  registerKnowledgeGraphIpcHandlers({
    ipcMain: validatedIpcMain,
    db,
    logger,
  });

  db.prepare(
    "INSERT INTO kg_entities (id, project_id, type, name, description, attributes_json, last_seen_state, ai_context_level, aliases, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    "seed-1",
    projectId,
    "character",
    "linmo-seeded",
    "",
    "{}",
    null,
    "when_detected",
    JSON.stringify(["xiao-mo", "mo-ge"]),
    1,
    now,
    now,
  );

  const listRes = (await rawIpcMain.invoke("knowledge:entity:list", {
    projectId,
  })) as IpcResult<{ items: Array<{ id: string; aliases: string[] }> }>;

  if (!listRes.ok) {
    assert.equal(listRes.error?.code, "INTERNAL_ERROR");
    assert.fail(`expected ok list response, got ${listRes.error?.code}`);
  }
  const listedItems = listRes.data.items;
  assert.equal(listedItems.length, 1);
  assert.equal(listedItems[0]?.id, "seed-1");
  assert.deepEqual(listedItems[0]?.aliases, ["xiao-mo", "mo-ge"]);

  const createWithAliasesRes = (await rawIpcMain.invoke(
    "knowledge:entity:create",
    {
      projectId,
      type: "character",
      name: "linmo-created",
      aliases: ["xiao-mo-created"],
    },
  )) as IpcResult<{ aliases: string[] }>;

  if (!createWithAliasesRes.ok) {
    assert.fail(
      `expected create success, got ${createWithAliasesRes.error?.code}`,
    );
  }
  const createdEntity = createWithAliasesRes.data;
  assert.deepEqual(createdEntity.aliases, ["xiao-mo-created"]);

  db.prepare(
    "INSERT INTO kg_entities (id, project_id, type, name, description, attributes_json, last_seen_state, ai_context_level, aliases, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    "seed-2",
    projectId,
    "character",
    "linmo-updatable",
    "",
    "{}",
    null,
    "when_detected",
    JSON.stringify([]),
    1,
    now,
    now,
  );

  const updateWithAliasesRes = (await rawIpcMain.invoke(
    "knowledge:entity:update",
    {
      projectId,
      id: "seed-2",
      expectedVersion: 1,
      patch: {
        aliases: ["detective-lin", "mo-ge-updated"],
      },
    },
  )) as IpcResult<{ aliases: string[] }>;

  if (!updateWithAliasesRes.ok) {
    assert.fail(
      `expected update success, got ${updateWithAliasesRes.error?.code}`,
    );
  }
  const updatedEntity = updateWithAliasesRes.data;
  assert.deepEqual(updatedEntity.aliases, ["detective-lin", "mo-ge-updated"]);

  const invalidAliasesRes = (await rawIpcMain.invoke(
    "knowledge:entity:create",
    {
      projectId,
      type: "character",
      name: "linmo-invalid",
      aliases: "not-an-array",
    },
  )) as IpcResult<unknown>;

  assert.equal(invalidAliasesRes.ok, false);
  if (invalidAliasesRes.ok) {
    assert.fail("expected invalid aliases to be rejected");
  }
  assert.equal(invalidAliasesRes.error?.code, "VALIDATION_ERROR");

  db.close();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
