import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import { createSkillService } from "../skillService";

function createNoopLogger(): Logger {
  return {
    logPath: "",
    info: () => {},
    error: () => {},
  };
}

function createProjectTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'novel',
      description TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'outline',
      target_word_count INTEGER,
      target_chapter_count INTEGER,
      narrative_person TEXT NOT NULL DEFAULT 'first',
      language_style TEXT NOT NULL DEFAULT '',
      target_audience TEXT NOT NULL DEFAULT '',
      default_skill_set_id TEXT,
      knowledge_graph_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      archived_at INTEGER
    );

    CREATE TABLE documents (
      document_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'chapter',
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sort_order INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      cover_image_url TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    );

    CREATE TABLE skills (
      skill_id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL,
      valid INTEGER NOT NULL,
      error_code TEXT,
      error_message TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE custom_skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      input_type TEXT NOT NULL,
      context_rules TEXT NOT NULL,
      scope TEXT NOT NULL,
      project_id TEXT,
      enabled INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  return db;
}

function seedProject(args: {
  db: Database.Database;
  projectId: string;
  projectRoot: string;
}): void {
  const ts = Date.now();
  args.db
    .prepare(
      "INSERT INTO projects (project_id, name, root_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(args.projectId, args.projectId, args.projectRoot, ts, ts);
}

function switchCurrentProject(args: {
  db: Database.Database;
  projectId: string;
}): void {
  args.db
    .prepare(
      "UPDATE settings SET value_json = ?, updated_at = ? WHERE scope = 'app' AND key = 'creonow.project.currentId'",
    )
    .run(JSON.stringify(args.projectId), Date.now());
}

function writeBuiltinSkill(args: {
  builtinSkillsDir: string;
  id: string;
  name: string;
}): void {
  const filePath = path.join(
    args.builtinSkillsDir,
    "packages",
    "pkg.creonow.builtin",
    "1.0.0",
    "skills",
    "rewrite",
    "SKILL.md",
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `---
id: ${args.id}
name: ${args.name}
description: contract test
version: "1.0.0"
tags: ["test"]
kind: single
scope: builtin
packageId: pkg.creonow.builtin
context_rules:
  surrounding: 100
  user_preferences: true
  style_guide: false
  characters: false
  outline: false
  recent_summary: 0
  knowledge_graph: false
prompt:
  system: |
    You are test assistant.
  user: |
    {{input}}
---

# ${args.id}
`,
    "utf8",
  );
}

function ensureProjectSkillPackagesDir(projectRoot: string): void {
  fs.mkdirSync(path.join(projectRoot, ".creonow", "skills", "packages"), {
    recursive: true,
  });
}

{
  // BE-SRH-S1: same project calls should hit project cache and avoid repeated scans.
  const tmpRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "creonow-skill-registry-cache-"),
  );
  const userDataDir = path.join(tmpRoot, "user-data");
  const builtinSkillsDir = path.join(tmpRoot, "builtin-skills");
  const projectRootA = path.join(tmpRoot, "project-a");
  const projectRootB = path.join(tmpRoot, "project-b");
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(builtinSkillsDir, { recursive: true });
  fs.mkdirSync(projectRootA, { recursive: true });
  fs.mkdirSync(projectRootB, { recursive: true });
  ensureProjectSkillPackagesDir(projectRootA);
  ensureProjectSkillPackagesDir(projectRootB);
  writeBuiltinSkill({
    builtinSkillsDir,
    id: "builtin:rewrite",
    name: "改写",
  });

  const db = createProjectTestDb();
  seedProject({
    db,
    projectId: "project-a",
    projectRoot: projectRootA,
  });
  seedProject({
    db,
    projectId: "project-b",
    projectRoot: projectRootB,
  });
  db.prepare(
    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?)",
  ).run(
    "app",
    "creonow.project.currentId",
    JSON.stringify("project-a"),
    Date.now(),
  );

  let readdirCalls = 0;
  const originalReadDir = fs.readdirSync;
  const countingReadDir = ((...callArgs: unknown[]) => {
    const first = callArgs[0];
    if (typeof first === "string" && first.includes(`${path.sep}packages`)) {
      readdirCalls += 1;
    }
    return Reflect.apply(
      originalReadDir as unknown as (...args: unknown[]) => unknown,
      fs,
      callArgs,
    ) as ReturnType<typeof fs.readdirSync>;
  }) as typeof fs.readdirSync;

  fs.readdirSync = countingReadDir;
  try {
    const svc = createSkillService({
      db,
      userDataDir,
      builtinSkillsDir,
      logger: createNoopLogger(),
    });

    const first = svc.list({ includeDisabled: true });
    assert.equal(first.ok, true);
    const firstScanCalls = readdirCalls;
    assert.equal(firstScanCalls > 0, true, "first list should scan skill dirs");

    const second = svc.list({ includeDisabled: true });
    assert.equal(second.ok, true);
    assert.equal(
      readdirCalls,
      firstScanCalls,
      "second list in same project should not rescan skill dirs",
    );

    switchCurrentProject({ db, projectId: "project-b" });
    const beforeSwitchList = readdirCalls;
    const switched = svc.list({ includeDisabled: true });
    assert.equal(switched.ok, true);
    assert.equal(
      readdirCalls > beforeSwitchList,
      true,
      "project switch should invalidate cache and trigger a fresh scan",
    );
  } finally {
    fs.readdirSync = originalReadDir;
    db.close();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}
