import type { IpcError } from "@shared/types/ipc-generated";

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: IpcError };
export type ServiceResult<T> = Ok<T> | Err;

export const KNOWLEDGE_ENTITY_TYPES = [
  "character",
  "location",
  "event",
  "item",
  "faction",
] as const;

export type KnowledgeEntityType = (typeof KNOWLEDGE_ENTITY_TYPES)[number];

export const AI_CONTEXT_LEVELS = [
  "always",
  "when_detected",
  "manual_only",
  "never",
] as const;

export type AiContextLevel = (typeof AI_CONTEXT_LEVELS)[number];

export type KnowledgeEntity = {
  id: string;
  projectId: string;
  type: KnowledgeEntityType;
  name: string;
  description: string;
  attributes: Record<string, string>;
  lastSeenState?: string;
  aiContextLevel: AiContextLevel;
  aliases: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeRelation = {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description: string;
  createdAt: string;
};

export type KnowledgeSubgraphResult = {
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
  nodeCount: number;
  edgeCount: number;
  queryCostMs: number;
};

export type KnowledgePathResult = {
  pathEntityIds: string[];
  queryCostMs: number;
  expansions: number;
  degraded: boolean;
};

export type KnowledgeValidateResult = {
  cycles: string[][];
  queryCostMs: number;
};

export type KnowledgeRelevantQueryResult = {
  items: KnowledgeEntity[];
  queryCostMs: number;
};

export type KnowledgeQueryByIdsResult = {
  items: KnowledgeEntity[];
};

export type KgRulesInjectionEntity = {
  id: string;
  name: string;
  type: KnowledgeEntityType;
  attributes: Record<string, string>;
  relationsSummary: string[];
};

export type KgRulesInjectionRequest = {
  projectId: string;
  documentId: string;
  excerpt: string;
  traceId: string;
  maxEntities?: number;
  entityIds?: string[];
};

export type KgRulesInjectionData = {
  injectedEntities: KgRulesInjectionEntity[];
  source: "kg-rules-mock";
};

export type KnowledgeGraphService = {
  entityCreate: (args: {
    projectId: string;
    type: KnowledgeEntityType;
    name: string;
    description?: string;
    attributes?: Record<string, string>;
    lastSeenState?: string;
    aiContextLevel?: AiContextLevel;
    aliases?: string[];
  }) => ServiceResult<KnowledgeEntity>;
  entityRead: (args: {
    projectId: string;
    id: string;
  }) => ServiceResult<KnowledgeEntity>;
  entityList: (args: {
    projectId: string;
    filter?: {
      aiContextLevel?: AiContextLevel;
    };
    limit?: number;
    offset?: number;
  }) => ServiceResult<{ items: KnowledgeEntity[]; totalCount: number }>;
  entityUpdate: (args: {
    projectId: string;
    id: string;
    expectedVersion: number;
    patch: {
      type?: KnowledgeEntityType;
      name?: string;
      description?: string;
      attributes?: Record<string, string>;
      lastSeenState?: string;
      aiContextLevel?: AiContextLevel;
      aliases?: string[];
    };
  }) => ServiceResult<KnowledgeEntity>;
  entityDelete: (args: {
    projectId: string;
    id: string;
  }) => ServiceResult<{ deleted: true; deletedRelationCount: number }>;

  relationCreate: (args: {
    projectId: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationType: string;
    description?: string;
  }) => ServiceResult<KnowledgeRelation>;
  relationList: (args: {
    projectId: string;
    limit?: number;
    offset?: number;
  }) => ServiceResult<{ items: KnowledgeRelation[]; totalCount: number }>;
  relationUpdate: (args: {
    projectId: string;
    id: string;
    patch: {
      sourceEntityId?: string;
      targetEntityId?: string;
      relationType?: string;
      description?: string;
    };
  }) => ServiceResult<KnowledgeRelation>;
  relationDelete: (args: {
    projectId: string;
    id: string;
  }) => ServiceResult<{ deleted: true }>;

  querySubgraph: (args: {
    projectId: string;
    centerEntityId: string;
    k: number;
  }) => ServiceResult<KnowledgeSubgraphResult>;
  queryPath: (args: {
    projectId: string;
    sourceEntityId: string;
    targetEntityId: string;
    timeoutMs?: number;
    maxDepth?: number;
    maxExpansions?: number;
  }) => ServiceResult<KnowledgePathResult>;
  queryValidate: (args: {
    projectId: string;
    maxDepth?: number;
    maxVisited?: number;
  }) => ServiceResult<KnowledgeValidateResult>;
  queryRelevant: (args: {
    projectId: string;
    excerpt: string;
    maxEntities?: number;
    entityIds?: string[];
  }) => ServiceResult<KnowledgeRelevantQueryResult>;
  queryByIds: (args: {
    projectId: string;
    entityIds: string[];
  }) => ServiceResult<KnowledgeQueryByIdsResult>;
  buildRulesInjection: (
    args: KgRulesInjectionRequest,
  ) => ServiceResult<KgRulesInjectionData>;
};
