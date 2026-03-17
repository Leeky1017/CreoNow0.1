import React from "react";
import { create } from "zustand";

import type { IpcError } from "@shared/types/ipc-generated";
import type { IpcInvoke } from "../lib/ipcTypes";

export type { IpcInvoke };

/**
 * Version list item from the backend.
 */
export type VersionListItem = {
  versionId: string;
  actor: "user" | "auto" | "ai";
  reason: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

/**
 * Full version content from version:snapshot:read.
 */
export type VersionContent = {
  documentId: string;
  projectId: string;
  versionId: string;
  actor: "user" | "auto" | "ai";
  reason: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

export type BranchMergeConflict = {
  conflictId: string;
  index: number;
  baseText: string;
  oursText: string;
  theirsText: string;
};

export type VersionStoreState = {
  /** Current document ID for version list */
  documentId: string | null;
  /** List fetch status */
  listStatus: "idle" | "loading" | "ready" | "error";
  /** Version list items */
  items: VersionListItem[];
  /** Last error */
  lastError: IpcError | null;
  /** Compare mode state */
  compareVersionId: string | null;
  compareStatus: "idle" | "loading" | "ready" | "error";
  compareVersionContent: VersionContent | null;
  /** Preview mode status */
  previewStatus: "idle" | "loading" | "ready" | "error";
  /** Version ID currently in preview mode */
  previewVersionId: string | null;
  /** Timestamp text shown in preview banner */
  previewTimestamp: string | null;
  /** Historical content shown in preview mode */
  previewContentJson: string | null;
  /** Preview error details */
  previewError: IpcError | null;
  /** Branch merge workflow status */
  branchMergeStatus: "idle" | "loading" | "conflict" | "ready" | "error";
  /** Branch merge last error */
  branchMergeError: IpcError | null;
  /** Active merge session ID when conflict exists */
  mergeSessionId: string | null;
  /** Conflict blocks returned by merge */
  mergeConflicts: BranchMergeConflict[];
};

export type VersionStoreActions = {
  /**
   * Fetch version list for a document.
   */
  fetchList: (documentId: string) => Promise<void>;
  /**
   * Read a specific version's content for comparison.
   */
  readVersion: (
    documentId: string,
    versionId: string,
  ) => Promise<VersionContent | null>;
  /**
   * Start compare mode with a specific version.
   */
  startCompare: (documentId: string, versionId: string) => Promise<void>;
  /**
   * Exit compare mode.
   */
  exitCompare: () => void;
  /**
   * Start read-only preview mode for a historical version.
   */
  startPreview: (
    documentId: string,
    args: { versionId: string; timestamp: string },
  ) => Promise<void>;
  /**
   * Exit read-only preview mode and return to current document.
   */
  exitPreview: () => void;
  /**
   * Restore a specific version.
   */
  restoreVersion: (
    documentId: string,
    versionId: string,
  ) => Promise<{ ok: boolean; error?: IpcError }>;
  /**
   * Merge source branch into target branch.
   */
  mergeBranch: (args: {
    documentId: string;
    sourceBranchName: string;
    targetBranchName: string;
  }) => Promise<{ ok: boolean; error?: IpcError }>;
  /**
   * Resolve merge conflict blocks and persist merged snapshot.
   */
  resolveBranchConflict: (args: {
    documentId: string;
    mergeSessionId: string;
    resolutions: Array<{
      conflictId: string;
      resolution: "ours" | "theirs" | "manual";
      manualText?: string;
    }>;
    resolvedBy: string;
  }) => Promise<{ ok: boolean; error?: IpcError }>;
  /**
   * Clear branch merge transient state.
   */
  clearBranchMergeState: () => void;
  /**
   * Clear all state.
   */
  reset: () => void;
};

export type VersionStore = VersionStoreState & VersionStoreActions;

export type UseVersionStore = ReturnType<typeof createVersionStore>;

const VersionStoreContext = React.createContext<UseVersionStore | null>(null);

const initialState: VersionStoreState = {
  documentId: null,
  listStatus: "idle",
  items: [],
  lastError: null,
  compareVersionId: null,
  compareStatus: "idle",
  compareVersionContent: null,
  previewStatus: "idle",
  previewVersionId: null,
  previewTimestamp: null,
  previewContentJson: null,
  previewError: null,
  branchMergeStatus: "idle",
  branchMergeError: null,
  mergeSessionId: null,
  mergeConflicts: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readConflictBlocks(details: unknown): {
  mergeSessionId: string | null;
  conflicts: BranchMergeConflict[];
} {
  if (!isRecord(details)) {
    return { mergeSessionId: null, conflicts: [] };
  }
  const mergeSessionId =
    typeof details.mergeSessionId === "string" ? details.mergeSessionId : null;
  const rawConflicts = Array.isArray(details.conflicts)
    ? details.conflicts
    : [];
  const conflicts: BranchMergeConflict[] = [];
  for (const item of rawConflicts) {
    if (!isRecord(item)) {
      continue;
    }
    if (
      typeof item.conflictId !== "string" ||
      typeof item.index !== "number" ||
      typeof item.baseText !== "string" ||
      typeof item.oursText !== "string" ||
      typeof item.theirsText !== "string"
    ) {
      continue;
    }
    conflicts.push({
      conflictId: item.conflictId,
      index: item.index,
      baseText: item.baseText,
      oursText: item.oursText,
      theirsText: item.theirsText,
    });
  }
  return { mergeSessionId, conflicts };
}

/**
 * Create a zustand store for version history state.
 *
 * Why: version list and compare state must be shared between Sidebar
 * (VersionHistoryPanel) and AppShell (DiffViewPanel).
 */
export function createVersionStore(deps: { invoke: IpcInvoke }) {
  return create<VersionStore>((set, get) => ({
    ...initialState,

    fetchList: async (documentId) => {
      set({ documentId, listStatus: "loading", lastError: null });

      const res = await deps.invoke("version:snapshot:list", { documentId });
      if (!res.ok) {
        set({ listStatus: "error", lastError: res.error });
        return;
      }

      set({
        listStatus: "ready",
        items: res.data.items,
      });
    },

    readVersion: async (documentId, versionId) => {
      const res = await deps.invoke("version:snapshot:read", {
        documentId,
        versionId,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return null;
      }
      return res.data;
    },

    startCompare: async (documentId, versionId) => {
      set({
        compareVersionId: versionId,
        compareStatus: "loading",
        compareVersionContent: null,
        lastError: null,
      });

      const res = await deps.invoke("version:snapshot:read", {
        documentId,
        versionId,
      });
      if (!res.ok) {
        set({ compareStatus: "error", lastError: res.error });
        return;
      }

      set({
        compareStatus: "ready",
        compareVersionContent: res.data,
      });
    },

    exitCompare: () => {
      set({
        compareVersionId: null,
        compareStatus: "idle",
        compareVersionContent: null,
      });
    },

    startPreview: async (documentId, args) => {
      set({
        previewStatus: "loading",
        previewVersionId: args.versionId,
        previewTimestamp: args.timestamp,
        previewContentJson: null,
        previewError: null,
      });

      const res = await deps.invoke("version:snapshot:read", {
        documentId,
        versionId: args.versionId,
      });
      if (!res.ok) {
        set({
          previewStatus: "error",
          previewContentJson: null,
          previewError: res.error,
        });
        return;
      }

      set({
        previewStatus: "ready",
        previewVersionId: res.data.versionId,
        previewContentJson: res.data.contentJson,
        previewError: null,
      });
    },

    exitPreview: () => {
      set({
        previewStatus: "idle",
        previewVersionId: null,
        previewTimestamp: null,
        previewContentJson: null,
        previewError: null,
      });
    },

    restoreVersion: async (documentId, versionId) => {
      const res = await deps.invoke("version:snapshot:rollback", {
        documentId,
        versionId,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return { ok: false, error: res.error };
      }

      // Refresh version list after restore
      await get().fetchList(documentId);
      return { ok: true };
    },

    mergeBranch: async ({ documentId, sourceBranchName, targetBranchName }) => {
      set({
        branchMergeStatus: "loading",
        branchMergeError: null,
      });

      const res = await deps.invoke("version:branch:merge", {
        documentId,
        sourceBranchName,
        targetBranchName,
      });
      if (!res.ok) {
        if (res.error.code === "CONFLICT") {
          const parsed = readConflictBlocks(res.error.details);
          set({
            branchMergeStatus: "conflict",
            branchMergeError: res.error,
            mergeSessionId: parsed.mergeSessionId,
            mergeConflicts: parsed.conflicts,
          });
        } else {
          set({
            branchMergeStatus: "error",
            branchMergeError: res.error,
          });
        }
        return { ok: false, error: res.error };
      }

      set({
        branchMergeStatus: "ready",
        branchMergeError: null,
        mergeSessionId: null,
        mergeConflicts: [],
      });
      await get().fetchList(documentId);
      return { ok: true };
    },

    resolveBranchConflict: async ({
      documentId,
      mergeSessionId,
      resolutions,
      resolvedBy,
    }) => {
      set({
        branchMergeStatus: "loading",
        branchMergeError: null,
      });

      const res = await deps.invoke("version:conflict:resolve", {
        documentId,
        mergeSessionId,
        resolutions,
        resolvedBy,
      });
      if (!res.ok) {
        set({
          branchMergeStatus: "error",
          branchMergeError: res.error,
        });
        return { ok: false, error: res.error };
      }

      set({
        branchMergeStatus: "ready",
        branchMergeError: null,
        mergeSessionId: null,
        mergeConflicts: [],
      });
      await get().fetchList(documentId);
      return { ok: true };
    },

    clearBranchMergeState: () => {
      set({
        branchMergeStatus: "idle",
        branchMergeError: null,
        mergeSessionId: null,
        mergeConflicts: [],
      });
    },

    reset: () => {
      set(initialState);
    },
  }));
}

/**
 * Provide a version store instance.
 */
export function VersionStoreProvider(props: {
  store: UseVersionStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <VersionStoreContext.Provider value={props.store}>
      {props.children}
    </VersionStoreContext.Provider>
  );
}

/**
 * Read values from the injected version store.
 */
export function useVersionStore<T>(selector: (state: VersionStore) => T): T {
  const store = React.useContext(VersionStoreContext);
  if (!store) {
    throw new Error("VersionStoreProvider is missing");
  }
  return store(selector);
}
