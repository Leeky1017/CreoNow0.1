import assert from "node:assert/strict";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import {
  createKnowledgeGraphService,
  type KnowledgeGraphService,
} from "../kgService";

function describe(_name: string, fn: () => void): void {
  fn();
}

describe("kg-scale-query-safety contract", () => {});

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

  const projectId = "proj-scale-safety";
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

// ---------------------------------------------------------------------------
// AC-1: Entity list pagination
// ---------------------------------------------------------------------------
// entityList with limit returns at most `limit` items and includes totalCount
{
  const harness = createTestHarness();
  try {
    // Create 5 entities
    for (let i = 0; i < 5; i++) {
      createEntity({
        service: harness.service,
        projectId: harness.projectId,
        name: `entity-${i}`,
      });
    }

    // Request first page with limit=2
    const page1 = harness.service.entityList({
      projectId: harness.projectId,
      limit: 2,
      offset: 0,
    });
    assert.equal(page1.ok, true);
    if (!page1.ok) assert.fail("entityList page1 failed");
    assert.equal(page1.data.items.length, 2, "page1 should have 2 items");
    assert.equal(page1.data.totalCount, 5, "totalCount should be 5");

    // Request second page with limit=2, offset=2
    const page2 = harness.service.entityList({
      projectId: harness.projectId,
      limit: 2,
      offset: 2,
    });
    assert.equal(page2.ok, true);
    if (!page2.ok) assert.fail("entityList page2 failed");
    assert.equal(page2.data.items.length, 2, "page2 should have 2 items");
    assert.equal(page2.data.totalCount, 5, "totalCount should be 5");

    // Request third page with limit=2, offset=4 — only 1 item left
    const page3 = harness.service.entityList({
      projectId: harness.projectId,
      limit: 2,
      offset: 4,
    });
    assert.equal(page3.ok, true);
    if (!page3.ok) assert.fail("entityList page3 failed");
    assert.equal(page3.data.items.length, 1, "page3 should have 1 item");
    assert.equal(page3.data.totalCount, 5, "totalCount should be 5");

    // No duplicates across pages
    const allNames = new Set([
      ...page1.data.items.map((e) => e.name),
      ...page2.data.items.map((e) => e.name),
      ...page3.data.items.map((e) => e.name),
    ]);
    assert.equal(allNames.size, 5, "all 5 entities should be covered");
  } finally {
    harness.close();
  }
}

// entityList without limit returns all items (backward compatible)
{
  const harness = createTestHarness();
  try {
    for (let i = 0; i < 3; i++) {
      createEntity({
        service: harness.service,
        projectId: harness.projectId,
        name: `entity-nopage-${i}`,
      });
    }

    const all = harness.service.entityList({
      projectId: harness.projectId,
    });
    assert.equal(all.ok, true);
    if (!all.ok) assert.fail("entityList all failed");
    assert.equal(all.data.items.length, 3, "should return all 3 items");
    assert.equal(all.data.totalCount, 3, "totalCount should be 3");
  } finally {
    harness.close();
  }
}

// ---------------------------------------------------------------------------
// AC-1: Relation list pagination
// ---------------------------------------------------------------------------
// relationList with limit returns at most `limit` items and includes totalCount
{
  const harness = createTestHarness();
  try {
    const entityA = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "rel-entity-a",
    });
    const entityB = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "rel-entity-b",
    });
    const entityC = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "rel-entity-c",
    });

    // Create 3 relations manually
    insertRelation({
      db: harness.db,
      id: "r-ab",
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityB,
      createdAt: "2026-03-17T10:00:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-bc",
      projectId: harness.projectId,
      sourceEntityId: entityB,
      targetEntityId: entityC,
      createdAt: "2026-03-17T10:00:01.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-ac",
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityC,
      createdAt: "2026-03-17T10:00:02.000Z",
    });

    // Request first page with limit=2
    const page1 = harness.service.relationList({
      projectId: harness.projectId,
      limit: 2,
      offset: 0,
    });
    assert.equal(page1.ok, true);
    if (!page1.ok) assert.fail("relationList page1 failed");
    assert.equal(page1.data.items.length, 2, "page1 should have 2 relations");
    assert.equal(page1.data.totalCount, 3, "totalCount should be 3");

    // Request second page
    const page2 = harness.service.relationList({
      projectId: harness.projectId,
      limit: 2,
      offset: 2,
    });
    assert.equal(page2.ok, true);
    if (!page2.ok) assert.fail("relationList page2 failed");
    assert.equal(page2.data.items.length, 1, "page2 should have 1 relation");
    assert.equal(page2.data.totalCount, 3, "totalCount should be 3");
  } finally {
    harness.close();
  }
}

// relationList without limit returns all items (backward compatible)
{
  const harness = createTestHarness();
  try {
    const entityA = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "rel-all-a",
    });
    const entityB = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "rel-all-b",
    });

    insertRelation({
      db: harness.db,
      id: "r-all-ab",
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityB,
      createdAt: "2026-03-17T10:00:00.000Z",
    });

    const all = harness.service.relationList({
      projectId: harness.projectId,
    });
    assert.equal(all.ok, true);
    if (!all.ok) assert.fail("relationList all failed");
    assert.equal(all.data.items.length, 1, "should return all 1 relation");
    assert.equal(all.data.totalCount, 1, "totalCount should be 1");
  } finally {
    harness.close();
  }
}

// ---------------------------------------------------------------------------
// AC-2: queryPath cycle protection — BFS visited set prevents infinite traversal
// ---------------------------------------------------------------------------
// queryPath on a cyclic graph A→B→C→A terminates and returns empty path for unreachable target
{
  const harness = createTestHarness();
  try {
    const entityA = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cycle-a",
    });
    const entityB = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cycle-b",
    });
    const entityC = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cycle-c",
    });
    const entityD = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cycle-d-isolated",
    });

    // Create cycle: A→B→C→A
    insertRelation({
      db: harness.db,
      id: "r-cycle-ab",
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityB,
      createdAt: "2026-03-17T10:00:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-cycle-bc",
      projectId: harness.projectId,
      sourceEntityId: entityB,
      targetEntityId: entityC,
      createdAt: "2026-03-17T10:00:01.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-cycle-ca",
      projectId: harness.projectId,
      sourceEntityId: entityC,
      targetEntityId: entityA,
      createdAt: "2026-03-17T10:00:02.000Z",
    });

    // Query path from A to D (D is isolated — unreachable via cycle)
    const result = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityD,
      timeoutMs: 1000,
      maxExpansions: 100,
    });

    // Must terminate (not infinite loop) and return empty path
    assert.equal(result.ok, true, "queryPath should not hang on cyclic graph");
    if (!result.ok) assert.fail("queryPath failed on cycle");
    assert.deepEqual(
      result.data.pathEntityIds,
      [],
      "unreachable target yields empty path",
    );
    assert.equal(
      result.data.expansions <= 3,
      true,
      "BFS should handle cycle with at most 3 expansions",
    );
    assert.equal(result.data.degraded, false, "no degradation on clean cycle");
  } finally {
    harness.close();
  }
}

// queryPath within a cyclic graph still finds reachable path
{
  const harness = createTestHarness();
  try {
    const entityA = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cyc-reach-a",
    });
    const entityB = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cyc-reach-b",
    });
    const entityC = createEntity({
      service: harness.service,
      projectId: harness.projectId,
      name: "cyc-reach-c",
    });

    // Cycle: A→B→C→A
    insertRelation({
      db: harness.db,
      id: "r-cyc-ab",
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityB,
      createdAt: "2026-03-17T10:00:00.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-cyc-bc",
      projectId: harness.projectId,
      sourceEntityId: entityB,
      targetEntityId: entityC,
      createdAt: "2026-03-17T10:00:01.000Z",
    });
    insertRelation({
      db: harness.db,
      id: "r-cyc-ca",
      projectId: harness.projectId,
      sourceEntityId: entityC,
      targetEntityId: entityA,
      createdAt: "2026-03-17T10:00:02.000Z",
    });

    // Query path from A to C (reachable in cycle)
    const result = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId: entityA,
      targetEntityId: entityC,
      timeoutMs: 1000,
    });

    assert.equal(result.ok, true);
    if (!result.ok) assert.fail("queryPath failed");
    assert.deepEqual(
      result.data.pathEntityIds,
      [entityA, entityB, entityC],
      "should find path A→B→C",
    );
  } finally {
    harness.close();
  }
}

// ---------------------------------------------------------------------------
// AC-2: queryPath degraded flag when maxExpansions exceeded
// ---------------------------------------------------------------------------
{
  const harness = createTestHarness();
  try {
    // Create a chain: e0→e1→e2→e3→e4→e5
    const entityIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      entityIds.push(
        createEntity({
          service: harness.service,
          projectId: harness.projectId,
          name: `chain-${i}`,
        }),
      );
    }
    for (let i = 0; i < 5; i++) {
      insertRelation({
        db: harness.db,
        id: `r-chain-${i}`,
        projectId: harness.projectId,
        sourceEntityId: entityIds[i],
        targetEntityId: entityIds[i + 1],
        createdAt: `2026-03-17T10:00:0${i}.000Z`,
      });
    }

    // Query with maxExpansions=2 — not enough to reach e5 from e0
    const result = harness.service.queryPath({
      projectId: harness.projectId,
      sourceEntityId: entityIds[0],
      targetEntityId: entityIds[5],
      timeoutMs: 1000,
      maxExpansions: 2,
    });

    assert.equal(result.ok, true, "should return degraded result, not error");
    if (!result.ok) assert.fail("queryPath should return degraded, not error");
    assert.equal(result.data.degraded, true, "should be degraded");
    assert.deepEqual(
      result.data.pathEntityIds,
      [],
      "degraded path should be empty when target not reached",
    );
  } finally {
    harness.close();
  }
}

// ---------------------------------------------------------------------------
// AC-1: entityList pagination with filter
// ---------------------------------------------------------------------------
{
  const harness = createTestHarness();
  try {
    // Create 3 entities with 'always' level and 2 with 'never'
    for (let i = 0; i < 3; i++) {
      const created = harness.service.entityCreate({
        projectId: harness.projectId,
        type: "character",
        name: `always-${i}`,
        aiContextLevel: "always",
      });
      assert.equal(created.ok, true);
    }
    for (let i = 0; i < 2; i++) {
      const created = harness.service.entityCreate({
        projectId: harness.projectId,
        type: "location",
        name: `never-${i}`,
        aiContextLevel: "never",
      });
      assert.equal(created.ok, true);
    }

    // Paginate filtered list (filter + limit)
    const filtered = harness.service.entityList({
      projectId: harness.projectId,
      filter: { aiContextLevel: "always" },
      limit: 2,
      offset: 0,
    });
    assert.equal(filtered.ok, true);
    if (!filtered.ok) assert.fail("filtered entityList failed");
    assert.equal(filtered.data.items.length, 2);
    assert.equal(
      filtered.data.totalCount,
      3,
      "totalCount for always-level entities should be 3",
    );
    assert.ok(
      filtered.data.items.every((e) => e.aiContextLevel === "always"),
      "all items should have always level",
    );
  } finally {
    harness.close();
  }
}

console.log(
  "✅ kg-scale-query-safety.contract.test.ts — all assertions passed",
);
