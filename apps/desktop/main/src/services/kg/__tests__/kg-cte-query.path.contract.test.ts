import assert from "node:assert/strict";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import {
  createKnowledgeGraphService,
  type KnowledgeGraphService,
} from "../kgService";

const logger: Logger = {
  logPath: "<test>",
  info: () => {},
  error: () => {},
};

function createTestHarness(): {
  db: Database.Database;
  projectId: string;
  service: KnowledgeGraphService;
  close: () => void;
} {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY
    );

    CREATE TABLE kg_entities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      attributes_json TEXT NOT NULL DEFAULT '{}',
      last_seen_state TEXT,
      ai_context_level TEXT NOT NULL DEFAULT 'when_detected',
      aliases TEXT NOT NULL DEFAULT '[]',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE kg_relations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_entity_id TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
      FOREIGN KEY(source_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE,
      FOREIGN KEY(target_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX idx_kg_entities_project_type_name
      ON kg_entities(project_id, type, lower(trim(name)));
  `);

  const projectId = "proj-kgq-s2";
  db.prepare("INSERT INTO projects (project_id) VALUES (?)").run(projectId);

  return {
    db,
    projectId,
    service: createKnowledgeGraphService({ db, logger }),
    close: () => db.close(),
  };
}

function createEntity(args: {
  service: KnowledgeGraphService;
  projectId: string;
  name: string;
}): string {
  const created = args.service.entityCreate({
    projectId: args.projectId,
    type: "character",
    name: args.name,
    description: `${args.name}-desc`,
  });

  assert.equal(created.ok, true);
  if (!created.ok) {
    assert.fail(`entityCreate failed for ${args.name}`);
  }

  return created.data.id;
}

function insertRelation(args: {
  db: Database.Database;
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  createdAt: string;
}): void {
  args.db
    .prepare(
      "INSERT INTO kg_relations (id, project_id, source_entity_id, target_entity_id, relation_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      args.id,
      args.projectId,
      args.sourceEntityId,
      args.targetEntityId,
      "ally",
      "",
      args.createdAt,
    );
}

// BE-KGQ-S2
// queryPath should return shortest path and stop expansions once a shortest path is discovered
{
  const harness = createTestHarness();
  try {
    const sourceEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "source-s2",
    });
    const targetEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "target-s2",
    });
    const branchEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "branch-s2",
    });
    const branch2EntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "branch2-s2",
    });
    const branch3EntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "branch3-s2",
    });

    insertRelation({
      db: harness.db,
      id: "r-s2-target",
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId,
      createdAt: "2026-02-24T10:00:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s2-branch",
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId: branchEntityId,
      createdAt: "2026-02-24T10:00:01.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s2-branch2",
      projectId: harness.projectId,
      sourceEntityId: branchEntityId,
      targetEntityId: branch2EntityId,
      createdAt: "2026-02-24T10:00:02.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s2-branch3",
      projectId: harness.projectId,
      sourceEntityId: branch2EntityId,
      targetEntityId: branch3EntityId,
      createdAt: "2026-02-24T10:00:03.000Z",
    });

    const queried = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId,
      timeoutMs: 500,
      maxDepth: 4,
      maxExpansions: 4,
    });

    assert.equal(queried.ok, true);
    if (!queried.ok) {
      assert.fail("queryPath should succeed");
    }

    assert.deepEqual(queried.data.pathEntityIds, [
      sourceEntityId,
      targetEntityId,
    ]);
    assert.equal(queried.data.expansions <= 2, true);
    assert.equal(queried.data.degraded, false);
    assert.equal(queried.data.queryCostMs >= 0, true);
  } finally {
    harness.close();
  }
}

// BE-KGQ-S2
// queryPath should enforce caller-provided maxExpansions with stable overflow semantics.
{
  const harness = createTestHarness();
  try {
    const sourceEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "source-s2-exp-limit",
    });
    const middleEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "middle-s2-exp-limit",
    });
    const targetEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "target-s2-exp-limit",
    });

    insertRelation({
      db: harness.db,
      id: "r-s2-exp-1",
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId: middleEntityId,
      createdAt: "2026-02-24T10:01:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s2-exp-2",
      projectId: harness.projectId,
      sourceEntityId: middleEntityId,
      targetEntityId,
      createdAt: "2026-02-24T10:01:01.000Z",
    });

    const queried = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId,
      timeoutMs: 500,
      maxExpansions: 1,
    });

    assert.equal(queried.ok, false);
    if (queried.ok) {
      assert.fail("expected maxExpansions violation");
    }

    assert.equal(queried.error.code, "KG_QUERY_TIMEOUT");
    const details = queried.error.details as
      | {
          reason?: string;
          maxExpansions?: number;
          expansions?: number;
        }
      | undefined;
    assert.equal(details?.reason, "MAX_EXPANSIONS_EXCEEDED");
    assert.equal(details?.maxExpansions, 1);
    assert.equal(details?.expansions, 2);
  } finally {
    harness.close();
  }
}

// BE-KGQ-S2
// queryPath should enforce caller-provided maxDepth with stable overflow semantics.
{
  const harness = createTestHarness();
  try {
    const sourceEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "source-s2-depth-limit",
    });
    const middleEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "middle-s2-depth-limit",
    });
    const targetEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "target-s2-depth-limit",
    });

    insertRelation({
      db: harness.db,
      id: "r-s2-depth-1",
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId: middleEntityId,
      createdAt: "2026-02-24T10:02:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s2-depth-2",
      projectId: harness.projectId,
      sourceEntityId: middleEntityId,
      targetEntityId,
      createdAt: "2026-02-24T10:02:01.000Z",
    });

    const queried = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId,
      targetEntityId,
      timeoutMs: 500,
      maxDepth: 1,
      maxExpansions: 8,
    });

    assert.equal(queried.ok, false);
    if (queried.ok) {
      assert.fail("expected maxDepth violation");
    }

    assert.equal(queried.error.code, "KG_QUERY_TIMEOUT");
    const details = queried.error.details as
      | {
          reason?: string;
          maxDepth?: number;
          depth?: number;
        }
      | undefined;
    assert.equal(details?.reason, "MAX_DEPTH_EXCEEDED");
    assert.equal(details?.maxDepth, 1);
    assert.equal(details?.depth, 2);
  } finally {
    harness.close();
  }
}
