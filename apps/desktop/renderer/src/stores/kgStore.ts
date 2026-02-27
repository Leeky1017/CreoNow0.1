import React from "react";
import { create } from "zustand";

import type {
  IpcError,
  IpcInvokeResult,
  IpcResponse,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import type { IpcInvoke } from "../lib/ipcTypes";

const META_JSON_ATTRIBUTE_KEY = "__meta_json";

type EntityResponse = IpcResponseData<"knowledge:entity:list">["items"][number];
type RelationResponse =
  IpcResponseData<"knowledge:relation:list">["items"][number];
type AiContextLevel = EntityResponse["aiContextLevel"];

export type { IpcInvoke };

export type KgEntity = EntityResponse & {
  metadataJson: string;
};

export type KgRelation = RelationResponse;

export type KgState = {
  projectId: string | null;
  entities: KgEntity[];
  relations: KgRelation[];
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  lastError: IpcError | null;
};

export type KgActions = {
  bootstrapForProject: (projectId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  entityCreate: (args: {
    name: string;
    type?: string;
    description?: string;
    lastSeenState?: string;
    aiContextLevel?: AiContextLevel;
    aliases?: string[];
  }) => Promise<IpcResponse<KgEntity>>;
  entityUpdate: (args: {
    id: string;
    patch: Partial<
      Pick<
        KgEntity,
        | "name"
        | "description"
        | "metadataJson"
        | "lastSeenState"
        | "aiContextLevel"
        | "aliases"
      >
    > & { type?: string };
  }) => Promise<IpcResponse<KgEntity>>;
  entityDelete: (args: {
    id: string;
  }) => Promise<IpcResponse<{ deleted: true; deletedRelationCount: number }>>;
  relationCreate: (args: {
    sourceEntityId: string;
    targetEntityId: string;
    relationType: string;
  }) => Promise<IpcResponse<KgRelation>>;
  relationUpdate: (args: {
    id: string;
    patch: Partial<
      Pick<KgRelation, "sourceEntityId" | "targetEntityId" | "relationType">
    >;
  }) => Promise<IpcResponse<KgRelation>>;
  relationDelete: (args: {
    id: string;
  }) => Promise<IpcResponse<{ deleted: true }>>;
  clearError: () => void;
};

export type KgStore = KgState & KgActions;

export type UseKgStore = ReturnType<typeof createKgStore>;

const KgStoreContext = React.createContext<UseKgStore | null>(null);

function missingProjectError(): IpcError {
  return { code: "INVALID_ARGUMENT", message: "projectId is required" };
}

function normalizeEntityType(
  value: string | undefined,
): "character" | "location" | "event" | "item" | "faction" | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "character":
    case "location":
    case "event":
    case "item":
    case "faction":
      return normalized;
    default:
      return undefined;
  }
}

function parseMetadataToAttributes(
  metadataJson: string,
): Record<string, string> {
  return { [META_JSON_ATTRIBUTE_KEY]: metadataJson };
}

function toMetadataJson(attributes: Record<string, string>): string {
  const packed = attributes[META_JSON_ATTRIBUTE_KEY];
  if (typeof packed === "string") {
    return packed;
  }
  return JSON.stringify(attributes);
}

/**
 * Create a zustand store for Knowledge Graph CRUD (project-scoped).
 *
 * Why: KG must be driven through typed IPC while keeping the renderer state
 * machine deterministic for Windows E2E assertions.
 */
export function createKgStore(deps: { invoke: IpcInvoke }) {
  let latestBootstrapRequestId = 0;

  async function loadEntities(
    projectId: string,
  ): Promise<IpcInvokeResult<"knowledge:entity:list">> {
    return await deps.invoke("knowledge:entity:list", { projectId });
  }

  async function loadRelations(
    projectId: string,
  ): Promise<IpcInvokeResult<"knowledge:relation:list">> {
    return await deps.invoke("knowledge:relation:list", { projectId });
  }

  async function refreshProjectData(
    projectId: string,
  ): Promise<
    | { ok: true; entities: KgEntity[]; relations: KgRelation[] }
    | { ok: false; error: IpcError }
  > {
    const [entitiesRes, relationsRes] = await Promise.all([
      loadEntities(projectId),
      loadRelations(projectId),
    ]);

    if (!entitiesRes.ok) {
      return { ok: false, error: entitiesRes.error };
    }
    if (!relationsRes.ok) {
      return { ok: false, error: relationsRes.error };
    }

    return {
      ok: true,
      entities: entitiesRes.data.items.map((entity) => ({
        ...entity,
        metadataJson: toMetadataJson(entity.attributes),
      })),
      relations: relationsRes.data.items,
    };
  }

  return create<KgStore>((set, get) => ({
    projectId: null,
    entities: [],
    relations: [],
    bootstrapStatus: "idle",
    lastError: null,

    clearError: () => set({ lastError: null }),

    bootstrapForProject: async (projectId) => {
      const state = get();
      if (
        state.bootstrapStatus === "loading" &&
        state.projectId === projectId
      ) {
        return;
      }

      const requestId = ++latestBootstrapRequestId;

      if (!projectId) {
        set({
          projectId: null,
          entities: [],
          relations: [],
          bootstrapStatus: "idle",
          lastError: null,
        });
        return;
      }

      set({
        projectId,
        entities: [],
        relations: [],
        bootstrapStatus: "loading",
        lastError: null,
      });

      const res = await refreshProjectData(projectId);
      if (
        requestId !== latestBootstrapRequestId ||
        get().projectId !== projectId
      ) {
        return;
      }

      if (!res.ok) {
        set({ bootstrapStatus: "error", lastError: res.error });
        return;
      }

      set({
        bootstrapStatus: "ready",
        entities: res.entities,
        relations: res.relations,
        lastError: null,
      });
    },

    refresh: async () => {
      const state = get();
      const projectId = state.projectId;
      if (!projectId) {
        return;
      }

      const res = await refreshProjectData(projectId);
      if (get().projectId !== projectId) {
        return;
      }

      if (!res.ok) {
        set({ lastError: res.error });
        return;
      }

      set({
        entities: res.entities,
        relations: res.relations,
        lastError: null,
      });
    },

    entityCreate: async ({
      name,
      type,
      description,
      lastSeenState,
      aiContextLevel,
      aliases,
    }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const normalizedType = normalizeEntityType(type) ?? "character";

      const res = await deps.invoke("knowledge:entity:create", {
        projectId: state.projectId,
        type: normalizedType,
        name,
        description,
        lastSeenState,
        aiContextLevel,
        aliases,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return {
        ok: true,
        data: {
          ...res.data,
          metadataJson: toMetadataJson(res.data.attributes),
        },
      };
    },

    entityUpdate: async ({ id, patch }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const existing = state.entities.find((entity) => entity.id === id);
      if (!existing) {
        const error: IpcError = {
          code: "NOT_FOUND",
          message: "Entity not found",
        };
        set({ lastError: error });
        return { ok: false, error };
      }

      const nextType =
        typeof patch.type === "string"
          ? normalizeEntityType(patch.type)
          : undefined;

      const nextAttributes =
        typeof patch.metadataJson === "string"
          ? parseMetadataToAttributes(patch.metadataJson)
          : undefined;

      const res = await deps.invoke("knowledge:entity:update", {
        projectId: state.projectId,
        id,
        expectedVersion: existing.version,
        patch: {
          name: patch.name,
          type: nextType,
          description: patch.description,
          lastSeenState: patch.lastSeenState,
          aiContextLevel: patch.aiContextLevel,
          attributes: nextAttributes,
          aliases: patch.aliases,
        },
      });

      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return {
        ok: true,
        data: {
          ...res.data,
          metadataJson: toMetadataJson(res.data.attributes),
        },
      };
    },

    entityDelete: async ({ id }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:entity:delete", {
        projectId: state.projectId,
        id,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return res;
    },

    relationCreate: async ({
      sourceEntityId,
      targetEntityId,
      relationType,
    }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:create", {
        projectId: state.projectId,
        sourceEntityId,
        targetEntityId,
        relationType,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return { ok: true, data: res.data };
    },

    relationUpdate: async ({ id, patch }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:update", {
        projectId: state.projectId,
        id,
        patch: {
          sourceEntityId: patch.sourceEntityId,
          targetEntityId: patch.targetEntityId,
          relationType: patch.relationType,
        },
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return { ok: true, data: res.data };
    },

    relationDelete: async ({ id }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:delete", {
        projectId: state.projectId,
        id,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return res;
    },
  }));
}

/**
 * Provide a KG store instance for the Workbench UI.
 */
export function KgStoreProvider(props: {
  store: UseKgStore;
  children: React.ReactNode;
}): JSX.Element {
  return React.createElement(
    KgStoreContext.Provider,
    { value: props.store },
    props.children,
  );
}

/**
 * Read values from the injected KG store.
 */
export function useKgStore<T>(selector: (state: KgStore) => T): T {
  const store = React.useContext(KgStoreContext);
  if (!store) {
    throw new Error("KgStoreProvider is missing");
  }
  return store(selector);
}
