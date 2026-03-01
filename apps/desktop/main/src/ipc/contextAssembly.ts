import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import { sha256Hex } from "@shared/hashUtils";
import type { IpcResponse } from "@shared/types/ipc-generated";
import { redactText } from "@shared/redaction/redact";
import type { Logger } from "../logging/logger";
import {
  CONTEXT_CAPACITY_LIMITS,
  isContextAssemblyError,
  type ContextAssembleRequest,
  type ContextAssembleResult,
  type ContextInspectRequest,
  type ContextInspectResult,
  type ContextLayerAssemblyService,
} from "../services/context/layerAssemblyService";
import { guardAndNormalizeProjectAccess } from "./projectAccessGuard";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type ProjectRow = {
  rootPath: string;
};

const INSPECT_ALLOWED_ROLES = new Set(["owner", "maintainer"]);

type ContextAssemblyRegistrarDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  contextAssemblyService: ContextLayerAssemblyService;
  inFlightByDocument: Map<string, number>;
  projectSessionBinding?: ProjectSessionBindingRegistry;
  resolveInspectRole?: (args: {
    webContentsId: number;
    projectId: string;
    requestedBy?: string;
  }) => string | null;
};

function estimateInputTokens(text: string): number {
  const bytes = new TextEncoder().encode(text).length;
  return bytes === 0 ? 0 : Math.ceil(bytes / 4);
}

function normalizeCallerRole(role: unknown): string {
  if (typeof role !== "string") {
    return "unknown";
  }
  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "unknown";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function senderWebContentsId(event: unknown): number | null {
  if (!isRecord(event)) {
    return null;
  }
  const sender = event.sender;
  if (!isRecord(sender) || typeof sender.id !== "number") {
    return null;
  }
  return sender.id;
}

function resolveTrustedInspectRole(args: {
  event: unknown;
  payload: ContextInspectRequest;
  resolveInspectRole?: (args: {
    webContentsId: number;
    projectId: string;
    requestedBy?: string;
  }) => string | null;
}): string {
  if (!args.resolveInspectRole) {
    return "unknown";
  }
  const webContentsId = senderWebContentsId(args.event);
  if (!webContentsId) {
    return "unknown";
  }
  const role = args.resolveInspectRole({
    webContentsId,
    projectId: args.payload.projectId.trim(),
    requestedBy: args.payload.requestedBy,
  });
  return normalizeCallerRole(role);
}

function buildInputAudit(args: {
  additionalInput?: string;
  debugMode: boolean;
}): {
  inputTokens: number;
  inputHash?: string;
  sampledInputRedacted?: string;
  sampledInputEvidenceCount?: number;
} {
  const text = args.additionalInput?.trim() ?? "";
  const inputTokens = estimateInputTokens(text);
  if (text.length === 0) {
    return { inputTokens };
  }

  if (!args.debugMode) {
    return {
      inputTokens,
      inputHash: sha256Hex(text),
    };
  }

  const redacted = redactText({
    text,
    sourceRef: "context:prompt:input",
  });
  return {
    inputTokens,
    inputHash: sha256Hex(text),
    sampledInputRedacted: redacted.redactedText.slice(0, 160),
    sampledInputEvidenceCount: redacted.evidence.length,
  };
}

function projectExists(db: Database.Database, projectId: string): boolean {
  const row = db
    .prepare<
      [string],
      ProjectRow
    >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
    .get(projectId);
  return Boolean(row);
}

function documentInFlightKey(projectId: string, documentId: string): string {
  return `${projectId}:${documentId}`;
}

function tryAcquireDocumentSlot(args: {
  inFlightByDocument: Map<string, number>;
  key: string;
}): {
  acquired: boolean;
  next: number;
} {
  const current = args.inFlightByDocument.get(args.key) ?? 0;
  if (current >= CONTEXT_CAPACITY_LIMITS.maxConcurrentByDocument) {
    return { acquired: false, next: current };
  }
  const next = current + 1;
  args.inFlightByDocument.set(args.key, next);
  return { acquired: true, next };
}

function releaseDocumentSlot(args: {
  inFlightByDocument: Map<string, number>;
  key: string;
}): void {
  const current = args.inFlightByDocument.get(args.key);
  if (current === undefined) {
    return;
  }
  if (current <= 1) {
    args.inFlightByDocument.delete(args.key);
    return;
  }
  args.inFlightByDocument.set(args.key, current - 1);
}

export function registerContextAssemblyHandlers(
  deps: ContextAssemblyRegistrarDeps,
): void {
  deps.ipcMain.handle(
    "context:prompt:assemble",
    async (
      _e,
      payload: ContextAssembleRequest,
    ): Promise<IpcResponse<ContextAssembleResult>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }
      if (payload.documentId.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId is required",
          },
        };
      }
      if (payload.skillId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "skillId is required" },
        };
      }
      if (
        typeof payload.cursorPosition !== "number" ||
        Number.isNaN(payload.cursorPosition)
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "cursorPosition must be a valid number",
          },
        };
      }

      const inputAudit = buildInputAudit({
        additionalInput: payload.additionalInput,
        debugMode: false,
      });
      if (inputAudit.inputTokens > CONTEXT_CAPACITY_LIMITS.maxInputTokens) {
        deps.logger.error("context_input_too_large", {
          code: "CONTEXT_INPUT_TOO_LARGE",
          channel: "context:prompt:assemble",
          projectId: payload.projectId,
          documentId: payload.documentId,
          ...inputAudit,
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_INPUT_TOO_LARGE",
            message:
              "Input exceeds 64k token limit. Please reduce, split, or shrink additionalInput.",
          },
        };
      }

      const slotKey = documentInFlightKey(
        payload.projectId,
        payload.documentId,
      );
      const slot = tryAcquireDocumentSlot({
        inFlightByDocument: deps.inFlightByDocument,
        key: slotKey,
      });
      if (!slot.acquired) {
        deps.logger.error("context_backpressure", {
          code: "CONTEXT_BACKPRESSURE",
          channel: "context:prompt:assemble",
          projectId: payload.projectId,
          documentId: payload.documentId,
          inFlight: slot.next,
          limit: CONTEXT_CAPACITY_LIMITS.maxConcurrentByDocument,
          ...inputAudit,
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_BACKPRESSURE",
            message:
              "Context assemble backpressure: too many concurrent requests",
          },
        };
      }

      try {
        if (!projectExists(deps.db, payload.projectId)) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const assembled = await deps.contextAssemblyService.assemble(payload);
        return { ok: true, data: assembled };
      } catch (error) {
        if (
          isContextAssemblyError(error) &&
          error.code === "CONTEXT_SCOPE_VIOLATION"
        ) {
          deps.logger.error("context_scope_violation", {
            code: error.code,
            channel: "context:prompt:assemble",
            projectId: payload.projectId,
            documentId: payload.documentId,
            message: error.message,
          });
          return {
            ok: false,
            error: { code: error.code, message: error.message },
          };
        }
        deps.logger.error("context_assemble_failed", {
          code: "INTERNAL",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "Failed to assemble context" },
        };
      } finally {
        releaseDocumentSlot({
          inFlightByDocument: deps.inFlightByDocument,
          key: slotKey,
        });
      }
    },
  );

  deps.ipcMain.handle(
    "context:prompt:inspect",
    async (
      event,
      payload: ContextInspectRequest,
    ): Promise<IpcResponse<ContextInspectResult>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }
      if (payload.documentId.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId is required",
          },
        };
      }
      if (payload.skillId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "skillId is required" },
        };
      }
      if (
        typeof payload.cursorPosition !== "number" ||
        Number.isNaN(payload.cursorPosition)
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "cursorPosition must be a valid number",
          },
        };
      }

      const guarded = guardAndNormalizeProjectAccess({
        event,
        payload,
        projectSessionBinding: deps.projectSessionBinding,
      });
      if (!guarded.ok) {
        deps.logger.info("context_inspect_forbidden", {
          code: "CONTEXT_INSPECT_FORBIDDEN",
          projectId: payload.projectId,
          documentId: payload.documentId,
          callerRole: normalizeCallerRole(payload.callerRole),
          trustedRole: "unknown",
          requestedBy: payload.requestedBy ?? "unknown",
          debugMode: payload.debugMode === true,
          reason: "unbound_or_mismatched_renderer_session",
          ...buildInputAudit({
            additionalInput: payload.additionalInput,
            debugMode: false,
          }),
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_INSPECT_FORBIDDEN",
            message:
              "context:prompt:inspect requires debugMode=true and an authorized renderer session role",
          },
        };
      }

      const callerRole = normalizeCallerRole(payload.callerRole);
      const trustedRole = resolveTrustedInspectRole({
        event,
        payload,
        resolveInspectRole: deps.resolveInspectRole,
      });
      const debugMode = payload.debugMode === true;
      if (!debugMode || !INSPECT_ALLOWED_ROLES.has(trustedRole)) {
        deps.logger.info("context_inspect_forbidden", {
          code: "CONTEXT_INSPECT_FORBIDDEN",
          projectId: payload.projectId,
          documentId: payload.documentId,
          callerRole,
          trustedRole,
          requestedBy: payload.requestedBy ?? "unknown",
          debugMode,
          ...buildInputAudit({
            additionalInput: payload.additionalInput,
            debugMode: false,
          }),
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_INSPECT_FORBIDDEN",
            message:
              "context:prompt:inspect requires debugMode=true and an authorized renderer session role",
          },
        };
      }

      const inputAudit = buildInputAudit({
        additionalInput: payload.additionalInput,
        debugMode: true,
      });
      if (inputAudit.inputTokens > CONTEXT_CAPACITY_LIMITS.maxInputTokens) {
        deps.logger.error("context_input_too_large", {
          code: "CONTEXT_INPUT_TOO_LARGE",
          channel: "context:prompt:inspect",
          projectId: payload.projectId,
          documentId: payload.documentId,
          ...inputAudit,
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_INPUT_TOO_LARGE",
            message:
              "Input exceeds 64k token limit. Please reduce, split, or shrink additionalInput.",
          },
        };
      }

      const slotKey = documentInFlightKey(
        payload.projectId,
        payload.documentId,
      );
      const slot = tryAcquireDocumentSlot({
        inFlightByDocument: deps.inFlightByDocument,
        key: slotKey,
      });
      if (!slot.acquired) {
        deps.logger.error("context_backpressure", {
          code: "CONTEXT_BACKPRESSURE",
          channel: "context:prompt:inspect",
          projectId: payload.projectId,
          documentId: payload.documentId,
          inFlight: slot.next,
          limit: CONTEXT_CAPACITY_LIMITS.maxConcurrentByDocument,
          ...inputAudit,
        });
        return {
          ok: false,
          error: {
            code: "CONTEXT_BACKPRESSURE",
            message:
              "Context inspect backpressure: too many concurrent requests",
          },
        };
      }

      try {
        if (!projectExists(deps.db, payload.projectId)) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const inspected = await deps.contextAssemblyService.inspect(payload);
        return { ok: true, data: inspected };
      } catch (error) {
        if (
          isContextAssemblyError(error) &&
          error.code === "CONTEXT_SCOPE_VIOLATION"
        ) {
          deps.logger.error("context_scope_violation", {
            code: error.code,
            channel: "context:prompt:inspect",
            projectId: payload.projectId,
            documentId: payload.documentId,
            message: error.message,
          });
          return {
            ok: false,
            error: { code: error.code, message: error.message },
          };
        }
        deps.logger.error("context_inspect_failed", {
          code: "INTERNAL",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "Failed to inspect context" },
        };
      } finally {
        releaseDocumentSlot({
          inFlightByDocument: deps.inFlightByDocument,
          key: slotKey,
        });
      }
    },
  );
}
