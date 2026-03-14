import type { IpcError } from "@shared/types/ipc-generated";

import type { IpcInvoke } from "../lib/ipcTypes";
import type { EditorSaveRequest } from "./editorSaveQueue";
import type { EditorStore } from "./editorStore";

type EditorStoreDeps = {
  get: () => EditorStore;
  set: (patch: Partial<EditorStore>) => void;
};

type ExecuteSaveDeps = EditorStoreDeps & {
  invoke: IpcInvoke;
};

function isCurrentRequest(
  state: Pick<EditorStore, "projectId" | "documentId">,
  request: Pick<EditorSaveRequest, "projectId" | "documentId">,
): boolean {
  return (
    state.projectId === request.projectId &&
    state.documentId === request.documentId
  );
}

function toUnexpectedSaveError(error: unknown): IpcError {
  return {
    code: "INTERNAL_ERROR",
    message:
      error instanceof Error
        ? error.message
        : "file:document:save threw unexpectedly",
  };
}

export function createSaveQueueUnexpectedErrorHandler(deps: EditorStoreDeps) {
  return ({
    request,
    error,
  }: {
    request: EditorSaveRequest;
    error: unknown;
  }) => {
    if (!isCurrentRequest(deps.get(), request)) {
      return;
    }

    deps.set({
      autosaveStatus: "error",
      autosaveError: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "editor save queue failed unexpectedly",
      },
    });
  };
}

export function createRetryLastAutosaveAction(deps: EditorStoreDeps) {
  return async () => {
    const state = deps.get();
    if (
      !state.projectId ||
      !state.documentId ||
      !state.lastSavedOrQueuedJson ||
      state.lastSavedOrQueuedJson.length === 0
    ) {
      return;
    }

    deps.set({ autosaveError: null });
    await state.save({
      projectId: state.projectId,
      documentId: state.documentId,
      contentJson: state.lastSavedOrQueuedJson,
      actor: "auto",
      reason: "autosave",
    });
  };
}

export function createFlushPendingAutosaveAction(deps: EditorStoreDeps) {
  return async () => {
    const state = deps.get();
    if (
      !state.projectId ||
      !state.documentId ||
      !state.lastSavedOrQueuedJson ||
      state.lastSavedOrQueuedJson.length === 0
    ) {
      deps.set({ pendingFlushError: null });
      return;
    }

    await state.save({
      projectId: state.projectId,
      documentId: state.documentId,
      contentJson: state.lastSavedOrQueuedJson,
      actor: "auto",
      reason: "autosave",
    });

    const current = deps.get();
    if (
      isCurrentRequest(current, {
        projectId: state.projectId,
        documentId: state.documentId,
      }) &&
      current.autosaveStatus === "error" &&
      current.autosaveError
    ) {
      deps.set({
        pendingFlushError: {
          documentId: state.documentId,
          error: current.autosaveError,
        },
      });
      return;
    }

    deps.set({ pendingFlushError: null });
  };
}

export function createSaveQueueExecuteSave(deps: ExecuteSaveDeps) {
  return async (request: EditorSaveRequest) => {
    if (isCurrentRequest(deps.get(), request)) {
      deps.set({
        autosaveStatus: "saving",
        lastSavedOrQueuedJson: request.contentJson,
      });
    }

    try {
      const res = await deps.invoke("file:document:save", {
        projectId: request.projectId,
        documentId: request.documentId,
        contentJson: request.contentJson,
        actor: request.actor,
        reason: request.reason,
      });

      if (!res.ok) {
        if (isCurrentRequest(deps.get(), request)) {
          deps.set({ autosaveStatus: "error", autosaveError: res.error });
        }
        return;
      }

      if (isCurrentRequest(deps.get(), request)) {
        deps.set({
          autosaveStatus: "saved",
          autosaveError: null,
        });
      }
    } catch (error) {
      if (isCurrentRequest(deps.get(), request)) {
        deps.set({
          autosaveStatus: "error",
          autosaveError: toUnexpectedSaveError(error),
        });
      }
    }
  };
}
