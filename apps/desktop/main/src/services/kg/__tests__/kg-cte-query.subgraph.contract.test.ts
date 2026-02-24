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

  const projectId = "proj-kgq-s1";
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

function capturePreparedSql<T>(args: { db: Database.Database; run: () => T }): {
  result: T;
  preparedSql: string[];
} {
  const trackedDb = args.db as unknown as {
    prepare: (sql: string, ...bindArgs: unknown[]) => unknown;
  };
  const originalPrepare = trackedDb.prepare.bind(args.db);
  const preparedSql: string[] = [];

  trackedDb.prepare = ((sql: string, ...bindArgs: unknown[]) => {
    preparedSql.push(sql);
    return originalPrepare(sql, ...bindArgs);
  }) as typeof trackedDb.prepare;

  try {
    return {
      result: args.run(),
      preparedSql,
    };
  } finally {
    trackedDb.prepare = originalPrepare as typeof trackedDb.prepare;
  }
}

function withEntityInPlaceholderLimit<T>(args: {
  db: Database.Database;
  maxPlaceholders: number;
  run: () => T;
}): { result: T; placeholderCounts: number[] } {
  const trackedDb = args.db as unknown as {
    prepare: (sql: string, ...bindArgs: unknown[]) => unknown;
  };
  const originalPrepare = trackedDb.prepare.bind(args.db);
  const placeholderCounts: number[] = [];

  trackedDb.prepare = ((sql: string, ...bindArgs: unknown[]) => {
    if (/FROM kg_entities WHERE id IN \(/i.test(sql)) {
      const placeholderCount = (sql.match(/\?/g) ?? []).length;
      placeholderCounts.push(placeholderCount);
      if (placeholderCount > args.maxPlaceholders) {
        throw new Error(
          `simulated placeholder limit exceeded: ${placeholderCount} > ${args.maxPlaceholders}`,
        );
      }
    }

    return originalPrepare(sql, ...bindArgs);
  }) as typeof trackedDb.prepare;

  try {
    return {
      result: args.run(),
      placeholderCounts,
    };
  } finally {
    trackedDb.prepare = originalPrepare as typeof trackedDb.prepare;
  }
}

// BE-KGQ-S1
// querySubgraph should respect maxDepth and expose node/edge/query metrics via recursive CTE query
{
  const harness = createTestHarness();
  try {
    const centerEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "center-s1",
    });
    const hop1EntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "hop1-s1",
    });
    const hop2EntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "hop2-s1",
    });
    const hop3EntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "hop3-s1",
    });

    insertRelation({
      db: harness.db,
      id: "r-s1-1",
      projectId: harness.projectId,
      sourceEntityId: centerEntityId,
      targetEntityId: hop1EntityId,
      createdAt: "2026-02-24T10:00:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s1-2",
      projectId: harness.projectId,
      sourceEntityId: hop1EntityId,
      targetEntityId: hop2EntityId,
      createdAt: "2026-02-24T10:00:01.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-s1-3",
      projectId: harness.projectId,
      sourceEntityId: hop2EntityId,
      targetEntityId: hop3EntityId,
      createdAt: "2026-02-24T10:00:02.000Z",
    });

    const captured = capturePreparedSql({
      db: harness.db,
      run: () =>
        harness.service.querySubgraph({
          projectId: harness.projectId,
          centerEntityId,
          k: 2,
        }),
    });

    assert.equal(captured.result.ok, true);
    if (!captured.result.ok) {
      assert.fail("querySubgraph should succeed");
    }

    assert.equal(captured.result.data.nodeCount, 3);
    assert.equal(captured.result.data.edgeCount, 2);
    assert.equal(captured.result.data.queryCostMs >= 0, true);

    const entityIds = captured.result.data.entities.map((entity) => entity.id);
    assert.deepEqual(
      [...entityIds].sort(),
      [centerEntityId, hop1EntityId, hop2EntityId].sort(),
    );

    const relationIds = captured.result.data.relations.map(
      (relation) => relation.id,
    );
    assert.deepEqual(relationIds.sort(), ["r-s1-1", "r-s1-2"]);

    const joinedSql = captured.preparedSql.join("\n");
    assert.match(joinedSql, /WITH\s+RECURSIVE/i);
  } finally {
    harness.close();
  }
}

// BE-KGQ-S1
// querySubgraph should avoid oversized IN placeholder lists by batching id lookups.
{
  const harness = createTestHarness();
  try {
    const centerEntityId = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "center-s1-batch",
    });

    for (let index = 0; index < 300; index += 1) {
      const hopEntityId = createEntity({
        service: harness.service,
        projectId: harness.projectId,
        name: `hop-batch-${index}`,
      });
      insertRelation({
        db: harness.db,
        id: `r-s1-batch-${index}`,
        projectId: harness.projectId,
        sourceEntityId: centerEntityId,
        targetEntityId: hopEntityId,
        createdAt: `2026-02-24T11:${String(index % 60).padStart(2, "0")}:00.000Z`,
      });
    }

    const placeholderCap = 256;
    const captured = withEntityInPlaceholderLimit({
      db: harness.db,
      maxPlaceholders: placeholderCap,
      run: () =>
        harness.service.querySubgraph({
          projectId: harness.projectId,
          centerEntityId,
          k: 1,
        }),
    });

    assert.equal(captured.result.ok, true);
    if (!captured.result.ok) {
      assert.fail("expected batched querySubgraph success");
    }

    assert.equal(captured.result.data.nodeCount, 301);
    assert.equal(captured.result.data.edgeCount, 300);
    assert.equal(captured.placeholderCounts.length >= 2, true);
    assert.equal(
      captured.placeholderCounts.every((count) => count <= placeholderCap),
      true,
      `expected all placeholder batches <= ${placeholderCap}, got [${captured.placeholderCounts.join(", ")}]`,
    );
  } finally {
    harness.close();
  }
}
