import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { it } from "vitest";

import { createExportService } from "../exportService";
import {
  PLAIN_TEXT_TRAP,
  STRUCTURED_EXPORT_CONTENT_JSON,
  STRUCTURED_EXPORT_TITLE,
} from "./exportFixture";
import {
  createNoopLogger,
  createTestDb,
  seedProjectAndDocument,
} from "./exportTestHelpers";

/**
 * Scenario: S3-EXPORT-S1
 * should export markdown from TipTap JSON with retained structure instead of plain-text fallback.
 */
it("exports markdown from structured contentJson instead of plain-text fallback", async () => {
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

    const result = await service.exportMarkdown({ projectId, documentId });
    assert.equal(result.ok, true, "markdown export should succeed");
    if (!result.ok) {
      throw new Error("markdown export should succeed");
    }

    const outputPath = path.join(userDataDir, result.data.relativePath);
    const markdown = await fs.readFile(outputPath, "utf8");

    assert.match(markdown, /^# Structured Export Sample\n\n/u);
    assert.ok(markdown.includes("## Scene Heading"));
    assert.ok(markdown.includes("**bold words**"));
    assert.ok(markdown.includes("*italic words*"));
    assert.ok(markdown.includes("<u>underlined words</u>"));
    assert.ok(markdown.includes("`inline code`"));
    assert.ok(
      markdown.includes("[read the archive](https://example.com/archive)"),
    );
    assert.ok(markdown.includes("- First bullet"));
    assert.ok(markdown.includes("1. First ordered"));
    assert.ok(markdown.includes("> Quoted memory"));
    assert.ok(markdown.includes("---"));
    assert.ok(markdown.includes("![Tiny diagram](data:image/png;base64,"));
    assert.ok(!markdown.includes(PLAIN_TEXT_TRAP));
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
});
