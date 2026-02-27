import React from "react";
import { create } from "zustand";

import type {
  IpcError,
  IpcInvokeResult,
  IpcRequest,
  IpcResponse,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import type { IpcInvoke } from "../lib/ipcTypes";

export type { IpcInvoke };

export type DocumentListItem =
  IpcResponseData<"file:document:list">["items"][number];
export type DocumentType = NonNullable<
  IpcRequest<"file:document:create">["type"]
>;
export type DocumentStatus = IpcRequest<"file:document:updatestatus">["status"];

export type FileState = {
  projectId: string | null;
  items: DocumentListItem[];
  currentDocumentId: string | null;
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  lastError: IpcError | null;
};

export type FileActions = {
  bootstrapForProject: (projectId: string) => Promise<void>;
  refreshForProject: (projectId: string) => Promise<void>;
  createAndSetCurrent: (args: {
    projectId: string;
    title?: string;
    type?: DocumentType;
  }) => Promise<IpcResponse<{ documentId: string }>>;
  rename: (args: {
    projectId: string;
    documentId: string;
    title: string;
  }) => Promise<IpcResponse<{ updated: true }>>;
  updateStatus: (args: {
    projectId: string;
    documentId: string;
    status: DocumentStatus;
  }) => Promise<IpcResponse<{ updated: true; status: DocumentStatus }>>;
  delete: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<IpcResponse<{ deleted: true }>>;
  setCurrent: (args: {
    projectId: string;
    documentId: string;
  }) => Promise<IpcResponse<{ documentId: string }>>;
  clearError: () => void;
  reorder: (args: {
    projectId: string;
    orderedDocumentIds: string[];
  }) => Promise<IpcResponse<{ updated: true }>>;
  moveToFolder: (args: {
    projectId: string;
    documentId: string;
    parentId: string;
  }) => Promise<IpcResponse<{ updated: true }>>;
};

export type FileStore = FileState & FileActions;

export type UseFileStore = ReturnType<typeof createFileStore>;

const FileStoreContext = React.createContext<UseFileStore | null>(null);

/**
 * Create a zustand store for project-scoped documents list and current document.
 *
 * Why: the sidebar file tree must be driven through typed IPC with a stable,
 * testable state machine, and `currentDocumentId` must persist per project.
 */
export function createFileStore(deps: { invoke: IpcInvoke }) {
  async function loadDocuments(
    projectId: string,
  ): Promise<IpcInvokeResult<"file:document:list">> {
    return await deps.invoke("file:document:list", { projectId });
  }

  async function loadCurrent(
    projectId: string,
  ): Promise<IpcInvokeResult<"file:document:getcurrent">> {
    return await deps.invoke("file:document:getcurrent", { projectId });
  }

  async function persistCurrent(
    projectId: string,
    documentId: string,
  ): Promise<IpcInvokeResult<"file:document:setcurrent">> {
    return await deps.invoke("file:document:setcurrent", {
      projectId,
      documentId,
    });
  }

  async function createDocument(
    projectId: string,
    title?: string,
    type?: DocumentType,
  ): Promise<IpcInvokeResult<"file:document:create">> {
    return await deps.invoke("file:document:create", {
      projectId,
      title,
      type,
    });
  }

  return create<FileStore>((set, get) => ({
    projectId: null,
    items: [],
    currentDocumentId: null,
    bootstrapStatus: "idle",
    lastError: null,

    clearError: () => set({ lastError: null }),

    refreshForProject: async (projectId) => {
      const listRes = await loadDocuments(projectId);
      if (!listRes.ok) {
        set({ lastError: listRes.error });
        return;
      }

      const currentRes = await loadCurrent(projectId);
      const currentDocumentId = currentRes.ok
        ? currentRes.data.documentId
        : null;

      set({
        projectId,
        items: listRes.data.items,
        currentDocumentId,
      });
    },

    bootstrapForProject: async (projectId) => {
      const state = get();
      if (
        state.bootstrapStatus === "loading" &&
        state.projectId === projectId
      ) {
        return;
      }

      set({
        projectId,
        bootstrapStatus: "loading",
        lastError: null,
        items: [],
        currentDocumentId: null,
      });

      const listRes = await loadDocuments(projectId);
      if (!listRes.ok) {
        set({ bootstrapStatus: "error", lastError: listRes.error });
        return;
      }

      const currentRes = await loadCurrent(projectId);
      if (currentRes.ok) {
        set({
          bootstrapStatus: "ready",
          items: listRes.data.items,
          currentDocumentId: currentRes.data.documentId,
          lastError: null,
        });
        return;
      }
      if (currentRes.error.code !== "NOT_FOUND") {
        set({
          bootstrapStatus: "error",
          items: listRes.data.items,
          lastError: currentRes.error,
        });
        return;
      }

      const firstExisting = listRes.data.items[0]?.documentId ?? null;
      if (firstExisting) {
        const setRes = await persistCurrent(projectId, firstExisting);
        if (!setRes.ok) {
          set({
            bootstrapStatus: "error",
            items: listRes.data.items,
            lastError: setRes.error,
          });
          return;
        }
        set({
          bootstrapStatus: "ready",
          items: listRes.data.items,
          currentDocumentId: setRes.data.documentId,
          lastError: null,
        });
        return;
      }

      const created = await createDocument(projectId);
      if (!created.ok) {
        set({ bootstrapStatus: "error", lastError: created.error });
        return;
      }

      const setRes = await persistCurrent(projectId, created.data.documentId);
      if (!setRes.ok) {
        set({ bootstrapStatus: "error", lastError: setRes.error });
        return;
      }

      const listRes2 = await loadDocuments(projectId);
      if (!listRes2.ok) {
        set({ bootstrapStatus: "error", lastError: listRes2.error });
        return;
      }

      set({
        bootstrapStatus: "ready",
        items: listRes2.data.items,
        currentDocumentId: setRes.data.documentId,
        lastError: null,
      });
    },

    createAndSetCurrent: async ({ projectId, title, type }) => {
      const created = await createDocument(projectId, title, type);
      if (!created.ok) {
        set({ lastError: created.error });
        return created;
      }

      const setRes = await persistCurrent(projectId, created.data.documentId);
      if (!setRes.ok) {
        set({ lastError: setRes.error });
        return setRes;
      }

      await get().refreshForProject(projectId);
      return setRes;
    },

    rename: async ({ projectId, documentId, title }) => {
      const res = await deps.invoke("file:document:update", {
        projectId,
        documentId,
        title,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refreshForProject(projectId);
      return res;
    },

    updateStatus: async ({ projectId, documentId, status }) => {
      const res = await deps.invoke("file:document:updatestatus", {
        projectId,
        documentId,
        status,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refreshForProject(projectId);
      return res;
    },

    delete: async ({ projectId, documentId }) => {
      const res = await deps.invoke("file:document:delete", {
        projectId,
        documentId,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refreshForProject(projectId);
      return res;
    },

    setCurrent: async ({ projectId, documentId }) => {
      const prev = get().currentDocumentId;
      set({ currentDocumentId: documentId });

      const res = await persistCurrent(projectId, documentId);
      if (!res.ok) {
        set({ currentDocumentId: prev, lastError: res.error });
        return res;
      }

      set({ currentDocumentId: res.data.documentId });
      return res;
    },

    reorder: async ({ projectId, orderedDocumentIds }) => {
      const res = await deps.invoke("file:document:reorder", {
        projectId,
        orderedDocumentIds,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refreshForProject(projectId);
      return res;
    },

    moveToFolder: async ({ projectId, documentId, parentId }) => {
      const res = await deps.invoke("file:document:update", {
        projectId,
        documentId,
        parentId,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refreshForProject(projectId);
      return res;
    },
  }));
}

/**
 * Provide a file store instance for the Workbench UI.
 */
export function FileStoreProvider(props: {
  store: UseFileStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <FileStoreContext.Provider value={props.store}>
      {props.children}
    </FileStoreContext.Provider>
  );
}

/**
 * Read values from the injected file store.
 */
export function useFileStore<T>(selector: (state: FileStore) => T): T {
  const store = React.useContext(FileStoreContext);
  if (!store) {
    throw new Error("FileStoreProvider is missing");
  }
  return store(selector);
}
