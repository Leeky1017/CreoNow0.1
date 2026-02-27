import React from "react";
import { create } from "zustand";

import type {
  IpcChannel,
  IpcError,
  IpcInvokeResult,
  IpcRequest,
  IpcResponse,
  IpcResponseData,
} from "@shared/types/ipc-generated";

const META_JSON_ATTRIBUTE_KEY = "__meta_json";

type EntityResponse = IpcResponseData<"knowledge:entity:list">["items"][number];
type RelationResponse =
  IpcResponseData<"knowledge:relation:list">["items"][number];
type AiContextLevel = EntityResponse["aiContextLevel"];

export type IpcInvoke = <C extends IpcChannel>(
  channel: C,
  payload: IpcRequest<C>,
) => Promise<IpcInvokeResult<C>>;

export type KgEntity = EntityResponse & {
  entityId: string;
  entityType: string;
  metadataJson: string;
};

export type KgRelation = RelationResponse & {
  relationId: string;
  fromEntityId: string;
  toEntityId: string;
};

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
    entityType?: string;
    description?: string;
    lastSeenState?: string;
    aiContextLevel?: AiContextLevel;
    aliases?: string[];
  }) => Promise<IpcResponse<KgEntity>>;
  entityUpdate: (args: {
    entityId: string;
    patch: Partial<
      Pick<
        KgEntity,
        | "name"
        | "entityType"
        | "description"
        | "metadataJson"
        | "lastSeenState"
        | "aiContextLevel"
        | "aliases"
      >
    >;
  }) => Promise<IpcResponse<KgEntity>>;
  entityDelete: (args: {
    entityId: string;
  }) => Promise<IpcResponse<{ deleted: true; deletedRelationCount: number }>>;
  relationCreate: (args: {
    fromEntityId: string;
    toEntityId: string;
    relationType: string;
  }) => Promise<IpcResponse<KgRelation>>;
  relationUpdate: (args: {
    relationId: string;
    patch: Partial<
      Pick<KgRelation, "fromEntityId" | "toEntityId" | "relationType">
    >;
  }) => Promise<IpcResponse<KgRelation>>;
  relationDelete: (args: {
    relationId: string;
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

  const normalized = value.trim();

  switch (normalized) {
    case "character":
    case "location":
    case "event":
    case "item":
    case "faction":
      return normalized;
    case "other":
      return "faction";
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

function toLegacyEntity(entity: EntityResponse): KgEntity {
  return {
    ...entity,
    entityId: entity.id,
    entityType: entity.type,
    metadataJson: toMetadataJson(entity.attributes),
  };
}

function toLegacyRelation(relation: RelationResponse): KgRelation {
  return {
    ...relation,
    relationId: relation.id,
    fromEntityId: relation.sourceEntityId,
    toEntityId: relation.targetEntityId,
  };
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
      entities: entitiesRes.data.items.map(toLegacyEntity),
      relations: relationsRes.data.items.map(toLegacyRelation),
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
      entityType,
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

      const normalizedType = normalizeEntityType(entityType) ?? "character";

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
      return { ok: true, data: toLegacyEntity(res.data) };
    },

    entityUpdate: async ({ entityId, patch }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const existing = state.entities.find(
        (entity) => entity.entityId === entityId,
      );
      if (!existing) {
        const error: IpcError = {
          code: "NOT_FOUND",
          message: "Entity not found",
        };
        set({ lastError: error });
        return { ok: false, error };
      }

      const nextType =
        typeof patch.entityType === "string"
          ? normalizeEntityType(patch.entityType)
          : undefined;

      const nextAttributes =
        typeof patch.metadataJson === "string"
          ? parseMetadataToAttributes(patch.metadataJson)
          : undefined;

      const res = await deps.invoke("knowledge:entity:update", {
        projectId: state.projectId,
        id: entityId,
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
      return { ok: true, data: toLegacyEntity(res.data) };
    },

    entityDelete: async ({ entityId }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:entity:delete", {
        projectId: state.projectId,
        id: entityId,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return res;
    },

    relationCreate: async ({ fromEntityId, toEntityId, relationType }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:create", {
        projectId: state.projectId,
        sourceEntityId: fromEntityId,
        targetEntityId: toEntityId,
        relationType,
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return { ok: true, data: toLegacyRelation(res.data) };
    },

    relationUpdate: async ({ relationId, patch }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:update", {
        projectId: state.projectId,
        id: relationId,
        patch: {
          sourceEntityId: patch.fromEntityId,
          targetEntityId: patch.toEntityId,
          relationType: patch.relationType,
        },
      });
      if (!res.ok) {
        set({ lastError: res.error });
        return res;
      }

      await get().refresh();
      return { ok: true, data: toLegacyRelation(res.data) };
    },

    relationDelete: async ({ relationId }) => {
      const state = get();
      if (!state.projectId) {
        const error = missingProjectError();
        set({ lastError: error });
        return { ok: false, error };
      }

      const res = await deps.invoke("knowledge:relation:delete", {
        projectId: state.projectId,
        id: relationId,
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
