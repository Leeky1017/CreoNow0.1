import React from "react";
import { create } from "zustand";

import { runFireAndForget } from "../lib/fireAndForget";
import type {
  IpcError,
  IpcResponse,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import type { IpcInvoke } from "../lib/ipcTypes";

export type { IpcInvoke };

export type ProjectInfo = IpcResponseData<"project:project:getcurrent">;
export type ProjectListItem =
  IpcResponseData<"project:project:list">["items"][number];
export type ProjectAiAssistDraft =
  IpcResponseData<"project:project:createaiassist">;

export type ProjectState = {
  current: ProjectInfo | null;
  items: ProjectListItem[];
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  lastError: IpcError | null;
};

export type ProjectActions = {
  bootstrap: () => Promise<void>;
  createAndSetCurrent: (args: {
    name?: string;
    type?: "novel" | "screenplay" | "media";
    description?: string;
    template?:
      | {
          kind: "builtin";
          id: string;
        }
      | {
          kind: "custom";
          structure: {
            folders: string[];
            files: Array<{ path: string; content?: string }>;
          };
        };
  }) => Promise<IpcResponse<ProjectInfo>>;
  createAiAssistDraft: (args: {
    prompt: string;
  }) => Promise<IpcResponse<ProjectAiAssistDraft>>;
  /**
   * Set an existing project as current.
   *
   * Why: Dashboard needs to open existing projects without creating new ones.
   */
  setCurrentProject: (projectId: string) => Promise<IpcResponse<ProjectInfo>>;
  /**
   * Delete a project permanently.
   *
   * Why: Dashboard must offer cleanup actions while remaining fully typed and observable.
   */
  deleteProject: (projectId: string) => Promise<IpcResponse<{ deleted: true }>>;
  /**
   * Rename an existing project.
   *
   * Why: dashboard project menu must provide a real rename flow.
   */
  renameProject: (args: {
    projectId: string;
    name: string;
  }) => Promise<
    IpcResponse<{ projectId: string; name: string; updatedAt: number }>
  >;
  /**
   * Duplicate a project into a new project.
   *
   * Why: creators need a branch-like workflow for trying alternatives.
   */
  duplicateProject: (args: {
    projectId: string;
  }) => Promise<
    IpcResponse<{ projectId: string; rootPath: string; name: string }>
  >;
  /**
   * Archive or unarchive a project.
   *
   * Why: archive should hide projects from active list without deleting them.
   */
  setProjectArchived: (args: {
    projectId: string;
    archived: boolean;
  }) => Promise<
    IpcResponse<{
      projectId: string;
      state: "active" | "archived" | "deleted";
      archivedAt?: number;
    }>
  >;
  clearError: () => void;
};

export type ProjectStore = ProjectState & ProjectActions;

export type UseProjectStore = ReturnType<typeof createProjectStore>;

const ProjectStoreContext = React.createContext<UseProjectStore | null>(null);

/**
 * Create a zustand store for project lifecycle state.
 *
 * Why: the renderer must be able to drive a minimal project entry flow and keep
 * current project state in sync with IPC (typed invoke) for stable E2E.
 */
export function createProjectStore(deps: {
  invoke: IpcInvoke;
  flushPendingAutosave?: () => Promise<void>;
  getOperatorId?: () => string;
  createTraceId?: () => string;
}) {
  const flushPendingAutosave =
    deps.flushPendingAutosave ??
    (async (): Promise<void> => {
      return;
    });
  const getOperatorId = deps.getOperatorId ?? (() => "renderer");
  const createTraceId =
    deps.createTraceId ??
    (() => {
      return `trace-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    });

  return create<ProjectStore>((set, get) => ({
    current: null,
    items: [],
    bootstrapStatus: "idle",
    lastError: null,

    clearError: () => set({ lastError: null }),

    bootstrap: async () => {
      const state = get();
      if (state.bootstrapStatus === "loading") {
        return;
      }

      set({ bootstrapStatus: "loading", lastError: null });

      try {
        const currentRes = await deps.invoke("project:project:getcurrent", {});
        const current = currentRes.ok
          ? currentRes.data
          : currentRes.error.code === "NOT_FOUND"
            ? null
            : null;
        if (!currentRes.ok && currentRes.error.code !== "NOT_FOUND") {
          set({ bootstrapStatus: "error", lastError: currentRes.error });
          return;
        }

        const listRes = await deps.invoke("project:project:list", {
          includeArchived: true,
        });
        if (!listRes.ok) {
          set({ bootstrapStatus: "error", lastError: listRes.error, current });
          return;
        }

        set({
          bootstrapStatus: "ready",
          current,
          items: listRes.data.items,
          lastError: null,
        });
      } catch (error: unknown) {
        set({
          bootstrapStatus: "error",
          lastError: {
            code: "INTERNAL",
            message:
              error instanceof Error
                ? error.message
                : "project bootstrap failed unexpectedly",
          },
        });
      }
    },

    createAndSetCurrent: async ({ name, type, description, template }) => {
      const created = await deps.invoke("project:project:create", {
        name,
        type,
        description,
        template,
      });
      if (!created.ok) {
        set({ lastError: created.error });
        return created;
      }

      const setRes = await deps.invoke("project:project:setcurrent", {
        projectId: created.data.projectId,
      });
      if (!setRes.ok) {
        set({ lastError: setRes.error });
        return setRes;
      }

      set({ current: setRes.data, lastError: null });
      runFireAndForget(() => get().bootstrap(), {
        label: "projectStore.bootstrap",
      });
      return setRes;
    },

    createAiAssistDraft: async ({ prompt }) => {
      const res = await deps.invoke("project:project:createaiassist", {
        prompt,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      set({ lastError: null });
      return res;
    },

    setCurrentProject: async (projectId) => {
      const previous = get().current;
      if (previous?.projectId === projectId) {
        return { ok: true, data: previous };
      }

      if (previous) {
        await flushPendingAutosave();

        const switched = await deps.invoke("project:project:switch", {
          projectId,
          fromProjectId: previous.projectId,
          operatorId: getOperatorId(),
          traceId: createTraceId(),
        });
        if (!switched.ok) {
          set({ lastError: switched.error });
          return switched;
        }

        const matched = get().items.find(
          (candidate) => candidate.projectId === switched.data.currentProjectId,
        );
        const current: ProjectInfo = {
          projectId: switched.data.currentProjectId,
          rootPath: matched?.rootPath ?? previous.rootPath,
        };
        set({ current, lastError: null });
        return { ok: true, data: current };
      }

      const setRes = await deps.invoke("project:project:setcurrent", {
        projectId,
      });
      if (!setRes.ok) {
        set({ lastError: setRes.error });
        return setRes;
      }

      set({ current: setRes.data, lastError: null });
      return setRes;
    },

    deleteProject: async (projectId) => {
      const res = await deps.invoke("project:lifecycle:purge", {
        projectId,
        traceId: createTraceId(),
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return { ok: false, error: res.error };
      }

      set((prev) => ({
        ...prev,
        current: prev.current?.projectId === projectId ? null : prev.current,
        lastError: null,
      }));
      runFireAndForget(() => get().bootstrap(), {
        label: "projectStore.bootstrap",
      });
      return { ok: true, data: { deleted: true } };
    },

    renameProject: async ({ projectId, name }) => {
      const res = await deps.invoke("project:project:rename", {
        projectId,
        name,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      set({ lastError: null });
      runFireAndForget(() => get().bootstrap(), {
        label: "projectStore.bootstrap",
      });
      return res;
    },

    duplicateProject: async ({ projectId }) => {
      const res = await deps.invoke("project:project:duplicate", { projectId });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      set({ lastError: null });
      runFireAndForget(() => get().bootstrap(), {
        label: "projectStore.bootstrap",
      });
      return res;
    },

    setProjectArchived: async ({ projectId, archived }) => {
      const res = archived
        ? await deps.invoke("project:lifecycle:archive", {
            projectId,
            traceId: createTraceId(),
          })
        : await deps.invoke("project:lifecycle:restore", {
            projectId,
            traceId: createTraceId(),
          });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      set((prev) => ({
        ...prev,
        current:
          archived && prev.current?.projectId === projectId
            ? null
            : prev.current,
        lastError: null,
      }));
      runFireAndForget(() => get().bootstrap(), {
        label: "projectStore.bootstrap",
      });
      return res;
    },
  }));
}

/**
 * Provide a project store instance for the Workbench UI.
 */
export function ProjectStoreProvider(props: {
  store: UseProjectStore;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ProjectStoreContext.Provider value={props.store}>
      {props.children}
    </ProjectStoreContext.Provider>
  );
}

/**
 * Read values from the injected project store.
 */
export function useProjectStore<T>(selector: (state: ProjectStore) => T): T {
  const store = React.useContext(ProjectStoreContext);
  if (!store) {
    throw new Error("ProjectStoreProvider is missing");
  }
  return store(selector);
}
