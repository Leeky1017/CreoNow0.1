import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import { createDocumentService } from "../../main/src/services/documents/documentService";
import type { Logger } from "../../main/src/logging/logger";

type DocumentType = "chapter" | "note" | "setting" | "timeline" | "character";
type DocumentStatus = "draft" | "final";

type DocRow = {
  documentId: string;
  projectId: string;
  type: DocumentType;
  title: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  status: DocumentStatus;
  sortOrder: number;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
};

type VersionRow = {
  versionId: string;
  projectId: string;
  documentId: string;
  actor: "user" | "auto" | "ai";
  reason: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

function createNoopLogger(): Logger {
  return { logPath: "<test>", info: () => {}, error: () => {} };
}

function createFakeDb(): Database.Database {
  const docs: DocRow[] = [];
  const versions: VersionRow[] = [];
  const settings = new Map<string, { valueJson: string; updatedAt: number }>();

  function settingsKey(scope: string, key: string): string {
    return `${scope}::${key}`;
  }

  const db = {
    prepare(sql: string) {
      if (
        sql.startsWith(
          "INSERT INTO documents (document_id, project_id, type, title, content_json",
        )
      ) {
        return {
          run(
            documentId: string,
            projectId: string,
            type: DocumentType,
            title: string,
            contentJson: string,
            contentText: string,
            contentMd: string,
            contentHash: string,
            status: DocumentStatus,
            sortOrder: number,
            parentId: string | null,
            createdAt: number,
            updatedAt: number,
          ) {
            docs.push({
              documentId,
              projectId,
              type,
              title,
              contentJson,
              contentText,
              contentMd,
              contentHash,
              status,
              sortOrder,
              parentId,
              createdAt,
              updatedAt,
            });
            return { changes: 1 };
          },
        };
      }

      if (
        sql ===
        "SELECT MAX(sort_order) as maxSortOrder FROM documents WHERE project_id = ?"
      ) {
        return {
          get(projectId: string) {
            const scoped = docs.filter((d) => d.projectId === projectId);
            if (scoped.length === 0) {
              return { maxSortOrder: null };
            }
            return {
              maxSortOrder: Math.max(...scoped.map((d) => d.sortOrder)),
            };
          },
        };
      }

      if (
        sql.startsWith(
          "INSERT INTO documents (document_id, project_id, title, content_json",
        )
      ) {
        return {
          run(
            documentId: string,
            projectId: string,
            title: string,
            contentJson: string,
            contentText: string,
            contentMd: string,
            contentHash: string,
            createdAt: number,
            updatedAt: number,
          ) {
            docs.push({
              documentId,
              projectId,
              type: "chapter",
              title,
              contentJson,
              contentText,
              contentMd,
              contentHash,
              status: "draft",
              sortOrder: docs.length,
              parentId: null,
              createdAt,
              updatedAt,
            });
            return { changes: 1 };
          },
        };
      }

      if (
        sql ===
        "SELECT document_id as documentId, type, title, status, sort_order as sortOrder, parent_id as parentId, updated_at as updatedAt FROM documents WHERE project_id = ? ORDER BY sort_order ASC, updated_at DESC, document_id ASC"
      ) {
        return {
          all(projectId: string) {
            return docs
              .filter((d) => d.projectId === projectId)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((d) => ({
                documentId: d.documentId,
                type: d.type,
                title: d.title,
                status: d.status,
                sortOrder: d.sortOrder,
                parentId: d.parentId,
                updatedAt: d.updatedAt,
              }));
          },
        };
      }

      if (
        sql ===
        "SELECT document_id as documentId, project_id as projectId, type, title, status, sort_order as sortOrder, parent_id as parentId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, created_at as createdAt, updated_at as updatedAt FROM documents WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          get(projectId: string, documentId: string) {
            const row = docs.find(
              (d) => d.projectId === projectId && d.documentId === documentId,
            );
            if (!row) {
              return undefined;
            }
            return {
              documentId: row.documentId,
              projectId: row.projectId,
              type: row.type,
              title: row.title,
              status: row.status,
              sortOrder: row.sortOrder,
              parentId: row.parentId,
              contentJson: row.contentJson,
              contentText: row.contentText,
              contentMd: row.contentMd,
              contentHash: row.contentHash,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            };
          },
        };
      }

      if (
        sql ===
        "SELECT document_id as documentId FROM documents WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          get(projectId: string, documentId: string) {
            const row = docs.find(
              (d) => d.projectId === projectId && d.documentId === documentId,
            );
            return row ? { documentId: row.documentId } : undefined;
          },
        };
      }

      if (
        sql ===
        "SELECT document_id as documentId FROM documents WHERE project_id = ? ORDER BY updated_at DESC, document_id ASC LIMIT 1"
      ) {
        return {
          get(projectId: string) {
            const row = docs
              .filter((d) => d.projectId === projectId)
              .sort((a, b) => b.updatedAt - a.updatedAt)[0];
            return row ? { documentId: row.documentId } : undefined;
          },
        };
      }

      if (
        sql ===
        "SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?"
      ) {
        return {
          get(scope: string, key: string) {
            const row = settings.get(settingsKey(scope, key));
            return row ? { valueJson: row.valueJson } : undefined;
          },
        };
      }

      if (
        sql.startsWith(
          "INSERT INTO settings (scope, key, value_json, updated_at) VALUES",
        )
      ) {
        return {
          run(
            scope: string,
            key: string,
            valueJson: string,
            updatedAt: number,
          ) {
            settings.set(settingsKey(scope, key), { valueJson, updatedAt });
            return { changes: 1 };
          },
        };
      }

      if (sql === "DELETE FROM settings WHERE scope = ? AND key = ?") {
        return {
          run(scope: string, key: string) {
            settings.delete(settingsKey(scope, key));
            return { changes: 1 };
          },
        };
      }

      if (
        sql === "DELETE FROM documents WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          run(projectId: string, documentId: string) {
            const before = docs.length;
            const next = docs.filter(
              (d) =>
                !(d.projectId === projectId && d.documentId === documentId),
            );
            docs.length = 0;
            docs.push(...next);
            return { changes: before - docs.length };
          },
        };
      }

      if (sql === "SELECT type, status FROM documents WHERE document_id = ?") {
        return {
          get(documentId: string) {
            const row = docs.find((d) => d.documentId === documentId);
            return row ? { type: row.type, status: row.status } : undefined;
          },
        };
      }

      if (
        sql ===
        "SELECT content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM documents WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          get(projectId: string, documentId: string) {
            const row = docs.find(
              (d) => d.projectId === projectId && d.documentId === documentId,
            );
            if (!row) {
              return undefined;
            }
            return {
              contentJson: row.contentJson,
              contentText: row.contentText,
              contentMd: row.contentMd,
              contentHash: row.contentHash,
            };
          },
        };
      }

      if (
        sql ===
        "UPDATE documents SET status = ?, updated_at = ? WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          run(
            status: DocumentStatus,
            updatedAt: number,
            projectId: string,
            documentId: string,
          ) {
            const row = docs.find(
              (d) => d.projectId === projectId && d.documentId === documentId,
            );
            if (!row) {
              return { changes: 0 };
            }
            row.status = status;
            row.updatedAt = updatedAt;
            return { changes: 1 };
          },
        };
      }

      if (
        sql ===
        "UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE project_id = ? AND document_id = ?"
      ) {
        return {
          run(
            contentJson: string,
            contentText: string,
            contentMd: string,
            contentHash: string,
            updatedAt: number,
            projectId: string,
            documentId: string,
          ) {
            const row = docs.find(
              (d) => d.projectId === projectId && d.documentId === documentId,
            );
            if (!row) {
              return { changes: 0 };
            }
            row.contentJson = contentJson;
            row.contentText = contentText;
            row.contentMd = contentMd;
            row.contentHash = contentHash;
            row.updatedAt = updatedAt;
            return { changes: 1 };
          },
        };
      }

      if (
        sql ===
        "SELECT content_hash as contentHash FROM document_versions WHERE document_id = ? ORDER BY created_at DESC, version_id ASC LIMIT 1"
      ) {
        return {
          get(documentId: string) {
            const latest = versions
              .filter((v) => v.documentId === documentId)
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            return latest ? { contentHash: latest.contentHash } : undefined;
          },
        };
      }

      if (
        sql ===
        "SELECT version_id as versionId, reason, content_hash as contentHash, created_at as createdAt FROM document_versions WHERE document_id = ? ORDER BY created_at DESC, version_id ASC LIMIT 1"
      ) {
        return {
          get(documentId: string) {
            const latest = versions
              .filter((v) => v.documentId === documentId)
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            if (!latest) {
              return undefined;
            }
            return {
              versionId: latest.versionId,
              reason: latest.reason,
              contentHash: latest.contentHash,
              createdAt: latest.createdAt,
            };
          },
        };
      }

      if (
        sql.startsWith(
          "SELECT version_id as versionId, actor, reason, content_hash as contentHash,",
        ) &&
        sql.includes("FROM document_versions WHERE document_id = ?")
      ) {
        return {
          all(documentId: string) {
            return versions
              .filter((v) => v.documentId === documentId)
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((v) => ({
                versionId: v.versionId,
                actor: v.actor,
                reason: v.reason,
                contentHash: v.contentHash,
                wordCount: v.wordCount,
                createdAt: v.createdAt,
              }));
          },
        };
      }

      if (
        sql ===
        "SELECT document_id as documentId, project_id as projectId, version_id as versionId, actor, reason, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, COALESCE(word_count, 0) as wordCount, created_at as createdAt FROM document_versions WHERE document_id = ? AND version_id = ?"
      ) {
        return {
          get(documentId: string, versionId: string) {
            const row = versions.find(
              (v) => v.documentId === documentId && v.versionId === versionId,
            );
            if (!row) {
              return undefined;
            }
            return {
              documentId: row.documentId,
              projectId: row.projectId,
              versionId: row.versionId,
              actor: row.actor,
              reason: row.reason,
              contentJson: row.contentJson,
              contentText: row.contentText,
              contentMd: row.contentMd,
              contentHash: row.contentHash,
              wordCount: row.wordCount,
              createdAt: row.createdAt,
            };
          },
        };
      }

      if (
        sql.startsWith(
          "UPDATE document_versions SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?,",
        ) &&
        sql.includes("WHERE version_id = ?")
      ) {
        return {
          run(
            contentJson: string,
            contentText: string,
            contentMd: string,
            contentHash: string,
            maybeWordCountOrCreatedAt: number,
            maybeCreatedAtOrVersionId: number | string,
            maybeVersionId: string | undefined,
          ) {
            const hasWordCount = typeof maybeVersionId === "string";
            const wordCount = hasWordCount ? maybeWordCountOrCreatedAt : 0;
            const createdAt = hasWordCount
              ? (maybeCreatedAtOrVersionId as number)
              : maybeWordCountOrCreatedAt;
            const versionId = hasWordCount
              ? maybeVersionId
              : (maybeCreatedAtOrVersionId as string);

            const row = versions.find((v) => v.versionId === versionId);
            if (!row) {
              return { changes: 0 };
            }
            row.contentJson = contentJson;
            row.contentText = contentText;
            row.contentMd = contentMd;
            row.contentHash = contentHash;
            row.wordCount = wordCount;
            row.createdAt = createdAt;
            return { changes: 1 };
          },
        };
      }

      if (
        sql.startsWith(
          "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason,",
        )
      ) {
        return {
          run(...params: unknown[]) {
            const versionId = String(params[0]);
            const projectId = String(params[1]);
            const documentId = String(params[2]);
            const actor = params[3] as "user" | "auto" | "ai";
            const reason = String(params[4]);
            const contentJson = String(params[5]);
            const contentText = String(params[6]);
            const contentMd = String(params[7]);
            const contentHash = String(params[8]);
            const hasWordCount = typeof params[9] === "number";
            const wordCount = hasWordCount ? Number(params[9]) : 0;
            const createdAt = Number(params[params.length - 1]);
            versions.push({
              versionId,
              projectId,
              documentId,
              actor,
              reason,
              contentJson,
              contentText,
              contentMd,
              contentHash,
              wordCount,
              createdAt,
            });
            return { changes: 1 };
          },
        };
      }

      if (
        sql ===
        "SELECT COUNT(*) as count FROM document_versions WHERE document_id = ?"
      ) {
        return {
          get(documentId: string) {
            return {
              count: versions.filter((v) => v.documentId === documentId).length,
            };
          },
        };
      }

      if (
        sql ===
        "SELECT version_id as versionId FROM document_versions WHERE document_id = ? AND reason = 'autosave' AND created_at < ? ORDER BY created_at ASC, version_id ASC LIMIT ?"
      ) {
        return {
          all(documentId: string, compactBeforeTs: number, limit: number) {
            return versions
              .filter(
                (v) =>
                  v.documentId === documentId &&
                  v.reason === "autosave" &&
                  v.createdAt < compactBeforeTs,
              )
              .sort((a, b) => {
                if (a.createdAt !== b.createdAt) {
                  return a.createdAt - b.createdAt;
                }
                return a.versionId.localeCompare(b.versionId);
              })
              .slice(0, limit)
              .map((v) => ({ versionId: v.versionId }));
          },
        };
      }

      if (sql === "DELETE FROM document_versions WHERE version_id = ?") {
        return {
          run(versionId: string) {
            const index = versions.findIndex((v) => v.versionId === versionId);
            if (index < 0) {
              return { changes: 0 };
            }
            versions.splice(index, 1);
            return { changes: 1 };
          },
        };
      }

      throw new Error(`Unexpected SQL in fake DB: ${sql}`);
    },

    transaction<T>(fn: () => T): () => T {
      return () => fn();
    },
  } as unknown as Database.Database;

  return db;
}

/**
 * S3/S4: create should persist requested document type and default draft status.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const createWithType = svc.create as unknown as (args: {
    projectId: string;
    title?: string;
    type?: DocumentType;
  }) => { ok: boolean; data: { documentId: string } };

  const created = createWithType({ projectId: "proj-1", type: "note" });
  assert.equal(created.ok, true);
  if (!created.ok) {
    throw new Error("create failed");
  }

  const row = db
    .prepare<
      [string],
      { type: string; status: string }
    >("SELECT type, status FROM documents WHERE document_id = ?")
    .get(created.data.documentId);

  assert.equal(row?.type, "note");
  assert.equal(row?.status, "draft");
}

/**
 * S2: deleting the last document should auto-create a new blank chapter document.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });

  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }
  const setCurrent = svc.setCurrent({
    projectId: "proj-1",
    documentId: created.data.documentId,
  });
  if (!setCurrent.ok) {
    throw new Error(`set current failed: ${setCurrent.error.code}`);
  }

  const deleted = svc.delete({
    projectId: "proj-1",
    documentId: created.data.documentId,
  });
  assert.equal(deleted.ok, true);

  const listed = svc.list({ projectId: "proj-1" });
  if (!listed.ok) {
    throw new Error(`list failed: ${listed.error.code}`);
  }
  assert.equal(
    listed.data.items.length,
    1,
    "project should keep one document after deleting the last one",
  );
}

/**
 * S2 extension: list/read must normalize null parentId to undefined for IPC contract.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const listed = svc.list({ projectId: "proj-1" });
  if (!listed.ok) {
    throw new Error(`list failed: ${listed.error.code}`);
  }
  assert.equal(listed.data.items.length, 1);
  assert.equal(
    listed.data.items[0]?.parentId,
    undefined,
    "list should expose undefined parentId instead of null",
  );

  const read = svc.read({
    projectId: "proj-1",
    documentId: created.data.documentId,
  });
  if (!read.ok) {
    throw new Error(`read failed: ${read.error.code}`);
  }
  assert.equal(
    read.data.parentId,
    undefined,
    "read should expose undefined parentId instead of null",
  );
}

/**
 * S5: status update API must exist and support draft/final transitions.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const updater = (
    svc as unknown as {
      updateStatus?: (args: {
        projectId: string;
        documentId: string;
        status: "draft" | "final";
      }) => { ok: boolean };
    }
  ).updateStatus;

  assert.equal(typeof updater, "function", "updateStatus API must exist");
  if (!updater) {
    throw new Error("missing updateStatus");
  }

  const updated = updater({
    projectId: "proj-1",
    documentId: created.data.documentId,
    status: "final",
  });
  assert.equal(updated.ok, true);
}

/**
 * Snapshot schema: manual-save snapshot should include wordCount field.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const saveRes = svc.save({
    projectId: "proj-1",
    documentId: created.data.documentId,
    contentJson: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a b" }] },
      ],
    },
    actor: "user",
    reason: "manual-save",
  });
  assert.equal(saveRes.ok, true);

  const listed = svc.listVersions({ documentId: created.data.documentId });
  assert.equal(listed.ok, true);
  if (listed.ok) {
    const first = listed.data.items[0] as unknown as Record<string, unknown>;
    assert.equal(
      Object.prototype.hasOwnProperty.call(first, "wordCount"),
      true,
      "version snapshot should expose wordCount",
    );
    assert.equal(typeof first.wordCount, "number");
  }
}

/**
 * Snapshot reason mapping: AI apply accept should persist with reason=ai-accept.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const aiSave = (
    svc as unknown as {
      save: (args: {
        projectId: string;
        documentId: string;
        contentJson: unknown;
        actor: "ai";
        reason: "ai-accept";
      }) => { ok: boolean };
    }
  ).save;

  const saveRes = aiSave({
    projectId: "proj-1",
    documentId: created.data.documentId,
    contentJson: { type: "doc", content: [{ type: "paragraph" }] },
    actor: "ai",
    reason: "ai-accept",
  });

  assert.equal(saveRes.ok, true, "AI accept save should succeed");
}

/**
 * Autosave merge: multiple autosaves within 5 minutes should merge to one snapshot.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const first = svc.save({
    projectId: "proj-1",
    documentId: created.data.documentId,
    contentJson: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "one" }] },
      ],
    },
    actor: "auto",
    reason: "autosave",
  });
  assert.equal(first.ok, true);

  const second = svc.save({
    projectId: "proj-1",
    documentId: created.data.documentId,
    contentJson: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "two" }] },
      ],
    },
    actor: "auto",
    reason: "autosave",
  });
  assert.equal(second.ok, true);

  const listed = svc.listVersions({ documentId: created.data.documentId });
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(
      listed.data.items.length,
      1,
      "autosave snapshots in 5-minute window should merge to one",
    );
  }
}

/**
 * Status transition snapshots should use reason=status-change.
 */
{
  const db = createFakeDb();
  const svc = createDocumentService({ db, logger: createNoopLogger() });
  const created = svc.create({ projectId: "proj-1" });
  if (!created.ok) {
    throw new Error(`create failed: ${created.error.code}`);
  }

  const updated = svc.updateStatus({
    projectId: "proj-1",
    documentId: created.data.documentId,
    status: "final",
  });
  assert.equal(updated.ok, true);

  const listed = svc.listVersions({ documentId: created.data.documentId });
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.data.items.length >= 1, true);
    assert.equal(
      listed.data.items[0]?.reason,
      "status-change",
      "status transition should persist status-change reason",
    );
  }
}

console.log("documentService.lifecycle.test.ts: all assertions passed");
