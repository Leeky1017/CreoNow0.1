import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { it } from "vitest";

import { createExportService } from "../exportService";
import { buildPdfRenderPlan, parseStructuredExportDocument } from "../exportRichText";
import {
  PLAIN_TEXT_TRAP,
  STRUCTURED_EXPORT_CONTENT_JSON,
  STRUCTURED_EXPORT_TITLE,
  UNSUPPORTED_EXPORT_CONTENT_JSON,
} from "./exportFixture";
import { createNoopLogger, createTestDb, seedProjectAndDocument } from "./exportTestHelpers";

it("builds a structured pdf render plan from contentJson", () => {
  const structured = parseStructuredExportDocument({
    contentJson: STRUCTURED_EXPORT_CONTENT_JSON,
  });
  assert.equal(structured.ok, true, "fixture should parse into structured export blocks");
  if (!structured.ok) {
    throw new Error("fixture should parse into structured export blocks");
  }

  const plan = buildPdfRenderPlan({
    title: STRUCTURED_EXPORT_TITLE,
    document: structured.data,
  });

  assert.ok(plan.some((op) => op.type === "heading" && op.level === 1));
  assert.ok(plan.some((op) => op.type === "heading" && op.level === 2));
  assert.ok(plan.some((op) => op.type === "list-item" && op.ordered === false));
  assert.ok(plan.some((op) => op.type === "list-item" && op.ordered === true));
  assert.ok(plan.some((op) => op.type === "image"));
  assert.ok(
    plan.some(
      (op) =>
        op.type === "paragraph" &&
        op.segments.some((segment) => segment.text.includes("bold words")),
    ),
  );
});

it("exports pdf bytes from structured contentJson", async () => {
  const projectId = `project-${randomUUID()}`;
  const documentId = `doc-${randomUUID()}`;
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "creonow-exp-"));
  const db = createTestDb();

  try {
    seedProjectAndDocument({
      db,
      projectId,
      documentId,
      title: STRUCTURED_EXPORT_TITLE,
      contentJson: STRUCTURED_EXPORT_CONTENT_JSON,
      contentText: PLAIN_TEXT_TRAP,
      contentMd: PLAIN_TEXT_TRAP,
    });

    const service = createExportService({
      db,
      logger: createNoopLogger(),
      userDataDir,
    });

    const result = await service.exportPdf({ projectId, documentId });
    assert.equal(result.ok, true, "pdf export should succeed");
    if (!result.ok) {
      throw new Error("pdf export should succeed");
    }

    const pdfBuffer = await fs.readFile(path.join(userDataDir, result.data.relativePath));
    assert.ok(pdfBuffer.length > 0);
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
});

it("fails before writing files when contentJson contains unsupported structures", async () => {
  const projectId = `project-${randomUUID()}`;
  const documentId = `doc-${randomUUID()}`;
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "creonow-exp-"));
  const db = createTestDb();

  try {
    seedProjectAndDocument({
      db,
      projectId,
      documentId,
      title: STRUCTURED_EXPORT_TITLE,
      contentJson: UNSUPPORTED_EXPORT_CONTENT_JSON,
      contentText: PLAIN_TEXT_TRAP,
      contentMd: PLAIN_TEXT_TRAP,
    });

    const service = createExportService({
      db,
      logger: createNoopLogger(),
      userDataDir,
    });

    const result = await service.exportMarkdown({ projectId, documentId });
    assert.equal(result.ok, false, "unsupported structures should fail before file write");
    if (result.ok) {
      throw new Error("unsupported structures should fail before file write");
    }

    assert.equal(result.error.code, "INVALID_ARGUMENT");
    assert.match(result.error.message, /table/u);
    await assert.rejects(
      fs.stat(path.join(userDataDir, "exports", projectId, `${documentId}.md`)),
    );
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
});