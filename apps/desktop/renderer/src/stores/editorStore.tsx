import React from "react";
import { create } from "zustand";
import type { Editor } from "@tiptap/react";

import type {
  IpcError,
  IpcInvokeResult,
  IpcRequest,
} from "@shared/types/ipc-generated";
import {
  createEditorSaveQueue,
  type EditorSaveRequest,
} from "./editorSaveQueue";
import type { IpcInvoke } from "../lib/ipcTypes";

export type { IpcInvoke };

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";
export type DocumentStatus = IpcRequest<"file:document:updatestatus">["status"];
export type EntityCompletionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error";

export type EntityCompletionCandidate = {
  id: string;
  name: string;
  type: IpcRequest<"knowledge:entity:create">["type"];
};

export type PendingFlushError = {
  documentId: string;
  error: IpcError;
};

export type EntityCompletionSession = {
  open: boolean;
  query: string;
  triggerFrom: number;
  triggerTo: number;
  anchorTop: number;
  anchorLeft: number;
  selectedIndex: number;
  status: EntityCompletionStatus;
  candidates: EntityCompletionCandidate[];
  message: string | null;
};

export type EditorState = {
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  projectId: string | null;
  documentId: string | null;
  documentStatus: DocumentStatus | null;
  documentContentJson: string | null;
  editor: Editor | null;
  lastSavedOrQueuedJson: string | null;
  documentCharacterCount: number;
  capacityWarning: string | null;
  autosaveStatus: AutosaveStatus;
  autosaveError: IpcError | null;
  pendingFlushError: PendingFlushError | null;
  entityCompletionSession: EntityCompletionSession;
  /** Whether compare mode is active (showing DiffView instead of Editor) */
  compareMode: boolean;
  /** The version ID being compared against current */
  compareVersionId: string | null;
};

export type EditorActions = {
  bootstrapForProject: (projectId: string) => Promise<void>;
  openCurrentDocumentForProject: (projectId: string) => Promise<void>;
  openDocument: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<void>;
  setEditorInstance: (editor: Editor | null) => void;
  save: (args: {
    projectId: string;
    documentId: string;
    contentJson: string;
    actor: "user" | "auto";
    reason: "manual-save" | "autosave";
  }) => Promise<void>;
  retryLastAutosave: () => Promise<void>;
  flushPendingAutosave: () => Promise<void>;
  clearPendingFlushError: () => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  setDocumentCharacterCount: (count: number) => void;
  setCapacityWarning: (warning: string | null) => void;
  setEntityCompletionSession: (patch: Partial<EntityCompletionSession>) => void;
  clearEntityCompletionSession: () => void;
  listKnowledgeEntities: (args: {
    projectId: string;
  }) => Promise<IpcInvokeResult<"knowledge:entity:list">>;
  clearAutosaveError: () => void;
  downgradeFinalStatusForEdit: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<boolean>;
  /** Enable or disable compare mode with a specific version */
  setCompareMode: (enabled: boolean, versionId?: string | null) => void;
};

export type EditorStore = EditorState & EditorActions;

export type UseEditorStore = ReturnType<typeof createEditorStore>;

const EditorStoreContext = React.createContext<UseEditorStore | null>(null);

function createInitialEntityCompletionSession(): EntityCompletionSession {
  return {
    open: false,
    query: "",
    triggerFrom: 0,
    triggerTo: 0,
    anchorTop: 0,
    anchorLeft: 0,
    selectedIndex: 0,
    status: "idle",
    candidates: [],
    message: null,
  };
}

function createSaveQueueUnexpectedErrorHandler(deps: {
  get: () => EditorStore;
  set: (patch: Partial<EditorStore>) => void;
}) {
  return ({
    request,
    error,
  }: {
    request: EditorSaveRequest;
    error: unknown;
  }) => {
    const stillCurrent =
      deps.get().projectId === request.projectId &&
      deps.get().documentId === request.documentId;
    if (!stillCurrent) {
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

function createRetryLastAutosaveAction(deps: {
  get: () => EditorStore;
  set: (patch: Partial<EditorStore>) => void;
}) {
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

function createFlushPendingAutosaveAction(deps: {
  get: () => EditorStore;
  set: (patch: Partial<EditorStore>) => void;
}) {
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
      current.projectId === state.projectId &&
      current.documentId === state.documentId &&
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

/**
 * Create a zustand store for editor/document state.
 *
 * Why: editor state and autosave status must be shared between the editor pane
 * and StatusBar, and must be driven through typed IPC.
 */
export function createEditorStore(deps: { invoke: IpcInvoke }) {
  let latestBootstrapRequestId = 0;

  return create<EditorStore>((set, get) => {
    const saveQueue = createEditorSaveQueue({
      onUnexpectedError: createSaveQueueUnexpectedErrorHandler({
        get,
        set: (patch) => set(patch),
      }),
      executeSave: async (request: EditorSaveRequest) => {
        const isCurrent =
          get().projectId === request.projectId &&
          get().documentId === request.documentId;
        if (isCurrent) {
          set({
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
            const stillCurrent =
              get().projectId === request.projectId &&
              get().documentId === request.documentId;
            if (stillCurrent) {
              set({ autosaveStatus: "error", autosaveError: res.error });
            }
            return;
          }

          const stillCurrent =
            get().projectId === request.projectId &&
            get().documentId === request.documentId;
          if (stillCurrent) {
            set({
              autosaveStatus: "saved",
              autosaveError: null,
            });
          }
        } catch (error) {
          const stillCurrent =
            get().projectId === request.projectId &&
            get().documentId === request.documentId;
          if (stillCurrent) {
            set({
              autosaveStatus: "error",
              autosaveError: {
                code: "INTERNAL_ERROR",
                message:
                  error instanceof Error
                    ? error.message
                    : "file:document:save threw unexpectedly",
              },
            });
          }
        }
      },
    });

    return {
      bootstrapStatus: "idle",
      projectId: null,
      documentId: null,
      documentStatus: null,
      documentContentJson: null,
      editor: null,
      lastSavedOrQueuedJson: null,
      documentCharacterCount: 0,
      capacityWarning: null,
      autosaveStatus: "idle",
      autosaveError: null,
      pendingFlushError: null,
      entityCompletionSession: createInitialEntityCompletionSession(),
      compareMode: false,
      compareVersionId: null,

      setAutosaveStatus: (status) => set({ autosaveStatus: status }),
      setDocumentCharacterCount: (count) =>
        set({ documentCharacterCount: count }),
      setCapacityWarning: (warning) => set({ capacityWarning: warning }),
      setEntityCompletionSession: (patch) =>
        set((state) => ({
          entityCompletionSession: {
            ...state.entityCompletionSession,
            ...patch,
          },
        })),
      clearEntityCompletionSession: () =>
        set({
          entityCompletionSession: createInitialEntityCompletionSession(),
        }),
      listKnowledgeEntities: async ({ projectId }) => {
        return await deps.invoke("knowledge:entity:list", { projectId });
      },
      clearAutosaveError: () => set({ autosaveError: null }),
      setEditorInstance: (editor) => set({ editor }),
      setCompareMode: (enabled, versionId) =>
        set({
          compareMode: enabled,
          compareVersionId: enabled ? (versionId ?? null) : null,
        }),

      bootstrapForProject: async (projectId) => {
        const requestId = ++latestBootstrapRequestId;
        const shouldCommit = () => requestId === latestBootstrapRequestId;
        set({ bootstrapStatus: "loading", projectId });
        let documentId: string | null = null;
        const currentRes = await deps.invoke("file:document:getcurrent", {
          projectId,
        });
        if (!shouldCommit()) return;
        if (currentRes.ok) {
          documentId = currentRes.data.documentId;
        } else if (currentRes.error.code === "NOT_FOUND") {
          const listRes = await deps.invoke("file:document:list", {
            projectId,
          });
          if (!shouldCommit()) return;
          if (!listRes.ok) {
            set({ bootstrapStatus: "error" });
            return;
          }

          documentId = listRes.data.items[0]?.documentId ?? null;
          if (!documentId) {
            const created = await deps.invoke("file:document:create", {
              projectId,
            });
            if (!shouldCommit()) return;
            if (!created.ok) {
              set({ bootstrapStatus: "error" });
              return;
            }
            documentId = created.data.documentId;
          }

          const setRes = await deps.invoke("file:document:setcurrent", {
            projectId,
            documentId,
          });
          if (!shouldCommit()) return;
          if (!setRes.ok) {
            set({ bootstrapStatus: "error" });
            return;
          }
        } else {
          set({ bootstrapStatus: "error" });
          return;
        }

        if (!documentId) {
          set({
            bootstrapStatus: "ready",
            projectId,
            documentId: null,
            documentStatus: null,
          });
          return;
        }

        const readRes = await deps.invoke("file:document:read", {
          projectId,
          documentId,
        });
        if (!shouldCommit()) return;
        if (!readRes.ok) {
          set({ bootstrapStatus: "error" });
          return;
        }

        set({
          bootstrapStatus: "ready",
          projectId,
          documentId,
          documentStatus: readRes.data.status,
          documentContentJson: readRes.data.contentJson,
          lastSavedOrQueuedJson: readRes.data.contentJson,
          documentCharacterCount: 0,
          capacityWarning: null,
          autosaveStatus: "idle",
          autosaveError: null,
          entityCompletionSession: createInitialEntityCompletionSession(),
        });
      },

      openDocument: async ({ projectId, documentId }) => {
        const current = get();
        if (
          current.projectId === projectId &&
          current.documentId &&
          current.documentId !== documentId
        ) {
          await current.flushPendingAutosave();
        }

        set({
          bootstrapStatus: "loading",
          projectId,
          autosaveError: null,
        });

        const readRes = await deps.invoke("file:document:read", {
          projectId,
          documentId,
        });
        if (!readRes.ok) {
          set({ bootstrapStatus: "error" });
          return;
        }

        set({
          bootstrapStatus: "ready",
          projectId,
          documentId,
          documentStatus: readRes.data.status,
          documentContentJson: readRes.data.contentJson,
          lastSavedOrQueuedJson: readRes.data.contentJson,
          documentCharacterCount: 0,
          capacityWarning: null,
          autosaveStatus: "idle",
          autosaveError: null,
          entityCompletionSession: createInitialEntityCompletionSession(),
        });
      },

      openCurrentDocumentForProject: async (projectId) => {
        set({ bootstrapStatus: "loading", projectId, autosaveError: null });

        const currentRes = await deps.invoke("file:document:getcurrent", {
          projectId,
        });
        if (currentRes.ok) {
          await get().openDocument({
            projectId,
            documentId: currentRes.data.documentId,
          });
          return;
        }

        if (currentRes.error.code === "NOT_FOUND") {
          set({
            bootstrapStatus: "ready",
            projectId,
            documentId: null,
            documentStatus: null,
            documentContentJson: null,
            lastSavedOrQueuedJson: null,
            documentCharacterCount: 0,
            capacityWarning: null,
            autosaveStatus: "idle",
            autosaveError: null,
            entityCompletionSession: createInitialEntityCompletionSession(),
          });
          return;
        }

        set({ bootstrapStatus: "error" });
      },

      save: async ({ projectId, documentId, contentJson, actor, reason }) => {
        await saveQueue.enqueue({
          projectId,
          documentId,
          contentJson,
          actor,
          reason,
        });
      },

      downgradeFinalStatusForEdit: async ({ projectId, documentId }) => {
        const res = await deps.invoke("file:document:updatestatus", {
          projectId,
          documentId,
          status: "draft",
        });
        if (!res.ok) {
          set({ autosaveStatus: "error", autosaveError: res.error });
          return false;
        }

        set({ documentStatus: "draft", autosaveError: null });
        return true;
      },

      retryLastAutosave: createRetryLastAutosaveAction({
        get,
        set: (patch) => set(patch),
      }),

      flushPendingAutosave: createFlushPendingAutosaveAction({
        get,
        set: (patch) => set(patch),
      }),

      clearPendingFlushError: () => {
        set({ pendingFlushError: null });
      },
    };
  });
}

/**
 * Provide an editor store instance for the Workbench UI.
 */
export function EditorStoreProvider(props: {
  store: UseEditorStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <EditorStoreContext.Provider value={props.store}>
      {props.children}
    </EditorStoreContext.Provider>
  );
}

/**
 * Read values from the injected editor store.
 */
export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = React.useContext(EditorStoreContext);
  if (!store) {
    throw new Error("EditorStoreProvider is missing");
  }
  return store(selector);
}
