import assert from "node:assert/strict";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import {
  createKnowledgeGraphService,
  type KnowledgeGraphService,
} from "../kgService";

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
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );
  `);

  const projectId = "proj-kg-validate-contract";
  db.prepare("INSERT INTO projects (project_id) VALUES (?)").run(projectId);

  const logger: Logger = {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };

  return {
    db,
    projectId,
    service: createKnowledgeGraphService({ db, logger }),
    close: () => db.close(),
  };
}

function seedLinearGraph(args: {
  db: Database.Database;
  projectId: string;
  nodeCount: number;
}): void {
  const now = new Date().toISOString();
  const insertEntity = args.db.prepare(
    "INSERT INTO kg_entities (id, project_id, type, name, description, attributes_json, last_seen_state, ai_context_level, aliases, version, created_at, updated_at) VALUES (?, ?, 'event', ?, '', '{}', NULL, 'when_detected', '[]', 1, ?, ?)",
  );
  const insertRelation = args.db.prepare(
    "INSERT INTO kg_relations (id, project_id, source_entity_id, target_entity_id, relation_type, description, created_at) VALUES (?, ?, ?, ?, 'next', '', ?)",
  );

  const insertGraph = args.db.transaction(() => {
    for (let i = 0; i < args.nodeCount; i += 1) {
      const entityId = `n-${i}`;
      insertEntity.run(entityId, args.projectId, `node-${i}`, now, now);

      if (i > 0) {
        insertRelation.run(
          `r-${i}`,
          args.projectId,
          `n-${i - 1}`,
          entityId,
          now,
        );
      }
    }
  });

  insertGraph();
}

// BE-KGQ-S3
// queryValidate should not overflow stack on deep chains when guarded iteratively
{
  const harness = createTestHarness();
  try {
    seedLinearGraph({
      db: harness.db,
      projectId: harness.projectId,
      nodeCount: 20000,
    });

    const result = harness.service.queryValidate({
      projectId: harness.projectId,
      maxDepth: 25000,
      maxVisited: 25000,
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      assert.fail("expected success");
    }

    assert.deepEqual(result.data.cycles, []);
    assert.equal(typeof result.data.queryCostMs, "number");
  } finally {
    harness.close();
  }
}

// BE-KGQ-S3
// queryValidate should enforce maxDepth with stable error semantics
{
  const harness = createTestHarness();
  try {
    seedLinearGraph({
      db: harness.db,
      projectId: harness.projectId,
      nodeCount: 32,
    });

    const result = harness.service.queryValidate({
      projectId: harness.projectId,
      maxDepth: 6,
      maxVisited: 64,
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected maxDepth violation");
    }

    assert.equal(result.error.code, "KG_QUERY_TIMEOUT");
    const details = result.error.details as
      | {
          reason?: string;
          maxDepth?: number;
          depth?: number;
        }
      | undefined;
    assert.equal(details?.reason, "MAX_DEPTH_EXCEEDED");
    assert.equal(details?.maxDepth, 6);
    assert.equal(typeof details?.depth, "number");
    assert.ok((details?.depth ?? 0) > 6);
  } finally {
    harness.close();
  }
}

// BE-KGQ-S3
// queryValidate should enforce maxVisited with stable error semantics
{
  const harness = createTestHarness();
  try {
    seedLinearGraph({
      db: harness.db,
      projectId: harness.projectId,
      nodeCount: 40,
    });

    const result = harness.service.queryValidate({
      projectId: harness.projectId,
      maxDepth: 64,
      maxVisited: 10,
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected maxVisited violation");
    }

    assert.equal(result.error.code, "KG_QUERY_TIMEOUT");
    const details = result.error.details as
      | {
          reason?: string;
          maxVisited?: number;
          visited?: number;
        }
      | undefined;
    assert.equal(details?.reason, "MAX_VISITED_EXCEEDED");
    assert.equal(details?.maxVisited, 10);
    assert.equal(details?.visited, 11);
  } finally {
    harness.close();
  }
}

// BE-KGQ-S3
// queryValidate should report cycle semantics for A->B->C->A.
{
  const harness = createTestHarness();
  try {
    const now = "2026-02-24T12:00:00.000Z";
    const insertEntity = harness.db.prepare(
      "INSERT INTO kg_entities (id, project_id, type, name, description, attributes_json, last_seen_state, ai_context_level, aliases, version, created_at, updated_at) VALUES (?, ?, 'event', ?, '', '{}', NULL, 'when_detected', '[]', 1, ?, ?)",
    );
    insertEntity.run("n-a", harness.projectId, "node-a", now, now);
    insertEntity.run("n-b", harness.projectId, "node-b", now, now);
    insertEntity.run("n-c", harness.projectId, "node-c", now, now);

    const insertRelation = harness.db.prepare(
      "INSERT INTO kg_relations (id, project_id, source_entity_id, target_entity_id, relation_type, description, created_at) VALUES (?, ?, ?, ?, 'next', '', ?)",
    );
    insertRelation.run("r-ab", harness.projectId, "n-a", "n-b", now);
    insertRelation.run("r-bc", harness.projectId, "n-b", "n-c", now);
    insertRelation.run("r-ca", harness.projectId, "n-c", "n-a", now);

    const result = harness.service.queryValidate({
      projectId: harness.projectId,
      maxDepth: 8,
      maxVisited: 8,
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      assert.fail("expected cycle detection success");
    }

    assert.equal(result.data.cycles.length >= 1, true);
    const cycle = result.data.cycles[0];
    assert.equal(cycle[0], cycle[cycle.length - 1]);
    assert.deepEqual([...new Set(cycle.slice(0, -1))].sort(), [
      "n-a",
      "n-b",
      "n-c",
    ]);
  } finally {
    harness.close();
  }
}
