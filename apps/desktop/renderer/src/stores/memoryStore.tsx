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

export type MemoryItem = IpcResponseData<"memory:entry:list">["items"][number];
export type MemorySettings = IpcResponseData<"memory:settings:get">;
export type MemoryInjectionPreview =
  IpcResponseData<"memory:injection:preview">;

export const WORKING_MEMORY_TOKEN_BUDGET = 8_000;

export type WorkingMemoryEntryKind =
  | "editor-focus"
  | "intent-stack"
  | "undo-redo-buffer"
  | "preference-signal"
  | "ai-context";

export type WorkingMemoryEntry = {
  id: string;
  projectId: string;
  sessionId: string;
  kind: WorkingMemoryEntryKind;
  tokenCount: number;
  importance: number;
  focusScore: number;
  createdAt: number;
  updatedAt: number;
  content: string;
};

export type WorkingMemoryBudgetState = {
  items: WorkingMemoryEntry[];
  tokenTotal: number;
  tokenBudget: number;
};

export type ArchivedPreferenceSignal = {
  projectId: string;
  chapterId: string;
  sessionId: string;
  sceneType: string;
  skillUsed: string;
  signalText: string;
  importance: number;
  implicitSignalHint: "REPEATED_SCENE_SKILL";
  scope: "project";
  version: 1;
};

/**
 * Create a deterministic working-memory budget state.
 *
 * Why: tests need a pure in-memory state model independent from React runtime.
 */
export function createWorkingMemoryBudgetState(
  tokenBudget = WORKING_MEMORY_TOKEN_BUDGET,
): WorkingMemoryBudgetState {
  return {
    items: [],
    tokenTotal: 0,
    tokenBudget,
  };
}

function clampImportance(importance: number): number {
  if (!Number.isFinite(importance)) {
    return 0;
  }
  return Math.max(0, Math.min(1, importance));
}

function clampFocusScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(1, score));
}

function compareEvictionPriority(
  a: WorkingMemoryEntry,
  b: WorkingMemoryEntry,
): number {
  if (a.importance !== b.importance) {
    return a.importance - b.importance;
  }
  if (a.focusScore !== b.focusScore) {
    return a.focusScore - b.focusScore;
  }
  if (a.updatedAt !== b.updatedAt) {
    return a.updatedAt - b.updatedAt;
  }
  return a.id.localeCompare(b.id);
}

function trimToBudget(
  state: WorkingMemoryBudgetState,
): WorkingMemoryBudgetState {
  if (state.tokenTotal <= state.tokenBudget) {
    return state;
  }

  const sorted = [...state.items].sort(compareEvictionPriority);
  let tokenTotal = state.tokenTotal;
  const removed = new Set<string>();
  for (const item of sorted) {
    if (tokenTotal <= state.tokenBudget) {
      break;
    }
    removed.add(item.id);
    tokenTotal -= item.tokenCount;
  }

  const kept = state.items.filter((item) => !removed.has(item.id));
  return {
    items: kept,
    tokenTotal,
    tokenBudget: state.tokenBudget,
  };
}

/**
 * Write one entry and enforce 8K token budget with deterministic eviction.
 *
 * Why: P0 requires importance-first trimming that never touches disk.
 */
export function writeWorkingMemoryEntry(
  state: WorkingMemoryBudgetState,
  entry: WorkingMemoryEntry,
): WorkingMemoryBudgetState {
  const normalized: WorkingMemoryEntry = {
    ...entry,
    tokenCount: Math.max(0, Math.trunc(entry.tokenCount)),
    importance: clampImportance(entry.importance),
    focusScore: clampFocusScore(entry.focusScore),
  };

  const existingIndex = state.items.findIndex(
    (item) => item.id === normalized.id,
  );
  const nextItems = [...state.items];
  let nextTotal = state.tokenTotal;

  if (existingIndex >= 0) {
    nextTotal -= nextItems[existingIndex]!.tokenCount;
    nextItems.splice(existingIndex, 1);
  }

  nextItems.push(normalized);
  nextTotal += normalized.tokenCount;

  return trimToBudget({
    items: nextItems,
    tokenTotal: nextTotal,
    tokenBudget: state.tokenBudget,
  });
}

/**
 * Archive threshold-qualified preference signals and clear working memory.
 *
 * Why: session-end must emit compact archival payloads before resetting state.
 */
export function archiveAndClearWorkingMemory(
  state: WorkingMemoryBudgetState,
  args: {
    projectId: string;
    chapterId: string;
    sessionId: string;
    sceneType: string;
    skillUsed: string;
    archiveThreshold: number;
  },
): {
  archivedSignals: ArchivedPreferenceSignal[];
  discardedSignals: number;
  nextState: WorkingMemoryBudgetState;
} {
  const threshold = clampImportance(args.archiveThreshold);
  const preferenceSignals = state.items.filter(
    (item) =>
      item.kind === "preference-signal" && item.sessionId === args.sessionId,
  );
  const archivedSignals = preferenceSignals
    .filter((item) => item.importance >= threshold)
    .map((item) => ({
      projectId: args.projectId,
      chapterId: args.chapterId,
      sessionId: args.sessionId,
      sceneType: args.sceneType,
      skillUsed: args.skillUsed,
      signalText: item.content,
      importance: item.importance,
      implicitSignalHint: "REPEATED_SCENE_SKILL" as const,
      scope: "project" as const,
      version: 1 as const,
    }));

  return {
    archivedSignals,
    discardedSignals: preferenceSignals.length - archivedSignals.length,
    nextState: createWorkingMemoryBudgetState(state.tokenBudget),
  };
}

export type MemoryState = {
  projectId: string | null;
  documentId: string | null;
  items: MemoryItem[];
  settings: MemorySettings | null;
  preview: MemoryInjectionPreview | null;
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  lastError: IpcError | null;
};

export type MemoryActions = {
  bootstrapForContext: (
    projectId: string | null,
    documentId: string | null,
  ) => Promise<void>;
  refresh: () => Promise<void>;
  create: (args: {
    type: MemoryItem["type"];
    scope: MemoryItem["scope"];
    content: string;
    documentId?: string;
  }) => Promise<IpcResponse<IpcResponseData<"memory:entry:create">>>;
  remove: (args: {
    memoryId: string;
  }) => Promise<IpcResponse<IpcResponseData<"memory:entry:delete">>>;
  updateSettings: (args: {
    patch: Partial<MemorySettings>;
  }) => Promise<IpcResponse<MemorySettings>>;
  previewInjection: (args: { queryText?: string }) => Promise<void>;
  clearPreview: () => void;
  clearError: () => void;
};

export type MemoryStore = MemoryState & MemoryActions;

export type UseMemoryStore = ReturnType<typeof createMemoryStore>;

const MemoryStoreContext = React.createContext<UseMemoryStore | null>(null);

/**
 * Create a zustand store for memory CRUD/settings/preview.
 *
 * Why: memory is user-controlled state that must be testable through typed IPC
 * and must support deterministic injection preview behavior.
 */
export function createMemoryStore(deps: { invoke: IpcInvoke }) {
  async function loadSettings(): Promise<
    IpcInvokeResult<"memory:settings:get">
  > {
    return await deps.invoke("memory:settings:get", {});
  }

  async function loadMemories(
    projectId: string | null,
    documentId: string | null,
  ): Promise<IpcInvokeResult<"memory:entry:list">> {
    const payload: IpcRequest<"memory:entry:list"> = {};
    if (projectId) {
      payload.projectId = projectId;
    }
    if (documentId) {
      payload.documentId = documentId;
    }
    return await deps.invoke("memory:entry:list", payload);
  }

  return create<MemoryStore>((set, get) => ({
    projectId: null,
    documentId: null,
    items: [],
    settings: null,
    preview: null,
    bootstrapStatus: "idle",
    lastError: null,

    clearError: () => set({ lastError: null }),
    clearPreview: () => set({ preview: null }),

    bootstrapForContext: async (projectId, documentId) => {
      const state = get();
      if (
        state.bootstrapStatus === "loading" &&
        state.projectId === projectId &&
        state.documentId === documentId
      ) {
        return;
      }

      set({
        bootstrapStatus: "loading",
        lastError: null,
        projectId,
        documentId,
        preview: null,
      });

      const settingsRes = await loadSettings();
      if (!settingsRes.ok) {
        set({ bootstrapStatus: "error", lastError: settingsRes.error });
        return;
      }

      const listRes = await loadMemories(projectId, documentId);
      if (!listRes.ok) {
        set({
          bootstrapStatus: "error",
          lastError: listRes.error,
          settings: settingsRes.data,
        });
        return;
      }

      set({
        bootstrapStatus: "ready",
        lastError: null,
        projectId,
        documentId,
        settings: settingsRes.data,
        items: listRes.data.items,
      });
    },

    refresh: async () => {
      const state = get();
      const listRes = await loadMemories(state.projectId, state.documentId);
      if (!listRes.ok) {
        set({ lastError: listRes.error });
        return;
      }

      set({ items: listRes.data.items, lastError: null });
    },

    create: async ({ type, scope, content, documentId }) => {
      const state = get();
      if (scope === "project" && !state.projectId) {
        const error = {
          code: "INVALID_ARGUMENT",
          message: "projectId is required for project scope",
        } as const;
        set({ lastError: error });
        return { ok: false, error };
      }
      if (scope === "document") {
        if (!state.projectId) {
          const error = {
            code: "INVALID_ARGUMENT",
            message: "projectId is required for document scope",
          } as const;
          set({ lastError: error });
          return { ok: false, error };
        }
        const effectiveDocumentId = documentId ?? state.documentId;
        if (!effectiveDocumentId) {
          const error = {
            code: "INVALID_ARGUMENT",
            message: "documentId is required for document scope",
          } as const;
          set({ lastError: error });
          return { ok: false, error };
        }
      }

      const base = { type, scope, content };
      let payload: IpcRequest<"memory:entry:create">;
      if (scope === "global") {
        payload = base;
      } else if (scope === "project") {
        payload = { ...base, projectId: state.projectId! };
      } else {
        // scope === "document"
        const effectiveDocumentId = documentId ?? state.documentId!;
        payload = {
          ...base,
          projectId: state.projectId!,
          documentId: effectiveDocumentId,
        };
      }

      const res = await deps.invoke("memory:entry:create", payload);
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return res;
    },

    remove: async ({ memoryId }) => {
      const res = await deps.invoke("memory:entry:delete", { memoryId });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return res;
    },

    updateSettings: async ({ patch }) => {
      const res = await deps.invoke("memory:settings:update", { patch });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      set({ settings: res.data, lastError: null });
      return res;
    },

    previewInjection: async ({ queryText }) => {
      const state = get();
      const payload: IpcRequest<"memory:injection:preview"> = {};
      if (state.projectId) {
        payload.projectId = state.projectId;
      }
      if (state.documentId) {
        payload.documentId = state.documentId;
      }
      if (queryText) {
        payload.queryText = queryText;
      }
      const res = await deps.invoke("memory:injection:preview", payload);
      if (!res.ok) {
        set({ lastError: res.error });
        return;
      }
      set({ preview: res.data, lastError: null });
    },
  }));
}

/**
 * Provide a memory store instance for the Workbench UI.
 */
export function MemoryStoreProvider(props: {
  store: UseMemoryStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <MemoryStoreContext.Provider value={props.store}>
      {props.children}
    </MemoryStoreContext.Provider>
  );
}

/**
 * Read values from the injected memory store.
 */
export function useMemoryStore<T>(selector: (state: MemoryStore) => T): T {
  const store = React.useContext(MemoryStoreContext);
  if (!store) {
    throw new Error("MemoryStoreProvider is missing");
  }
  return store(selector);
}
