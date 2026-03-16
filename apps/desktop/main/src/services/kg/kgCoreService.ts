import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";
import { z } from "zod";

import type { Logger } from "../../logging/logger";
import { resolveRuntimeGovernanceFromEnv } from "../../config/runtimeGovernance";
import {
  AI_CONTEXT_LEVELS,
  type AiContextLevel,
  type Err,
  type KgRulesInjectionEntity,
  type KnowledgeEntity,
  type KnowledgeEntityType,
  type KnowledgeGraphService,
  type KnowledgeRelation,
  KNOWLEDGE_ENTITY_TYPES,
  type ServiceResult,
} from "./types";
import { ipcError } from "../shared/ipcResult";

const BUILTIN_RELATION_TYPES = [
  "ally",
  "enemy",
  "parent",
  "sibling",
  "belongs_to",
  "owns",
  "located_at",
  "participates_in",
] as const;

const DEFAULT_NODE_LIMIT = 50_000;
const DEFAULT_EDGE_LIMIT = 200_000;
const DEFAULT_ATTRIBUTE_KEYS_LIMIT = 200;
const DEFAULT_PATH_EXPANSION_LIMIT = 10_000;
const DEFAULT_SUBGRAPH_MAX_K = 3;
const DEFAULT_VALIDATE_MAX_DEPTH = 10_000;
const DEFAULT_VALIDATE_MAX_VISITED = DEFAULT_NODE_LIMIT;
const ENTITY_ID_QUERY_BATCH_SIZE = 256;

const MAX_ENTITY_NAME_CHARS = 256;
const MAX_ENTITY_ALIAS_CHARS = 256;
const MAX_RELATION_TYPE_CHARS = 64;
const MAX_DESCRIPTION_CHARS = 4_096;
const DEFAULT_AI_CONTEXT_LEVEL: AiContextLevel = "when_detected";
const AI_CONTEXT_LEVEL_SCHEMA = z.enum(AI_CONTEXT_LEVELS);

function normalizeAliases(rawAliases: string[]): string[] {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const rawAlias of rawAliases) {
    const alias = rawAlias.trim();
    if (alias.length === 0 || alias.length > MAX_ENTITY_ALIAS_CHARS) {
      continue;
    }
    if (seen.has(alias)) {
      continue;
    }
    seen.add(alias);
    deduped.push(alias);
  }

  return deduped;
}

const ALIASES_SCHEMA = z
  .array(z.string())
  .transform((aliases) => normalizeAliases(aliases));

type ServiceLimits = {
  nodeLimit: number;
  edgeLimit: number;
  attributeKeysLimit: number;
  queryTimeoutMs: number;
  pathExpansionLimit: number;
  subgraphMaxK: number;
  validateMaxDepth: number;
  validateMaxVisited: number;
};

type EntityRow = {
  id: string;
  projectId: string;
  type: KnowledgeEntityType;
  name: string;
  description: string;
  attributesJson: string;
  lastSeenState: string | null;
  aiContextLevel: string;
  aliasesJson: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type RelationRow = {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  description: string;
  createdAt: string;
};

/**
 * Parse a positive integer from env with fallback.
 */
function resolvePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

/**
 * Resolve runtime limits, with test-friendly env overrides.
 */
function resolveLimits(): ServiceLimits {
  const runtimeGovernance = resolveRuntimeGovernanceFromEnv(process.env);

  return {
    nodeLimit: resolvePositiveInt(
      process.env.CREONOW_KG_NODE_LIMIT,
      DEFAULT_NODE_LIMIT,
    ),
    edgeLimit: resolvePositiveInt(
      process.env.CREONOW_KG_EDGE_LIMIT,
      DEFAULT_EDGE_LIMIT,
    ),
    attributeKeysLimit: resolvePositiveInt(
      process.env.CREONOW_KG_ATTRIBUTE_KEYS_LIMIT,
      DEFAULT_ATTRIBUTE_KEYS_LIMIT,
    ),
    queryTimeoutMs: runtimeGovernance.kg.queryTimeoutMs,
    pathExpansionLimit: resolvePositiveInt(
      process.env.CREONOW_KG_PATH_EXPANSION_LIMIT,
      DEFAULT_PATH_EXPANSION_LIMIT,
    ),
    subgraphMaxK: resolvePositiveInt(
      process.env.CREONOW_KG_SUBGRAPH_MAX_K,
      DEFAULT_SUBGRAPH_MAX_K,
    ),
    validateMaxDepth: resolvePositiveInt(
      process.env.CREONOW_KG_VALIDATE_MAX_DEPTH,
      DEFAULT_VALIDATE_MAX_DEPTH,
    ),
    validateMaxVisited: resolvePositiveInt(
      process.env.CREONOW_KG_VALIDATE_MAX_VISITED,
      DEFAULT_VALIDATE_MAX_VISITED,
    ),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeEntityType(value: string): KnowledgeEntityType | undefined {
  const normalized = value.trim() as KnowledgeEntityType;
  if (KNOWLEDGE_ENTITY_TYPES.includes(normalized)) {
    return normalized;
  }
  return undefined;
}

function normalizeRelationTypeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAiContextLevel(
  value: string | undefined,
): AiContextLevel | null {
  if (!value) {
    return null;
  }
  const parsed = AI_CONTEXT_LEVEL_SCHEMA.safeParse(value.trim());
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

function validateProjectId(projectId: string): Err | null {
  if (projectId.trim().length === 0) {
    return ipcError("INVALID_ARGUMENT", "projectId is required");
  }
  return null;
}

function validatePaginationArgs(
  limit: number | undefined,
  offset: number | undefined,
): Err | null {
  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    return ipcError("INVALID_ARGUMENT", "limit must be a positive integer");
  }
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    return ipcError(
      "INVALID_ARGUMENT",
      "offset must be a non-negative integer",
    );
  }
  return null;
}

function validateEntityName(name: string): Err | null {
  const normalized = normalizeText(name);
  if (normalized.length === 0) {
    return ipcError("INVALID_ARGUMENT", "name is required");
  }
  if (normalized.length > MAX_ENTITY_NAME_CHARS) {
    return ipcError(
      "INVALID_ARGUMENT",
      `name exceeds ${MAX_ENTITY_NAME_CHARS} chars`,
    );
  }
  return null;
}

function validateDescription(description: string): Err | null {
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return ipcError(
      "INVALID_ARGUMENT",
      `description exceeds ${MAX_DESCRIPTION_CHARS} chars`,
    );
  }
  return null;
}

function validateLastSeenState(lastSeenState: string): Err | null {
  if (lastSeenState.length > MAX_DESCRIPTION_CHARS) {
    return ipcError(
      "INVALID_ARGUMENT",
      `lastSeenState exceeds ${MAX_DESCRIPTION_CHARS} chars`,
    );
  }
  return null;
}

function validateRelationType(relationType: string): Err | null {
  if (relationType.length === 0) {
    return ipcError("INVALID_ARGUMENT", "relationType is required");
  }
  if (relationType.length > MAX_RELATION_TYPE_CHARS) {
    return ipcError(
      "INVALID_ARGUMENT",
      `relationType exceeds ${MAX_RELATION_TYPE_CHARS} chars`,
    );
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateAndNormalizeAttributes(args: {
  attributes: Record<string, string> | undefined;
  limit: number;
}): ServiceResult<Record<string, string>> {
  if (!args.attributes) {
    return { ok: true, data: {} };
  }

  const entries = Object.entries(args.attributes);
  if (entries.length > args.limit) {
    return ipcError(
      "KG_ATTRIBUTE_KEYS_EXCEEDED",
      `attributes keys exceed ${args.limit}`,
      { limit: args.limit, actual: entries.length },
    );
  }

  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    if (key.length === 0) {
      return ipcError("INVALID_ARGUMENT", "attribute key must not be empty");
    }
    normalized[key] = String(rawValue);
  }

  return { ok: true, data: normalized };
}

function parseAttributes(attributesJson: string): Record<string, string> {
  try {
    const parsed = JSON.parse(attributesJson) as unknown;
    if (!isRecord(parsed)) {
      return {};
    }

    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        normalized[key] = value;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function parseAliases(aliasesJson: string): string[] {
  try {
    const parsed = JSON.parse(aliasesJson) as unknown;
    const normalized = ALIASES_SCHEMA.safeParse(parsed);
    if (!normalized.success) {
      return [];
    }
    return normalized.data;
  } catch {
    return [];
  }
}

function normalizeLastSeenState(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

function validateAndNormalizeAliases(args: {
  aliases: unknown;
  field: string;
}): ServiceResult<string[]> {
  const normalized = ALIASES_SCHEMA.safeParse(args.aliases);
  if (!normalized.success) {
    return ipcError(
      "VALIDATION_ERROR",
      `${args.field} must be an array of strings`,
      { field: args.field },
    );
  }

  return { ok: true, data: normalized.data };
}

function ensureProjectExists(
  db: Database.Database,
  projectId: string,
): Err | null {
  const row = db
    .prepare<
      [string],
      { projectId: string }
    >("SELECT project_id as projectId FROM projects WHERE project_id = ?")
    .get(projectId);

  if (!row) {
    return ipcError("NOT_FOUND", "Project not found");
  }
  return null;
}

function selectEntityById(
  db: Database.Database,
  id: string,
): EntityRow | undefined {
  return db
    .prepare<
      [string],
      EntityRow
    >("SELECT id, project_id as projectId, type, name, description, attributes_json as attributesJson, last_seen_state as lastSeenState, ai_context_level as aiContextLevel, aliases as aliasesJson, version, created_at as createdAt, updated_at as updatedAt FROM kg_entities WHERE id = ?")
    .get(id);
}

function selectRelationById(
  db: Database.Database,
  id: string,
): RelationRow | undefined {
  return db
    .prepare<
      [string],
      RelationRow
    >("SELECT id, project_id as projectId, source_entity_id as sourceEntityId, target_entity_id as targetEntityId, relation_type as relationType, description, created_at as createdAt FROM kg_relations WHERE id = ?")
    .get(id);
}

function rowToEntity(row: EntityRow): KnowledgeEntity {
  const normalizedAiContextLevel =
    normalizeAiContextLevel(row.aiContextLevel) ?? DEFAULT_AI_CONTEXT_LEVEL;
  return {
    id: row.id,
    projectId: row.projectId,
    type: row.type,
    name: row.name,
    description: row.description,
    attributes: parseAttributes(row.attributesJson),
    lastSeenState: row.lastSeenState ?? undefined,
    aiContextLevel: normalizedAiContextLevel,
    aliases: parseAliases(row.aliasesJson),
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToRelation(row: RelationRow): KnowledgeRelation {
  return {
    id: row.id,
    projectId: row.projectId,
    sourceEntityId: row.sourceEntityId,
    targetEntityId: row.targetEntityId,
    relationType: row.relationType,
    description: row.description,
    createdAt: row.createdAt,
  };
}

function countEntities(db: Database.Database, projectId: string): number {
  const row = db
    .prepare<
      [string],
      { count: number }
    >("SELECT COUNT(1) as count FROM kg_entities WHERE project_id = ?")
    .get(projectId);
  return row?.count ?? 0;
}

function countRelations(db: Database.Database, projectId: string): number {
  const row = db
    .prepare<
      [string],
      { count: number }
    >("SELECT COUNT(1) as count FROM kg_relations WHERE project_id = ?")
    .get(projectId);
  return row?.count ?? 0;
}

function ensureEntityInProject(
  db: Database.Database,
  args: { projectId: string; entityId: string; fieldName: string },
): EntityRow | Err {
  const row = db
    .prepare<
      [string, string],
      EntityRow
    >("SELECT id, project_id as projectId, type, name, description, attributes_json as attributesJson, last_seen_state as lastSeenState, ai_context_level as aiContextLevel, aliases as aliasesJson, version, created_at as createdAt, updated_at as updatedAt FROM kg_entities WHERE project_id = ? AND id = ?")
    .get(args.projectId, args.entityId);

  if (!row) {
    return ipcError(
      "KG_RELATION_INVALID",
      `${args.fieldName} not found in project`,
      { fieldName: args.fieldName, entityId: args.entityId },
    );
  }

  return row;
}

function entityDuplicateExists(
  db: Database.Database,
  args: {
    projectId: string;
    type: KnowledgeEntityType;
    name: string;
    excludeId?: string;
  },
): boolean {
  const normalizedName = normalizeText(args.name);
  const query = args.excludeId
    ? "SELECT id FROM kg_entities WHERE project_id = ? AND type = ? AND lower(trim(name)) = lower(trim(?)) AND id != ? LIMIT 1"
    : "SELECT id FROM kg_entities WHERE project_id = ? AND type = ? AND lower(trim(name)) = lower(trim(?)) LIMIT 1";

  const row = args.excludeId
    ? db
        .prepare<[string, string, string, string], { id: string }>(query)
        .get(args.projectId, args.type, normalizedName, args.excludeId)
    : db
        .prepare<[string, string, string], { id: string }>(query)
        .get(args.projectId, args.type, normalizedName);

  return Boolean(row);
}

function ensureRelationTypeRegistered(
  db: Database.Database,
  args: { projectId: string; relationType: string },
): void {
  const ts = nowIso();

  const insertBuiltin = db.prepare(
    "INSERT OR IGNORE INTO kg_relation_types (id, project_id, key, label, builtin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );

  for (const key of BUILTIN_RELATION_TYPES) {
    insertBuiltin.run(
      `builtin-${args.projectId}-${key}`,
      args.projectId,
      key,
      key,
      1,
      ts,
    );
  }

  const normalized = normalizeRelationTypeKey(args.relationType);
  if (
    BUILTIN_RELATION_TYPES.includes(
      normalized as (typeof BUILTIN_RELATION_TYPES)[number],
    )
  ) {
    return;
  }

  if (normalized.length === 0) {
    return;
  }

  db.prepare(
    "INSERT OR IGNORE INTO kg_relation_types (id, project_id, key, label, builtin, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    `custom-${args.projectId}-${normalized}`,
    args.projectId,
    normalized,
    args.relationType,
    0,
    ts,
  );
}

function listProjectEntities(
  db: Database.Database,
  projectId: string,
  filter?: {
    aiContextLevel?: AiContextLevel;
  },
  pagination?: {
    limit?: number;
    offset?: number;
  },
): KnowledgeEntity[] {
  const whereSql = filter?.aiContextLevel
    ? "WHERE project_id = ? AND ai_context_level = ?"
    : "WHERE project_id = ?";
  const params: Array<string | number> = filter?.aiContextLevel
    ? [projectId, filter.aiContextLevel]
    : [projectId];

  let paginationSql = "";
  if (typeof pagination?.limit === "number") {
    paginationSql = " LIMIT ? OFFSET ?";
    params.push(pagination.limit, pagination.offset ?? 0);
  }

  const rows = db
    .prepare(
      `SELECT id, project_id as projectId, type, name, description, attributes_json as attributesJson, last_seen_state as lastSeenState, ai_context_level as aiContextLevel, aliases as aliasesJson, version, created_at as createdAt, updated_at as updatedAt FROM kg_entities ${whereSql} ORDER BY updated_at DESC, id ASC${paginationSql}`,
    )
    .all(...params) as EntityRow[];
  return rows.map(rowToEntity);
}

function listProjectRelations(
  db: Database.Database,
  projectId: string,
  pagination?: {
    limit?: number;
    offset?: number;
  },
): KnowledgeRelation[] {
  const params: Array<string | number> = [projectId];
  let paginationSql = "";
  if (typeof pagination?.limit === "number") {
    paginationSql = " LIMIT ? OFFSET ?";
    params.push(pagination.limit, pagination.offset ?? 0);
  }

  const rows = db
    .prepare(
      `SELECT id, project_id as projectId, source_entity_id as sourceEntityId, target_entity_id as targetEntityId, relation_type as relationType, description, created_at as createdAt FROM kg_relations WHERE project_id = ? ORDER BY created_at DESC, id ASC${paginationSql}`,
    )
    .all(...params) as RelationRow[];
  return rows.map(rowToRelation);
}

function countProjectEntities(
  db: Database.Database,
  projectId: string,
  filter?: {
    aiContextLevel?: AiContextLevel;
  },
): number {
  if (filter?.aiContextLevel) {
    const row = db
      .prepare<
        [string, AiContextLevel],
        { count: number }
      >("SELECT COUNT(1) as count FROM kg_entities WHERE project_id = ? AND ai_context_level = ?")
      .get(projectId, filter.aiContextLevel);
    return row?.count ?? 0;
  }
  return countEntities(db, projectId);
}

function listEntitiesByIds(
  db: Database.Database,
  entityIds: string[],
): Array<{ id: string; projectId: string; row: EntityRow }> {
  if (entityIds.length === 0) {
    return [];
  }

  const records: Array<{ id: string; projectId: string; row: EntityRow }> = [];
  for (
    let start = 0;
    start < entityIds.length;
    start += ENTITY_ID_QUERY_BATCH_SIZE
  ) {
    const batchIds = entityIds.slice(start, start + ENTITY_ID_QUERY_BATCH_SIZE);
    const placeholders = batchIds.map(() => "?").join(",");
    const sql = `SELECT id, project_id as projectId, type, name, description, attributes_json as attributesJson, last_seen_state as lastSeenState, ai_context_level as aiContextLevel, aliases as aliasesJson, version, created_at as createdAt, updated_at as updatedAt FROM kg_entities WHERE id IN (${placeholders})`;
    const rows = db.prepare(sql).all(...batchIds) as EntityRow[];
    records.push(
      ...rows.map((row) => ({
        id: row.id,
        projectId: row.projectId,
        row,
      })),
    );
  }
  return records;
}

function buildDirectedAdjacency(
  relations: KnowledgeRelation[],
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const relation of relations) {
    const current = adjacency.get(relation.sourceEntityId) ?? [];
    current.push(relation.targetEntityId);
    adjacency.set(relation.sourceEntityId, current);
  }
  return adjacency;
}

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const rawId of ids) {
    const id = rawId.trim();
    if (id.length === 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ordered.push(id);
  }
  return ordered;
}

function normalizeKeywordTokens(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  return [...new Set(tokens)];
}

function resolveMaxEntities(maxEntities: number | undefined): number {
  if (!maxEntities || !Number.isFinite(maxEntities)) {
    return 5;
  }
  const normalized = Math.floor(maxEntities);
  if (normalized <= 0) {
    return 1;
  }
  return Math.min(50, normalized);
}

type QueryPathValidationResult = {
  normalizedProjectId: string;
  normalizedSource: string;
  normalizedTarget: string;
  effectiveTimeoutMs: number;
  effectiveMaxDepth: number | undefined;
  effectiveMaxExpansions: number;
};

type QueryPathSearchResult = {
  pathEntityIds: string[];
  expansions: number;
  degraded: boolean;
};

function validateAndNormalizeQueryPathArgs(args: {
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  timeoutMs: number | undefined;
  maxDepth: number | undefined;
  maxExpansions: number | undefined;
  limits: ServiceLimits;
}): ServiceResult<QueryPathValidationResult> {
  const invalidProjectId = validateProjectId(args.projectId);
  if (invalidProjectId) {
    return invalidProjectId;
  }

  const normalizedSource = args.sourceEntityId.trim();
  const normalizedTarget = args.targetEntityId.trim();
  if (normalizedSource.length === 0 || normalizedTarget.length === 0) {
    return ipcError(
      "INVALID_ARGUMENT",
      "sourceEntityId and targetEntityId are required",
    );
  }

  const effectiveTimeoutMs = args.timeoutMs ?? args.limits.queryTimeoutMs;
  if (effectiveTimeoutMs <= 0) {
    return ipcError("KG_QUERY_TIMEOUT", "query timeout", {
      timeoutMs: effectiveTimeoutMs,
      suggestion: "reduce graph scope or use keyword filtering",
    });
  }

  if (
    args.maxDepth !== undefined &&
    (!Number.isInteger(args.maxDepth) || args.maxDepth <= 0)
  ) {
    return ipcError("INVALID_ARGUMENT", "maxDepth must be a positive integer");
  }

  const effectiveMaxExpansions =
    args.maxExpansions ?? args.limits.pathExpansionLimit;
  if (
    !Number.isInteger(effectiveMaxExpansions) ||
    effectiveMaxExpansions <= 0
  ) {
    return ipcError(
      "INVALID_ARGUMENT",
      "maxExpansions must be a positive integer",
    );
  }

  return {
    ok: true,
    data: {
      normalizedProjectId: args.projectId.trim(),
      normalizedSource,
      normalizedTarget,
      effectiveTimeoutMs,
      effectiveMaxDepth: args.maxDepth,
      effectiveMaxExpansions,
    },
  };
}

function queryPathWithinAdjacency(args: {
  adjacency: Map<string, string[]>;
  sourceEntityId: string;
  targetEntityId: string;
  timeoutMs: number;
  maxDepth: number | undefined;
  maxExpansions: number;
  startedAt: number;
}): ServiceResult<QueryPathSearchResult> {
  const queue: string[] = [args.sourceEntityId];
  let queueIndex = 0;
  const visited = new Set<string>([args.sourceEntityId]);
  const previous = new Map<string, string>();
  const depthByNode = new Map<string, number>([[args.sourceEntityId, 0]]);
  let expansions = 0;
  let found = false;

  while (queueIndex < queue.length) {
    if (Date.now() - args.startedAt > args.timeoutMs) {
      return ipcError("KG_QUERY_TIMEOUT", "query timeout", {
        timeoutMs: args.timeoutMs,
        expansions,
        suggestion: "reduce graph scope or use keyword filtering",
      });
    }

    const nodeId = queue[queueIndex];
    queueIndex += 1;

    expansions += 1;
    if (expansions > args.maxExpansions) {
      return {
        ok: true,
        data: {
          pathEntityIds: [],
          expansions,
          degraded: true,
        },
      };
    }

    if (nodeId === args.targetEntityId) {
      found = true;
      break;
    }

    const nodeDepth = depthByNode.get(nodeId) ?? 0;
    const neighbors = args.adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      const nextDepth = nodeDepth + 1;
      if (args.maxDepth !== undefined && nextDepth > args.maxDepth) {
        return ipcError("KG_QUERY_TIMEOUT", "query timeout", {
          reason: "MAX_DEPTH_EXCEEDED",
          maxDepth: args.maxDepth,
          depth: nextDepth,
          nodeId: neighbor,
          suggestion: "reduce graph scope or increase maxDepth",
        });
      }

      visited.add(neighbor);
      previous.set(neighbor, nodeId);
      depthByNode.set(neighbor, nextDepth);
      if (neighbor === args.targetEntityId) {
        found = true;
        break;
      }
      queue.push(neighbor);
    }

    if (found) {
      break;
    }
  }

  if (!found) {
    return {
      ok: true,
      data: {
        pathEntityIds: [],
        expansions,
        degraded: false,
      },
    };
  }

  const path: string[] = [];
  let cursor: string | undefined = args.targetEntityId;
  while (cursor) {
    path.push(cursor);
    cursor = previous.get(cursor);
  }
  path.reverse();

  return {
    ok: true,
    data: {
      pathEntityIds: path,
      expansions,
      degraded: false,
    },
  };
}

/**
 * Create a KnowledgeGraphService backed by SQLite (SSOT).
 */
type KgCoreCtx = {
  db: Database.Database;
  logger: Logger;
  limits: ServiceLimits;
};

type ValidatedEntityPatchFields = {
  normalizedPatchLastSeenState: string | null | undefined;
  normalizedPatchAiContextLevel: AiContextLevel | undefined;
  normalizedAttributes: Record<string, string> | null;
  normalizedAliases: string[] | null;
};

function validateEntityPatchFields(
  patch: {
    name?: string;
    description?: string;
    lastSeenState?: string;
    type?: string;
    aiContextLevel?: string;
    attributes?: Record<string, string>;
    aliases?: string[];
  },
  limits: ServiceLimits,
): ServiceResult<ValidatedEntityPatchFields> {
  if (typeof patch.name === "string") {
    const invalidName = validateEntityName(patch.name);
    if (invalidName) {
      return invalidName;
    }
  }

  if (typeof patch.description === "string") {
    const invalidDescription = validateDescription(patch.description.trim());
    if (invalidDescription) {
      return invalidDescription;
    }
  }

  let normalizedPatchLastSeenState: string | null | undefined;
  if (typeof patch.lastSeenState === "string") {
    const invalidLastSeenState = validateLastSeenState(patch.lastSeenState);
    if (invalidLastSeenState) {
      return invalidLastSeenState;
    }
    normalizedPatchLastSeenState = normalizeLastSeenState(patch.lastSeenState);
  }

  if (typeof patch.type === "string") {
    const normalizedType = normalizeEntityType(patch.type);
    if (!normalizedType) {
      return ipcError("INVALID_ARGUMENT", "patch.type is invalid");
    }
  }

  let normalizedPatchAiContextLevel: AiContextLevel | undefined;
  if (patch.aiContextLevel !== undefined) {
    const parsedAiContextLevel = normalizeAiContextLevel(patch.aiContextLevel);
    if (!parsedAiContextLevel) {
      return ipcError(
        "VALIDATION_ERROR",
        "patch.aiContextLevel must be one of always|when_detected|manual_only|never",
        {
          field: "patch.aiContextLevel",
          allowedValues: AI_CONTEXT_LEVELS,
        },
      );
    }
    normalizedPatchAiContextLevel = parsedAiContextLevel;
  }

  let normalizedAttributes: ServiceResult<Record<string, string>> | null = null;
  if (patch.attributes) {
    normalizedAttributes = validateAndNormalizeAttributes({
      attributes: patch.attributes,
      limit: limits.attributeKeysLimit,
    });
    if (!normalizedAttributes.ok) {
      return normalizedAttributes;
    }
  }

  let normalizedAliases: ServiceResult<string[]> | null = null;
  if (patch.aliases !== undefined) {
    normalizedAliases = validateAndNormalizeAliases({
      aliases: patch.aliases,
      field: "patch.aliases",
    });
    if (!normalizedAliases.ok) {
      return normalizedAliases;
    }
  }

  return {
    ok: true,
    data: {
      normalizedPatchLastSeenState,
      normalizedPatchAiContextLevel,
      normalizedAttributes: normalizedAttributes?.ok
        ? normalizedAttributes.data
        : null,
      normalizedAliases: normalizedAliases?.ok ? normalizedAliases.data : null,
    },
  };
}

function createEntityOps(
  ctx: KgCoreCtx,
): Pick<
  KnowledgeGraphService,
  "entityCreate" | "entityRead" | "entityList" | "entityDelete"
> {
  const args = ctx;
  const limits = ctx.limits;

  return {
    entityCreate: ({
      projectId,
      type,
      name,
      description,
      attributes,
      lastSeenState,
      aiContextLevel,
      aliases,
    }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      const normalizedType = normalizeEntityType(type);
      if (!normalizedType) {
        return ipcError("INVALID_ARGUMENT", "type is invalid");
      }

      const invalidName = validateEntityName(name);
      if (invalidName) {
        return invalidName;
      }

      const normalizedDescription = normalizeText(description ?? "");
      const invalidDescription = validateDescription(normalizedDescription);
      if (invalidDescription) {
        return invalidDescription;
      }

      let normalizedLastSeenState: string | null = null;
      if (lastSeenState !== undefined) {
        const invalidLastSeenState = validateLastSeenState(lastSeenState);
        if (invalidLastSeenState) {
          return invalidLastSeenState;
        }
        normalizedLastSeenState = normalizeLastSeenState(lastSeenState);
      }

      const normalizedAttributes = validateAndNormalizeAttributes({
        attributes,
        limit: limits.attributeKeysLimit,
      });
      if (!normalizedAttributes.ok) {
        return normalizedAttributes;
      }

      const normalizedAiContextLevel =
        aiContextLevel === undefined
          ? DEFAULT_AI_CONTEXT_LEVEL
          : normalizeAiContextLevel(aiContextLevel);
      if (!normalizedAiContextLevel) {
        return ipcError(
          "VALIDATION_ERROR",
          "aiContextLevel must be one of always|when_detected|manual_only|never",
          {
            field: "aiContextLevel",
            allowedValues: AI_CONTEXT_LEVELS,
          },
        );
      }

      const normalizedAliases: ServiceResult<string[]> =
        aliases === undefined
          ? { ok: true, data: [] }
          : validateAndNormalizeAliases({ aliases, field: "aliases" });
      if (!normalizedAliases.ok) {
        return normalizedAliases;
      }

      const normalizedProjectId = projectId.trim();
      const normalizedName = normalizeText(name);

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        if (countEntities(args.db, normalizedProjectId) >= limits.nodeLimit) {
          return ipcError("KG_CAPACITY_EXCEEDED", "node capacity exceeded", {
            kind: "node",
            limit: limits.nodeLimit,
          });
        }

        if (
          entityDuplicateExists(args.db, {
            projectId: normalizedProjectId,
            type: normalizedType,
            name: normalizedName,
          })
        ) {
          return ipcError(
            "KG_ENTITY_DUPLICATE",
            "entity with same type and normalized name already exists",
            {
              type: normalizedType,
              name: normalizedName,
            },
          );
        }

        const id = randomUUID();
        const ts = nowIso();
        args.db
          .prepare(
            "INSERT INTO kg_entities (id, project_id, type, name, description, attributes_json, last_seen_state, ai_context_level, aliases, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            id,
            normalizedProjectId,
            normalizedType,
            normalizedName,
            normalizedDescription,
            JSON.stringify(normalizedAttributes.data),
            normalizedLastSeenState,
            normalizedAiContextLevel,
            JSON.stringify(normalizedAliases.data),
            1,
            ts,
            ts,
          );

        const row = selectEntityById(args.db, id);
        if (!row) {
          return ipcError("DB_ERROR", "Failed to load created entity");
        }

        return { ok: true, data: rowToEntity(row) };
      } catch (error) {
        args.logger.error("kg_entity_create_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to create entity");
      }
    },

    entityRead: ({ projectId, id }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required");
      }

      const normalizedProjectId = projectId.trim();
      const normalizedId = id.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const row = selectEntityById(args.db, normalizedId);
        if (!row || row.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "Entity not found");
        }

        return { ok: true, data: rowToEntity(row) };
      } catch (error) {
        args.logger.error("kg_entity_read_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to read entity");
      }
    },

    entityList: ({ projectId, filter, limit, offset }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
        return ipcError("INVALID_ARGUMENT", "limit must be a positive integer");
      }
      if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
        return ipcError(
          "INVALID_ARGUMENT",
          "offset must be a non-negative integer",
        );
      }

      const normalizedProjectId = projectId.trim();
      let normalizedFilterAiContextLevel: AiContextLevel | undefined;
      if (filter?.aiContextLevel !== undefined) {
        const parsedAiContextLevel = normalizeAiContextLevel(
          filter.aiContextLevel,
        );
        if (!parsedAiContextLevel) {
          return ipcError(
            "VALIDATION_ERROR",
            "filter.aiContextLevel must be one of always|when_detected|manual_only|never",
            {
              field: "filter.aiContextLevel",
              allowedValues: AI_CONTEXT_LEVELS,
            },
          );
        }
        normalizedFilterAiContextLevel = parsedAiContextLevel;
      }

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        return {
          ok: true,
          data: {
            items: listProjectEntities(
              args.db,
              normalizedProjectId,
              {
                aiContextLevel: normalizedFilterAiContextLevel,
              },
              {
                limit,
                offset,
              },
            ),
            totalCount: countProjectEntities(args.db, normalizedProjectId, {
              aiContextLevel: normalizedFilterAiContextLevel,
            }),
          },
        };
      } catch (error) {
        args.logger.error("kg_entity_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to list entities");
      }
    },

    entityDelete: ({ projectId, id }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required");
      }

      const normalizedProjectId = projectId.trim();
      const normalizedId = id.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const existing = selectEntityById(args.db, normalizedId);
        if (!existing || existing.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "Entity not found");
        }

        let deletedRelationCount = 0;
        args.db.transaction(() => {
          const deletedRelations = args.db
            .prepare(
              "DELETE FROM kg_relations WHERE project_id = ? AND (source_entity_id = ? OR target_entity_id = ?)",
            )
            .run(normalizedProjectId, normalizedId, normalizedId);
          deletedRelationCount = deletedRelations.changes;

          args.db
            .prepare("DELETE FROM kg_entities WHERE project_id = ? AND id = ?")
            .run(normalizedProjectId, normalizedId);
        })();

        return { ok: true, data: { deleted: true, deletedRelationCount } };
      } catch (error) {
        args.logger.error("kg_entity_delete_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to delete entity");
      }
    },
  };
}

function createEntityUpdateOps(
  ctx: KgCoreCtx,
): Pick<KnowledgeGraphService, "entityUpdate"> {
  const args = ctx;
  const limits = ctx.limits;

  return {
    entityUpdate: ({ projectId, id, expectedVersion, patch }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required");
      }
      if (!Number.isInteger(expectedVersion) || expectedVersion <= 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "expectedVersion must be a positive integer",
        );
      }

      const patchKeys = Object.keys(patch) as Array<keyof typeof patch>;
      if (patchKeys.length === 0) {
        return ipcError("INVALID_ARGUMENT", "patch is required");
      }

      const validatedPatch = validateEntityPatchFields(patch, limits);
      if (!validatedPatch.ok) {
        return validatedPatch;
      }
      const {
        normalizedPatchLastSeenState,
        normalizedPatchAiContextLevel,
        normalizedAttributes,
        normalizedAliases,
      } = validatedPatch.data;

      const normalizedProjectId = projectId.trim();
      const normalizedId = id.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const existing = selectEntityById(args.db, normalizedId);
        if (!existing || existing.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "Entity not found");
        }

        if (existing.version !== expectedVersion) {
          return ipcError("KG_ENTITY_CONFLICT", "entity version conflict", {
            expectedVersion,
            latestVersion: existing.version,
            latestSnapshot: rowToEntity(existing),
          });
        }

        const nextType =
          typeof patch.type === "string"
            ? (normalizeEntityType(patch.type) ?? existing.type)
            : existing.type;
        const nextName =
          typeof patch.name === "string"
            ? normalizeText(patch.name)
            : existing.name;
        const nextDescription =
          typeof patch.description === "string"
            ? normalizeText(patch.description)
            : existing.description;
        const nextAttributesJson = normalizedAttributes
          ? JSON.stringify(normalizedAttributes)
          : existing.attributesJson;
        const nextAliasesJson = normalizedAliases
          ? JSON.stringify(normalizedAliases)
          : existing.aliasesJson;
        const nextLastSeenState =
          normalizedPatchLastSeenState === undefined
            ? existing.lastSeenState
            : normalizedPatchLastSeenState;
        const nextAiContextLevel =
          normalizedPatchAiContextLevel ??
          normalizeAiContextLevel(existing.aiContextLevel) ??
          DEFAULT_AI_CONTEXT_LEVEL;

        if (
          entityDuplicateExists(args.db, {
            projectId: normalizedProjectId,
            type: nextType,
            name: nextName,
            excludeId: normalizedId,
          })
        ) {
          return ipcError(
            "KG_ENTITY_DUPLICATE",
            "entity with same type and normalized name already exists",
            { type: nextType, name: nextName },
          );
        }

        args.db
          .prepare(
            "UPDATE kg_entities SET type = ?, name = ?, description = ?, attributes_json = ?, last_seen_state = ?, ai_context_level = ?, aliases = ?, version = ?, updated_at = ? WHERE id = ?",
          )
          .run(
            nextType,
            nextName,
            nextDescription,
            nextAttributesJson,
            nextLastSeenState,
            nextAiContextLevel,
            nextAliasesJson,
            existing.version + 1,
            nowIso(),
            normalizedId,
          );

        const row = selectEntityById(args.db, normalizedId);
        if (!row) {
          return ipcError("DB_ERROR", "Failed to load updated entity");
        }

        return { ok: true, data: rowToEntity(row) };
      } catch (error) {
        args.logger.error("kg_entity_update_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to update entity");
      }
    },
  };
}

function createRelationOps(
  ctx: KgCoreCtx,
): Pick<
  KnowledgeGraphService,
  "relationCreate" | "relationList" | "relationUpdate" | "relationDelete"
> {
  const args = ctx;
  const limits = ctx.limits;

  return {
    relationCreate: ({
      projectId,
      sourceEntityId,
      targetEntityId,
      relationType,
      description,
    }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      const normalizedSource = sourceEntityId.trim();
      const normalizedTarget = targetEntityId.trim();
      const normalizedType = relationType.trim();
      const normalizedDescription = normalizeText(description ?? "");
      if (normalizedSource.length === 0) {
        return ipcError("INVALID_ARGUMENT", "sourceEntityId is required");
      }
      if (normalizedTarget.length === 0) {
        return ipcError("INVALID_ARGUMENT", "targetEntityId is required");
      }
      if (normalizedSource === normalizedTarget) {
        return ipcError(
          "KG_RELATION_INVALID",
          "sourceEntityId and targetEntityId must be different",
        );
      }

      const invalidRelationType = validateRelationType(normalizedType);
      if (invalidRelationType) {
        return invalidRelationType;
      }

      const invalidDescription = validateDescription(normalizedDescription);
      if (invalidDescription) {
        return invalidDescription;
      }
      const normalizedProjectId = projectId.trim();
      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }
        if (countRelations(args.db, normalizedProjectId) >= limits.edgeLimit) {
          return ipcError("KG_CAPACITY_EXCEEDED", "edge capacity exceeded", {
            kind: "edge",
            limit: limits.edgeLimit,
          });
        }
        const sourceEntity = ensureEntityInProject(args.db, {
          projectId: normalizedProjectId,
          entityId: normalizedSource,
          fieldName: "sourceEntityId",
        });
        if (!sourceEntity || "ok" in sourceEntity) {
          args.logger.error("kg_relation_invalid", {
            reason: "source_missing_or_cross_project",
            project_id: normalizedProjectId,
            source_entity_id: normalizedSource,
          });
          return sourceEntity;
        }

        const targetEntity = ensureEntityInProject(args.db, {
          projectId: normalizedProjectId,
          entityId: normalizedTarget,
          fieldName: "targetEntityId",
        });
        if (!targetEntity || "ok" in targetEntity) {
          args.logger.error("kg_relation_invalid", {
            reason: "target_missing_or_cross_project",
            project_id: normalizedProjectId,
            target_entity_id: normalizedTarget,
          });
          return targetEntity;
        }

        ensureRelationTypeRegistered(args.db, {
          projectId: normalizedProjectId,
          relationType: normalizedType,
        });

        const id = randomUUID();
        const ts = nowIso();
        args.db
          .prepare(
            "INSERT INTO kg_relations (id, project_id, source_entity_id, target_entity_id, relation_type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            id,
            normalizedProjectId,
            sourceEntity.id,
            targetEntity.id,
            normalizedType,
            normalizedDescription,
            ts,
          );

        const row = selectRelationById(args.db, id);
        if (!row) {
          return ipcError("DB_ERROR", "Failed to load created relation");
        }

        return { ok: true, data: rowToRelation(row) };
      } catch (error) {
        args.logger.error("kg_relation_create_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to create relation");
      }
    },

    relationList: ({ projectId, limit, offset }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      const invalidPagination = validatePaginationArgs(limit, offset);
      if (invalidPagination) {
        return invalidPagination;
      }

      const normalizedProjectId = projectId.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        return {
          ok: true,
          data: {
            items: listProjectRelations(args.db, normalizedProjectId, {
              limit,
              offset,
            }),
            totalCount: countRelations(args.db, normalizedProjectId),
          },
        };
      } catch (error) {
        args.logger.error("kg_relation_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to list relations");
      }
    },

    relationUpdate: ({ projectId, id, patch }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required");
      }

      const patchKeys = Object.keys(patch) as Array<keyof typeof patch>;
      if (patchKeys.length === 0) {
        return ipcError("INVALID_ARGUMENT", "patch is required");
      }

      if (typeof patch.relationType === "string") {
        const invalidRelationType = validateRelationType(
          patch.relationType.trim(),
        );
        if (invalidRelationType) {
          return invalidRelationType;
        }
      }

      if (typeof patch.description === "string") {
        const invalidDescription = validateDescription(
          patch.description.trim(),
        );
        if (invalidDescription) {
          return invalidDescription;
        }
      }

      const normalizedProjectId = projectId.trim();
      const normalizedId = id.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const existing = selectRelationById(args.db, normalizedId);
        if (!existing || existing.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "Relation not found");
        }

        const nextSource =
          typeof patch.sourceEntityId === "string"
            ? patch.sourceEntityId.trim()
            : existing.sourceEntityId;
        const nextTarget =
          typeof patch.targetEntityId === "string"
            ? patch.targetEntityId.trim()
            : existing.targetEntityId;

        if (nextSource.length === 0 || nextTarget.length === 0) {
          return ipcError(
            "INVALID_ARGUMENT",
            "relation endpoints are required",
          );
        }
        if (nextSource === nextTarget) {
          return ipcError(
            "KG_RELATION_INVALID",
            "sourceEntityId and targetEntityId must be different",
          );
        }

        const sourceEntity = ensureEntityInProject(args.db, {
          projectId: normalizedProjectId,
          entityId: nextSource,
          fieldName: "sourceEntityId",
        });
        if ("ok" in sourceEntity) {
          return sourceEntity;
        }

        const targetEntity = ensureEntityInProject(args.db, {
          projectId: normalizedProjectId,
          entityId: nextTarget,
          fieldName: "targetEntityId",
        });
        if ("ok" in targetEntity) {
          return targetEntity;
        }

        const nextType =
          typeof patch.relationType === "string"
            ? patch.relationType.trim()
            : existing.relationType;
        const nextDescription =
          typeof patch.description === "string"
            ? patch.description.trim()
            : existing.description;

        ensureRelationTypeRegistered(args.db, {
          projectId: normalizedProjectId,
          relationType: nextType,
        });

        args.db
          .prepare(
            "UPDATE kg_relations SET source_entity_id = ?, target_entity_id = ?, relation_type = ?, description = ? WHERE id = ? AND project_id = ?",
          )
          .run(
            sourceEntity.id,
            targetEntity.id,
            nextType,
            nextDescription,
            normalizedId,
            normalizedProjectId,
          );

        const row = selectRelationById(args.db, normalizedId);
        if (!row) {
          return ipcError("DB_ERROR", "Failed to load updated relation");
        }

        return { ok: true, data: rowToRelation(row) };
      } catch (error) {
        args.logger.error("kg_relation_update_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to update relation");
      }
    },

    relationDelete: ({ projectId, id }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required");
      }

      const normalizedProjectId = projectId.trim();
      const normalizedId = id.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const existing = selectRelationById(args.db, normalizedId);
        if (!existing || existing.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "Relation not found");
        }

        args.db
          .prepare("DELETE FROM kg_relations WHERE project_id = ? AND id = ?")
          .run(normalizedProjectId, normalizedId);

        return { ok: true, data: { deleted: true } };
      } catch (error) {
        args.logger.error("kg_relation_delete_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to delete relation");
      }
    },
  };
}

function createQueryGraphOps(
  ctx: KgCoreCtx,
): Pick<KnowledgeGraphService, "querySubgraph" | "queryPath" | "queryByIds"> {
  const args = ctx;
  const limits = ctx.limits;

  return {
    querySubgraph: ({ projectId, centerEntityId, k }) => {
      const startedAt = Date.now();
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (centerEntityId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "centerEntityId is required");
      }
      if (!Number.isInteger(k) || k <= 0) {
        return ipcError("INVALID_ARGUMENT", "k must be a positive integer");
      }
      if (k > limits.subgraphMaxK) {
        return ipcError(
          "KG_SUBGRAPH_K_EXCEEDED",
          `k must be <= ${limits.subgraphMaxK}`,
          { maxK: limits.subgraphMaxK, requestedK: k },
        );
      }

      const normalizedProjectId = projectId.trim();
      const normalizedCenter = centerEntityId.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const center = selectEntityById(args.db, normalizedCenter);
        if (!center || center.projectId !== normalizedProjectId) {
          return ipcError("NOT_FOUND", "center entity not found");
        }

        const depthRows = args.db
          .prepare<
            [string, string, string, number],
            { entityId: string; depth: number }
          >(
            `WITH RECURSIVE traversal(entity_id, depth) AS (
               SELECT ? AS entity_id, 0 AS depth
               UNION
               SELECT edges.neighbor_id AS entity_id, traversal.depth + 1 AS depth
               FROM traversal
               JOIN (
                 SELECT source_entity_id AS from_id, target_entity_id AS neighbor_id
                 FROM kg_relations
                 WHERE project_id = ?
                 UNION ALL
                 SELECT target_entity_id AS from_id, source_entity_id AS neighbor_id
                 FROM kg_relations
                 WHERE project_id = ?
               ) AS edges
                 ON edges.from_id = traversal.entity_id
               WHERE traversal.depth < ?
             ),
             ranked AS (
               SELECT entity_id, MIN(depth) AS depth
               FROM traversal
               GROUP BY entity_id
             )
             SELECT entity_id AS entityId, depth
             FROM ranked
             ORDER BY depth ASC, entity_id ASC`,
          )
          .all(normalizedCenter, normalizedProjectId, normalizedProjectId, k);

        const reachableEntityIds = depthRows.map((row) => row.entityId);
        const reachableSet = new Set(reachableEntityIds);

        const selectedEntityRows = listEntitiesByIds(
          args.db,
          reachableEntityIds,
        ).filter((entry) => entry.projectId === normalizedProjectId);
        const entityById = new Map(
          selectedEntityRows.map((entry) => [entry.id, rowToEntity(entry.row)]),
        );
        const selectedEntities = reachableEntityIds
          .map((entityId) => entityById.get(entityId))
          .filter((entity): entity is KnowledgeEntity => entity !== undefined);

        const selectedRelations = listProjectRelations(
          args.db,
          normalizedProjectId,
        ).filter(
          (relation) =>
            reachableSet.has(relation.sourceEntityId) &&
            reachableSet.has(relation.targetEntityId),
        );

        return {
          ok: true,
          data: {
            entities: selectedEntities,
            relations: selectedRelations,
            nodeCount: selectedEntities.length,
            edgeCount: selectedRelations.length,
            queryCostMs: Date.now() - startedAt,
          },
        };
      } catch (error) {
        args.logger.error("kg_query_subgraph_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to query subgraph");
      }
    },

    queryPath: ({
      projectId,
      sourceEntityId,
      targetEntityId,
      timeoutMs,
      maxDepth,
      maxExpansions,
    }) => {
      const startedAt = Date.now();
      const validated = validateAndNormalizeQueryPathArgs({
        projectId,
        sourceEntityId,
        targetEntityId,
        timeoutMs,
        maxDepth,
        maxExpansions,
        limits,
      });
      if (!validated.ok) {
        return validated;
      }

      const {
        normalizedProjectId,
        normalizedSource,
        normalizedTarget,
        effectiveTimeoutMs,
        effectiveMaxDepth,
        effectiveMaxExpansions,
      } = validated.data;

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const source = selectEntityById(args.db, normalizedSource);
        const target = selectEntityById(args.db, normalizedTarget);
        if (
          !source ||
          !target ||
          source.projectId !== normalizedProjectId ||
          target.projectId !== normalizedProjectId
        ) {
          return ipcError("KG_RELATION_INVALID", "path endpoints are invalid", {
            sourceEntityId: normalizedSource,
            targetEntityId: normalizedTarget,
          });
        }

        const relations = listProjectRelations(args.db, normalizedProjectId);
        const adjacency = buildDirectedAdjacency(relations);
        const queried = queryPathWithinAdjacency({
          adjacency,
          sourceEntityId: normalizedSource,
          targetEntityId: normalizedTarget,
          timeoutMs: effectiveTimeoutMs,
          maxDepth: effectiveMaxDepth,
          maxExpansions: effectiveMaxExpansions,
          startedAt,
        });
        if (!queried.ok) {
          return queried;
        }

        return {
          ok: true,
          data: {
            pathEntityIds: queried.data.pathEntityIds,
            expansions: queried.data.expansions,
            degraded: queried.data.degraded,
            queryCostMs: Date.now() - startedAt,
          },
        };
      } catch (error) {
        args.logger.error("kg_query_path_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to query path");
      }
    },

    queryByIds: ({ projectId, entityIds }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      const normalizedProjectId = projectId.trim();
      const normalizedEntityIds = dedupeIds(entityIds);
      if (normalizedEntityIds.length === 0) {
        return { ok: true, data: { items: [] } };
      }

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const rows = listEntitiesByIds(args.db, normalizedEntityIds);
        const crossProjectIds = rows
          .filter((row) => row.projectId !== normalizedProjectId)
          .map((row) => row.id);
        if (crossProjectIds.length > 0) {
          args.logger.error("kg_scope_violation", {
            project_id: normalizedProjectId,
            foreign_entity_ids: crossProjectIds,
            reason: "query_by_ids",
          });
          return ipcError(
            "KG_SCOPE_VIOLATION",
            "cross-project entity access denied",
            {
              projectId: normalizedProjectId,
              foreignEntityIds: crossProjectIds,
            },
          );
        }

        const rowById = new Map(rows.map((row) => [row.id, row.row]));
        const orderedItems = normalizedEntityIds
          .map((id) => {
            const row = rowById.get(id);
            return row ? rowToEntity(row) : null;
          })
          .filter((entity): entity is KnowledgeEntity => entity !== null);

        return { ok: true, data: { items: orderedItems } };
      } catch (error) {
        args.logger.error("kg_query_by_ids_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to query entities by ids");
      }
    },
  };
}

function createQueryValidateOps(
  ctx: KgCoreCtx,
): Pick<KnowledgeGraphService, "queryValidate"> {
  const args = ctx;
  const limits = ctx.limits;

  return {
    queryValidate: ({ projectId, maxDepth, maxVisited }) => {
      const startedAt = Date.now();
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      const effectiveMaxDepth = maxDepth ?? limits.validateMaxDepth;
      if (!Number.isInteger(effectiveMaxDepth) || effectiveMaxDepth <= 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "maxDepth must be a positive integer",
        );
      }
      const effectiveMaxVisited = maxVisited ?? limits.validateMaxVisited;
      if (!Number.isInteger(effectiveMaxVisited) || effectiveMaxVisited <= 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "maxVisited must be a positive integer",
        );
      }

      const normalizedProjectId = projectId.trim();

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        const relations = listProjectRelations(args.db, normalizedProjectId);
        const adjacency = buildDirectedAdjacency(relations);
        const cycles: string[][] = [];
        const cycleKeys = new Set<string>();

        type TraversalFrame = {
          nodeId: string;
          depth: number;
          neighbors: string[];
          nextNeighborIndex: number;
          entered: boolean;
        };

        const visited = new Set<string>();
        const stack = new Set<string>();
        const path: string[] = [];
        const frames: TraversalFrame[] = [];

        const pushFrame = (nodeId: string, depth: number): Err | null => {
          if (depth > effectiveMaxDepth) {
            return ipcError("KG_QUERY_TIMEOUT", "query timeout", {
              reason: "MAX_DEPTH_EXCEEDED",
              maxDepth: effectiveMaxDepth,
              depth,
              nodeId,
              suggestion: "reduce graph scope or increase maxDepth",
            });
          }

          frames.push({
            nodeId,
            depth,
            neighbors: adjacency.get(nodeId) ?? [],
            nextNeighborIndex: 0,
            entered: false,
          });
          return null;
        };

        for (const nodeId of adjacency.keys()) {
          if (!visited.has(nodeId)) {
            const pushRootError = pushFrame(nodeId, 0);
            if (pushRootError) {
              return pushRootError;
            }

            while (frames.length > 0) {
              const frame = frames[frames.length - 1];
              if (!frame.entered) {
                frame.entered = true;
                visited.add(frame.nodeId);
                if (visited.size > effectiveMaxVisited) {
                  return ipcError("KG_QUERY_TIMEOUT", "query timeout", {
                    reason: "MAX_VISITED_EXCEEDED",
                    maxVisited: effectiveMaxVisited,
                    visited: visited.size,
                    nodeId: frame.nodeId,
                    suggestion: "reduce graph scope or increase maxVisited",
                  });
                }
                stack.add(frame.nodeId);
                path.push(frame.nodeId);
              }

              if (frame.nextNeighborIndex >= frame.neighbors.length) {
                stack.delete(frame.nodeId);
                path.pop();
                frames.pop();
                continue;
              }

              const neighbor = frame.neighbors[frame.nextNeighborIndex];
              frame.nextNeighborIndex += 1;
              if (!visited.has(neighbor)) {
                const pushChildError = pushFrame(neighbor, frame.depth + 1);
                if (pushChildError) {
                  return pushChildError;
                }
                continue;
              }
              if (!stack.has(neighbor)) {
                continue;
              }

              const idx = path.lastIndexOf(neighbor);
              if (idx < 0) {
                continue;
              }
              const cycle = [...path.slice(idx), neighbor];
              const key = cycle.join("->");
              if (cycleKeys.has(key)) {
                continue;
              }

              cycleKeys.add(key);
              cycles.push(cycle);
            }
          }
        }

        return {
          ok: true,
          data: {
            cycles,
            queryCostMs: Date.now() - startedAt,
          },
        };
      } catch (error) {
        args.logger.error("kg_query_validate_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to validate graph");
      }
    },
  };
}

function createQueryTextOps(
  ctx: KgCoreCtx,
): Pick<KnowledgeGraphService, "queryRelevant" | "buildRulesInjection"> {
  const args = ctx;

  return {
    queryRelevant: ({ projectId, excerpt, maxEntities, entityIds }) => {
      const startedAt = Date.now();
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }

      const normalizedProjectId = projectId.trim();
      const normalizedExcerpt = excerpt.trim().toLowerCase();
      const normalizedEntityIds = dedupeIds(entityIds ?? []);
      const maxCount = resolveMaxEntities(maxEntities);

      if (process.env.CREONOW_KG_FORCE_RELEVANT_QUERY_FAIL === "1") {
        args.logger.error("kg_query_relevant_failed", {
          code: "KG_RELEVANT_QUERY_FAILED",
          project_id: normalizedProjectId,
        });
        return ipcError(
          "KG_RELEVANT_QUERY_FAILED",
          "relevant query unavailable",
          { projectId: normalizedProjectId },
        );
      }

      try {
        const projectExists = ensureProjectExists(args.db, normalizedProjectId);
        if (projectExists) {
          return projectExists;
        }

        let candidateEntities: KnowledgeEntity[] = [];
        if (normalizedEntityIds.length > 0) {
          const rows = listEntitiesByIds(args.db, normalizedEntityIds);
          const crossProjectIds = rows
            .filter((row) => row.projectId !== normalizedProjectId)
            .map((row) => row.id);

          if (crossProjectIds.length > 0) {
            args.logger.error("kg_scope_violation", {
              project_id: normalizedProjectId,
              foreign_entity_ids: crossProjectIds,
              reason: "query_relevant",
            });
            return ipcError(
              "KG_SCOPE_VIOLATION",
              "cross-project entity access denied",
              {
                projectId: normalizedProjectId,
                foreignEntityIds: crossProjectIds,
              },
            );
          }

          const rowById = new Map(rows.map((row) => [row.id, row.row]));
          candidateEntities = normalizedEntityIds
            .map((id) => {
              const row = rowById.get(id);
              return row ? rowToEntity(row) : null;
            })
            .filter((entity): entity is KnowledgeEntity => entity !== null);
        } else {
          candidateEntities = listProjectEntities(args.db, normalizedProjectId);
        }

        if (normalizedExcerpt.length === 0) {
          return {
            ok: true,
            data: {
              items: candidateEntities.slice(0, maxCount),
              queryCostMs: Date.now() - startedAt,
            },
          };
        }

        const excerptTokens = new Set(
          normalizeKeywordTokens(normalizedExcerpt),
        );
        const scored = candidateEntities
          .map((entity) => {
            let score = 0;
            const mentionIndex = normalizedExcerpt.indexOf(
              entity.name.toLowerCase(),
            );

            if (mentionIndex >= 0) {
              score += 100;
            }

            const textBlob = `${entity.description} ${Object.values(entity.attributes).join(" ")}`;
            const tokens = normalizeKeywordTokens(textBlob).slice(0, 24);
            for (const token of tokens) {
              if (
                excerptTokens.has(token) ||
                normalizedExcerpt.includes(token)
              ) {
                score += 8;
              }
            }

            return {
              entity,
              score,
              mentionIndex:
                mentionIndex >= 0 ? mentionIndex : Number.MAX_SAFE_INTEGER,
            };
          })
          .filter((item) => item.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            if (a.mentionIndex !== b.mentionIndex) {
              return a.mentionIndex - b.mentionIndex;
            }
            return b.entity.updatedAt.localeCompare(a.entity.updatedAt);
          });

        return {
          ok: true,
          data: {
            items: scored.slice(0, maxCount).map((item) => item.entity),
            queryCostMs: Date.now() - startedAt,
          },
        };
      } catch (error) {
        args.logger.error("kg_query_relevant_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to query relevant entities");
      }
    },

    buildRulesInjection: ({
      projectId,
      documentId,
      excerpt,
      traceId,
      maxEntities,
      entityIds,
    }) => {
      const invalidProjectId = validateProjectId(projectId);
      if (invalidProjectId) {
        return invalidProjectId;
      }
      if (documentId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "documentId is required");
      }
      if (traceId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "traceId is required");
      }

      const normalizedProjectId = projectId.trim();
      const relevantRes = createKnowledgeGraphCoreService({
        db: args.db,
        logger: args.logger,
      }).queryRelevant({
        projectId: normalizedProjectId,
        excerpt,
        maxEntities,
        entityIds,
      });

      if (!relevantRes.ok) {
        if (relevantRes.error.code === "KG_SCOPE_VIOLATION") {
          return relevantRes;
        }

        args.logger.error("kg_rules_injection_fallback", {
          code: relevantRes.error.code,
          trace_id: traceId,
          project_id: normalizedProjectId,
        });
        return {
          ok: true,
          data: {
            injectedEntities: [],
            source: "kg-rules-mock",
          },
        };
      }

      if (relevantRes.data.items.length === 0) {
        return {
          ok: true,
          data: {
            injectedEntities: [],
            source: "kg-rules-mock",
          },
        };
      }

      try {
        const entityNameById = new Map<string, string>();
        for (const entity of listProjectEntities(
          args.db,
          normalizedProjectId,
        )) {
          entityNameById.set(entity.id, entity.name);
        }

        const relations = listProjectRelations(args.db, normalizedProjectId);
        const injectedEntities: KgRulesInjectionEntity[] =
          relevantRes.data.items.map((entity) => {
            const attributes: Record<string, string> = {};
            for (const [rawKey, rawValue] of Object.entries(
              entity.attributes,
            )) {
              const key = rawKey.trim();
              const value = rawValue.trim();
              if (key.length === 0 || value.length === 0) {
                continue;
              }
              attributes[key] = value;
            }

            const relationsSummary: string[] = [];
            for (const relation of relations) {
              if (
                relation.sourceEntityId !== entity.id &&
                relation.targetEntityId !== entity.id
              ) {
                continue;
              }

              const sourceName =
                entityNameById.get(relation.sourceEntityId) ??
                relation.sourceEntityId;
              const targetName =
                entityNameById.get(relation.targetEntityId) ??
                relation.targetEntityId;
              relationsSummary.push(
                `${sourceName} -(${relation.relationType})-> ${targetName}`,
              );

              if (relationsSummary.length >= 8) {
                break;
              }
            }

            return {
              id: entity.id,
              name: entity.name,
              type: entity.type,
              attributes,
              relationsSummary,
            };
          });

        return {
          ok: true,
          data: {
            injectedEntities,
            source: "kg-rules-mock",
          },
        };
      } catch (error) {
        args.logger.error("kg_rules_injection_failed", {
          code: "DB_ERROR",
          trace_id: traceId,
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to build KG rules injection", {
          traceId,
        });
      }
    },
  };
}

export function createKnowledgeGraphCoreService(args: {
  db: Database.Database;
  logger: Logger;
}): KnowledgeGraphService {
  const limits = resolveLimits();

  const ctx: KgCoreCtx = { db: args.db, logger: args.logger, limits };

  return {
    ...createEntityOps(ctx),
    ...createEntityUpdateOps(ctx),
    ...createRelationOps(ctx),
    ...createQueryGraphOps(ctx),
    ...createQueryValidateOps(ctx),
    ...createQueryTextOps(ctx),
  };
}
