import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

const migrationSqlPath = new URL(
  "../../db/migrations/0023_kg_type_other_to_faction.sql",
  import.meta.url,
);
const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");

// Scenario: AUD-C11-S4 legacy "other" records are migrated by DB migration.
{
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "creonow-c11-kg-"));
  const dbPath = path.join(userDataDir, "migration-test.db");

  try {
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE schema_version (version INTEGER NOT NULL);
      INSERT INTO schema_version (version) VALUES (22);

      CREATE TABLE kg_entities (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL
      );

      INSERT INTO kg_entities (id, project_id, type, name)
      VALUES ('legacy-entity-1', 'project-1', 'other', 'Legacy Other Type');
    `);
    db.exec(migrationSql);

    const row = db
      .prepare<
        [string],
        {
          type: string;
        }
      >("SELECT type FROM kg_entities WHERE id = ?")
      .get("legacy-entity-1");
    db.close();

    assert.equal(
      row?.type,
      "faction",
      "legacy kg_entities.type='other' should be migrated to 'faction'",
    );
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

console.log("kg-other-type-migration.test.ts: all assertions passed");
