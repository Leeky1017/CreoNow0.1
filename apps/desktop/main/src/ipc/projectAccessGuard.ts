import type { IpcResponse } from "@shared/types/ipc-generated";

import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type ProjectScopedPayload = {
  projectId?: unknown;
  [key: string]: unknown;
};

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

/**
 * Enforce renderer-session project binding for project-scoped IPC payloads.
 *
 * Why: sensitive IPC channels must not trust arbitrary payload.projectId values.
 */
export function guardAndNormalizeProjectAccess(args: {
  event: unknown;
  payload: unknown;
  projectSessionBinding?: ProjectSessionBindingRegistry;
}): { ok: true } | { ok: false; response: IpcResponse<never> } {
  if (!args.projectSessionBinding || !isRecord(args.payload)) {
    return { ok: true };
  }

  const payload = args.payload as ProjectScopedPayload;
  if (!Object.hasOwn(payload, "projectId")) {
    return { ok: true };
  }

  const webContentsId = senderWebContentsId(args.event);
  if (!webContentsId) {
    return { ok: true };
  }

  const boundProjectId = args.projectSessionBinding.resolveProjectId({
    webContentsId,
  });
  if (!boundProjectId) {
    return {
      ok: false,
      response: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "renderer session is not bound to an active project",
        },
      },
    };
  }

  const requestedProjectId =
    typeof payload.projectId === "string" ? payload.projectId.trim() : "";
  if (requestedProjectId.length === 0) {
    payload.projectId = boundProjectId;
    return { ok: true };
  }

  if (requestedProjectId !== boundProjectId) {
    return {
      ok: false,
      response: {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "projectId is not active for this renderer session",
        },
      },
    };
  }

  payload.projectId = requestedProjectId;
  return { ok: true };
}
