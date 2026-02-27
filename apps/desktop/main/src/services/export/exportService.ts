import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";

import type Database from "better-sqlite3";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

import type { Logger } from "../../logging/logger";
import { atomicWrite } from "../documents/atomicWrite";
import { createDocumentService } from "../documents/documentService";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type ExportResult = {
  relativePath: string;
  bytesWritten: number;
};

export type ExportService = {
  exportMarkdown: (args: {
    projectId: string;
    documentId?: string;
  }) => Promise<ServiceResult<ExportResult>>;
  exportProjectBundle: (args: {
    projectId: string;
  }) => Promise<ServiceResult<ExportResult>>;
  exportTxt: (args: {
    projectId: string;
    documentId?: string;
  }) => Promise<ServiceResult<ExportResult>>;
  exportPdf: (args: {
    projectId: string;
    documentId?: string;
  }) => Promise<ServiceResult<ExportResult>>;
  exportDocx: (args: {
    projectId: string;
    documentId?: string;
  }) => Promise<ServiceResult<ExportResult>>;
};

function isSafePathSegment(segment: string): boolean {
  if (segment.length === 0) {
    return false;
  }
  if (segment.includes("..")) {
    return false;
  }
  return !segment.includes("/") && !segment.includes("\\");
}

function composeMarkdownExport(args: { title: string; body: string }): string {
  const trimmedBody = args.body.trim();
  if (trimmedBody.length === 0) {
    return `# ${args.title}\n`;
  }
  return `# ${args.title}\n\n${trimmedBody}\n`;
}

function composeTxtExport(args: { title: string; body: string }): string {
  const trimmedBody = args.body.trim();
  if (trimmedBody.length === 0) {
    return `${args.title}\n`;
  }
  return `${args.title}\n\n${trimmedBody}`;
}

function writeUtf8Chunk(
  stream: NodeJS.WritableStream,
  chunk: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      stream.off("error", onError);
      fn();
    };
    const onError = (error: unknown) => {
      settle(() => reject(error));
    };
    stream.once("error", onError);

    const drained = stream.write(chunk, "utf8", () => {
      settle(resolve);
    });
    if (!drained) {
      stream.once("drain", () => {
        settle(resolve);
      });
    }
  });
}

function endStream(stream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: unknown) => {
      stream.off("error", onError);
      reject(error);
    };
    stream.once("error", onError);
    stream.end(() => {
      stream.off("error", onError);
      resolve();
    });
  });
}

/**
 * Create an export service that writes files under the app's userData directory.
 */
export function createExportService(deps: {
  db: Database.Database;
  logger: Logger;
  userDataDir: string;
}): ExportService {
  async function resolveDocumentId(args: {
    projectId: string;
    documentId?: string;
  }): Promise<ServiceResult<{ documentId: string }>> {
    const trimmed = args.documentId?.trim();
    if (typeof trimmed === "string" && trimmed.length > 0) {
      return { ok: true, data: { documentId: trimmed } };
    }

    const svc = createDocumentService({ db: deps.db, logger: deps.logger });
    const current = svc.getCurrent({ projectId: args.projectId });
    if (!current.ok) {
      if (current.error.code === "NOT_FOUND") {
        return ipcError("INVALID_ARGUMENT", "No current document to export");
      }
      return current;
    }
    return { ok: true, data: { documentId: current.data.documentId } };
  }

  async function exportMarkdown(args: {
    projectId: string;
    documentId?: string;
  }): Promise<ServiceResult<ExportResult>> {
    const projectId = args.projectId.trim();
    if (projectId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    const docIdRes = await resolveDocumentId({
      projectId,
      documentId: args.documentId,
    });
    if (!docIdRes.ok) {
      return docIdRes;
    }

    const documentId = docIdRes.data.documentId.trim();
    if (!isSafePathSegment(projectId) || !isSafePathSegment(documentId)) {
      return ipcError("INVALID_ARGUMENT", "Unsafe export path segments");
    }

    const relativeParts = ["exports", projectId, `${documentId}.md`];
    const relativePath = relativeParts.join("/");
    const absPath = path.join(deps.userDataDir, ...relativeParts);

    deps.logger.info("export_started", {
      format: "markdown",
      documentId,
      relativePath,
    });

    try {
      const docSvc = createDocumentService({
        db: deps.db,
        logger: deps.logger,
      });
      const doc = docSvc.read({ projectId, documentId });
      if (!doc.ok) {
        return doc;
      }

      const markdown = composeMarkdownExport({
        title: doc.data.title,
        body: doc.data.contentMd,
      });
      await atomicWrite({
        targetPath: absPath,
        writeTemp: async (tempPath) => {
          await fs.writeFile(tempPath, markdown, "utf8");
        },
      });

      const bytesWritten = Buffer.byteLength(markdown, "utf8");
      deps.logger.info("export_succeeded", {
        format: "markdown",
        documentId,
        relativePath,
        bytesWritten,
      });

      return { ok: true, data: { relativePath, bytesWritten } };
    } catch (error) {
      deps.logger.error("export_failed", {
        code: "IO_ERROR",
        message: error instanceof Error ? error.message : String(error),
        format: "markdown",
        documentId,
      });
      return ipcError("IO_ERROR", "Failed to write export file");
    }
  }

  async function exportTxt(args: {
    projectId: string;
    documentId?: string;
  }): Promise<ServiceResult<ExportResult>> {
    const projectId = args.projectId.trim();
    if (projectId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    const docIdRes = await resolveDocumentId({
      projectId,
      documentId: args.documentId,
    });
    if (!docIdRes.ok) {
      return docIdRes;
    }

    const documentId = docIdRes.data.documentId.trim();
    if (!isSafePathSegment(projectId) || !isSafePathSegment(documentId)) {
      return ipcError("INVALID_ARGUMENT", "Unsafe export path segments");
    }

    const relativeParts = ["exports", projectId, `${documentId}.txt`];
    const relativePath = relativeParts.join("/");
    const absPath = path.join(deps.userDataDir, ...relativeParts);

    deps.logger.info("export_started", {
      format: "txt",
      documentId,
      relativePath,
    });

    try {
      const docSvc = createDocumentService({
        db: deps.db,
        logger: deps.logger,
      });
      const doc = docSvc.read({ projectId, documentId });
      if (!doc.ok) {
        return doc;
      }

      const text = composeTxtExport({
        title: doc.data.title,
        body: doc.data.contentText,
      });
      await atomicWrite({
        targetPath: absPath,
        writeTemp: async (tempPath) => {
          await fs.writeFile(tempPath, text, "utf8");
        },
      });

      const bytesWritten = Buffer.byteLength(text, "utf8");
      deps.logger.info("export_succeeded", {
        format: "txt",
        documentId,
        relativePath,
        bytesWritten,
      });

      return { ok: true, data: { relativePath, bytesWritten } };
    } catch (error) {
      deps.logger.error("export_failed", {
        code: "IO_ERROR",
        message: error instanceof Error ? error.message : String(error),
        format: "txt",
        documentId,
      });
      return ipcError("IO_ERROR", "Failed to write export file");
    }
  }

  async function exportProjectBundle(args: {
    projectId: string;
  }): Promise<ServiceResult<ExportResult>> {
    const projectId = args.projectId.trim();
    if (projectId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    if (!isSafePathSegment(projectId)) {
      return ipcError("INVALID_ARGUMENT", "Unsafe export path segments");
    }

    const relativeParts = ["exports", projectId, `${projectId}-bundle.md`];
    const relativePath = relativeParts.join("/");
    const absPath = path.join(deps.userDataDir, ...relativeParts);

    deps.logger.info("export_started", {
      format: "project-bundle",
      projectId,
      relativePath,
    });

    try {
      const docSvc = createDocumentService({
        db: deps.db,
        logger: deps.logger,
      });
      const listed = docSvc.list({ projectId });
      if (!listed.ok) {
        return listed;
      }

      const orderedItems = [...listed.data.items].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      if (orderedItems.length === 0) {
        return ipcError("NOT_FOUND", "No documents found for project export");
      }

      let bytesWritten = 0;
      let sourceReadFailure: ServiceResult<ExportResult> | null = null;
      try {
        await atomicWrite({
          targetPath: absPath,
          writeTemp: async (tempPath) => {
            const stream = createWriteStream(tempPath);

            try {
              for (let i = 0; i < orderedItems.length; i += 1) {
                const item = orderedItems[i];
                const read = docSvc.read({
                  projectId,
                  documentId: item.documentId,
                });
                if (!read.ok) {
                  sourceReadFailure = read;
                  throw new Error("project_export_source_read_failed");
                }

                const section =
                  i === 0
                    ? `# ${read.data.title}\n\n${read.data.contentMd}`
                    : `\n\n---\n\n# ${read.data.title}\n\n${read.data.contentMd}`;
                await writeUtf8Chunk(stream, section);
                bytesWritten += Buffer.byteLength(section, "utf8");
              }

              await writeUtf8Chunk(stream, "\n");
              bytesWritten += 1;
              await endStream(stream);
            } catch (error) {
              stream.destroy();
              throw error;
            }
          },
        });
      } catch (error) {
        if (sourceReadFailure) {
          return sourceReadFailure;
        }
        throw error;
      }

      deps.logger.info("export_succeeded", {
        format: "project-bundle",
        projectId,
        relativePath,
        bytesWritten,
      });

      return { ok: true, data: { relativePath, bytesWritten } };
    } catch (error) {
      deps.logger.error("export_failed", {
        code: "IO_ERROR",
        message: error instanceof Error ? error.message : String(error),
        format: "project-bundle",
        projectId,
      });
      return ipcError("IO_ERROR", "Failed to write project export file");
    }
  }

  async function exportPdf(args: {
    projectId: string;
    documentId?: string;
  }): Promise<ServiceResult<ExportResult>> {
    const projectId = args.projectId.trim();
    if (projectId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    const docIdRes = await resolveDocumentId({
      projectId,
      documentId: args.documentId,
    });
    if (!docIdRes.ok) {
      return docIdRes;
    }

    const documentId = docIdRes.data.documentId.trim();
    if (!isSafePathSegment(projectId) || !isSafePathSegment(documentId)) {
      return ipcError("INVALID_ARGUMENT", "Unsafe export path segments");
    }

    const relativeParts = ["exports", projectId, `${documentId}.pdf`];
    const relativePath = relativeParts.join("/");
    const absPath = path.join(deps.userDataDir, ...relativeParts);

    deps.logger.info("export_started", {
      format: "pdf",
      documentId,
      relativePath,
    });

    try {
      const docSvc = createDocumentService({
        db: deps.db,
        logger: deps.logger,
      });
      const doc = docSvc.read({ projectId, documentId });
      if (!doc.ok) {
        return doc;
      }

      let bytesWritten = 0;
      await atomicWrite({
        targetPath: absPath,
        writeTemp: async (tempPath) => {
          bytesWritten = await new Promise<number>((resolve, reject) => {
            const pdfDoc = new PDFDocument({
              size: "A4",
              margins: { top: 72, bottom: 72, left: 72, right: 72 },
            });

            const stream = createWriteStream(tempPath);
            let size = 0;

            stream.on("error", reject);
            stream.on("finish", () => resolve(size));

            pdfDoc.on("data", (chunk: Buffer) => {
              size += chunk.length;
            });
            pdfDoc.on("error", reject);

            pdfDoc.pipe(stream);

            pdfDoc
              .font("Helvetica-Bold")
              .fontSize(24)
              .text(doc.data.title, { align: "left" });
            pdfDoc.moveDown(2);

            pdfDoc.font("Helvetica").fontSize(12).text(doc.data.contentText, {
              align: "left",
              lineGap: 4,
            });

            pdfDoc.end();
          });
        },
      });

      deps.logger.info("export_succeeded", {
        format: "pdf",
        documentId,
        relativePath,
        bytesWritten,
      });

      return { ok: true, data: { relativePath, bytesWritten } };
    } catch (error) {
      deps.logger.error("export_failed", {
        code: "IO_ERROR",
        message: error instanceof Error ? error.message : String(error),
        format: "pdf",
        documentId,
      });
      return ipcError("IO_ERROR", "Failed to write PDF export file");
    }
  }

  async function exportDocx(args: {
    projectId: string;
    documentId?: string;
  }): Promise<ServiceResult<ExportResult>> {
    const projectId = args.projectId.trim();
    if (projectId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    const docIdRes = await resolveDocumentId({
      projectId,
      documentId: args.documentId,
    });
    if (!docIdRes.ok) {
      return docIdRes;
    }

    const documentId = docIdRes.data.documentId.trim();
    if (!isSafePathSegment(projectId) || !isSafePathSegment(documentId)) {
      return ipcError("INVALID_ARGUMENT", "Unsafe export path segments");
    }

    const relativeParts = ["exports", projectId, `${documentId}.docx`];
    const relativePath = relativeParts.join("/");
    const absPath = path.join(deps.userDataDir, ...relativeParts);

    deps.logger.info("export_started", {
      format: "docx",
      documentId,
      relativePath,
    });

    try {
      const docSvc = createDocumentService({
        db: deps.db,
        logger: deps.logger,
      });
      const docData = docSvc.read({ projectId, documentId });
      if (!docData.ok) {
        return docData;
      }

      // Parse content and create DOCX paragraphs
      const paragraphs: Paragraph[] = [];

      // Add title
      paragraphs.push(
        new Paragraph({
          text: docData.data.title,
          heading: HeadingLevel.TITLE,
        }),
      );

      // Add content (split by newlines)
      const lines = docData.data.contentText.split(/\n+/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          paragraphs.push(new Paragraph({ children: [] }));
        } else {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun(trimmed)],
            }),
          );
        }
      }

      const docx = new Document({
        sections: [{ children: paragraphs }],
      });

      const buffer = await Packer.toBuffer(docx);
      await atomicWrite({
        targetPath: absPath,
        writeTemp: async (tempPath) => {
          await fs.writeFile(tempPath, buffer);
        },
      });

      const bytesWritten = buffer.length;
      deps.logger.info("export_succeeded", {
        format: "docx",
        documentId,
        relativePath,
        bytesWritten,
      });

      return { ok: true, data: { relativePath, bytesWritten } };
    } catch (error) {
      deps.logger.error("export_failed", {
        code: "IO_ERROR",
        message: error instanceof Error ? error.message : String(error),
        format: "docx",
        documentId,
      });
      return ipcError("IO_ERROR", "Failed to write DOCX export file");
    }
  }

  return {
    exportMarkdown,
    exportProjectBundle,
    exportTxt,
    exportPdf,
    exportDocx,
  };
}
