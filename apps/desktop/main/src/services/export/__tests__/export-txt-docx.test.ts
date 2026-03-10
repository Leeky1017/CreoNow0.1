import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import JSZip from "jszip";
import { it } from "vitest";

import { createExportService } from "../exportService";
import {
  PLAIN_TEXT_TRAP,
  STRUCTURED_EXPORT_CONTENT_JSON,
  STRUCTURED_EXPORT_TITLE,
} from "./exportFixture";
import { createNoopLogger, createTestDb, seedProjectAndDocument } from "./exportTestHelpers";

/**
 * Scenario: S3-EXPORT-S2
 * should keep txt plain-text while docx retains structured semantics from TipTap JSON.
 */
it("keeps txt plain-text while docx preserves structured semantics", async () => {
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

    const txtRes = await service.exportTxt({ projectId, documentId });
    assert.equal(txtRes.ok, true, "txt export should succeed");
    if (!txtRes.ok) {
      throw new Error("txt export should succeed");
    }

    const txtOutput = await fs.readFile(
      path.join(userDataDir, txtRes.data.relativePath),
      "utf8",
    );
    assert.match(
      txtOutput,
      /^Structured Export Sample\n\nPLAIN TEXT FALLBACK SHOULD NOT APPEAR$/u,
      "txt export should remain the only plain-text export path",
    );

    const firstDocxRes = await service.exportDocx({ projectId, documentId });
    assert.equal(firstDocxRes.ok, true, "docx export should succeed");
    if (!firstDocxRes.ok) {
      throw new Error("docx export should succeed");
    }
    const docxPath = path.join(userDataDir, firstDocxRes.data.relativePath);
    const firstDocx = await fs.readFile(docxPath);
    assert.equal(
      firstDocx.subarray(0, 2).toString("utf8"),
      "PK",
      "docx export should produce a zip container artifact",
    );

    const archive = await JSZip.loadAsync(firstDocx);
    const documentXml = await archive.file("word/document.xml")?.async("string");
    const relsXml = await archive.file("word/_rels/document.xml.rels")?.async("string");

    assert.ok(documentXml, "docx archive should contain word/document.xml");
    assert.ok(relsXml, "docx archive should contain relationship metadata");
    assert.ok(documentXml?.includes("Heading2"));
    assert.ok(documentXml?.includes("w:b"));
    assert.ok(documentXml?.includes("w:i"));
    assert.ok(documentXml?.includes("w:u"));
    assert.ok(documentXml?.includes("w:numPr"));
    assert.ok(relsXml?.includes("https://example.com/archive"));
    assert.ok(relsXml?.includes("image"));
    assert.ok(
      Array.from(Object.keys(archive.files)).some((name) => name.startsWith("word/media/")),
    );

    const secondDocxRes = await service.exportDocx({ projectId, documentId });
    assert.equal(
      secondDocxRes.ok,
      true,
      "docx export should remain stable across repeated calls",
    );
    if (!secondDocxRes.ok) {
      throw new Error("docx export should remain stable");
    }
    assert.equal(
      secondDocxRes.data.relativePath,
      firstDocxRes.data.relativePath,
      "docx export should keep stable output path for identical input",
    );
    assert.ok(
      secondDocxRes.data.bytesWritten > 0,
      "docx export should produce non-empty artifact bytes",
    );
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
});
