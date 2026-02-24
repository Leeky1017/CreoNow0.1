import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type Database from "better-sqlite3";

import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import { createProjectService } from "../projects/projectService";
import {
  createSkillFileIo,
  type DataProcessTaskRunner,
  type SkillFileIo,
} from "./skillFileIo";
import {
  loadSkillFile,
  loadSkills,
  type LoadedSkill,
  type SkillFileRef,
} from "./skillLoader";
import type { SkillScope } from "./skillValidator";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: IpcError };
export type ServiceResult<T> = Ok<T> | Err;

export type SkillListItem = {
  id: string;
  name: string;
  scope: SkillScope;
  packageId: string;
  version: string;
  enabled: boolean;
  valid: boolean;
  error_code?: IpcErrorCode;
  error_message?: string;
};

export type CustomSkillInputType = "selection" | "document";

export type CustomSkillScope = "global" | "project";

export type CustomSkillRecord = {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  inputType: CustomSkillInputType;
  contextRules: Record<string, unknown>;
  scope: CustomSkillScope;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SkillReadResult = {
  id: string;
  content: string;
};

export type SkillWriteResult = {
  id: string;
  scope: SkillScope;
  written: true;
};

export type SkillToggleResult = {
  id: string;
  enabled: boolean;
};

export type SkillCustomUpdateResult = {
  id: string;
  scope: "global" | "project";
};

export type SkillService = {
  list: (args: { includeDisabled?: boolean }) => ServiceResult<{
    items: SkillListItem[];
  }>;
  read: (args: { id: string }) => Promise<ServiceResult<SkillReadResult>>;
  write: (args: {
    id: string;
    content: string;
  }) => Promise<ServiceResult<SkillWriteResult>>;
  toggle: (args: {
    id: string;
    enabled: boolean;
  }) => ServiceResult<SkillToggleResult>;
  updateCustom: (args: {
    id: string;
    scope?: "global" | "project";
    name?: string;
    description?: string;
    promptTemplate?: string;
    inputType?: CustomSkillInputType;
    contextRules?: Record<string, unknown>;
    enabled?: boolean;
  }) => ServiceResult<SkillCustomUpdateResult>;
  createCustom: (args: {
    name: string;
    description: string;
    promptTemplate: string;
    inputType: CustomSkillInputType;
    contextRules: Record<string, unknown>;
    scope: CustomSkillScope;
    enabled?: boolean;
  }) => ServiceResult<{ skill: CustomSkillRecord }>;
  deleteCustom: (args: {
    id: string;
  }) => ServiceResult<{ id: string; deleted: true }>;
  listCustom: () => ServiceResult<{ items: CustomSkillRecord[] }>;
  resolveForRun: (args: { id: string }) => ServiceResult<{
    skill: LoadedSkill;
    enabled: boolean;
    inputType?: CustomSkillInputType;
  }>;
  isDependencyAvailable: (args: {
    dependencyId: string;
  }) => ServiceResult<{ available: boolean }>;
};

const GLOBAL_CUSTOM_SKILL_LIMIT = 1_000;
const PROJECT_CUSTOM_SKILL_LIMIT = 500;
const SKILL_REGISTRY_PROJECT_CACHE_LIMIT = 8;
const NO_PROJECT_CACHE_KEY = "__no_project__";

type SkillDbRow = {
  skillId: string;
  enabled: number;
};

type CustomSkillDbRow = {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  inputType: CustomSkillInputType;
  contextRules: string;
  scope: CustomSkillScope;
  projectId: string | null;
  enabled: number;
  createdAt: number;
  updatedAt: number;
};

type CustomSkillOwnershipRow = {
  id: string;
  scope: CustomSkillScope;
  projectId: string | null;
};

type SkillRegistryCacheEntry = {
  skills: LoadedSkill[];
};

function nowTs(): number {
  return Date.now();
}

function normalizeCustomSkillId(id: string): string {
  if (id.startsWith("custom:")) {
    return id.slice("custom:".length);
  }
  return id;
}

function leafSkillId(id: string): string {
  const parts = id.split(":");
  return parts[parts.length - 1] ?? id;
}

function encodeCustomListId(id: string): string {
  return `custom:${id}`;
}

/**
 * Build a validation error payload with deterministic wording for forms.
 */
function validationError(fieldName: string, message: string): Err {
  return ipcError("VALIDATION_ERROR", message, { fieldName });
}

function parseContextRules(
  raw: unknown,
): ServiceResult<Record<string, unknown>> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return validationError("contextRules", "contextRules 必须为对象");
  }
  return { ok: true, data: raw as Record<string, unknown> };
}

function requireTextField(
  fieldName: string,
  value: string,
  emptyMessage: string,
): ServiceResult<string> {
  if (value.trim().length === 0) {
    return validationError(fieldName, emptyMessage);
  }
  return { ok: true, data: value };
}

function requireInputType(
  inputType: string,
): ServiceResult<CustomSkillInputType> {
  if (inputType === "selection" || inputType === "document") {
    return { ok: true, data: inputType };
  }
  return validationError("inputType", "inputType 必须为 selection 或 document");
}

function requireCustomScope(scope: string): ServiceResult<CustomSkillScope> {
  if (scope === "global" || scope === "project") {
    return { ok: true, data: scope };
  }
  return validationError("scope", "scope 必须为 global 或 project");
}

function parseContextRulesJson(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function customPromptSystem(args: {
  name: string;
  description: string;
  contextRules: Record<string, unknown>;
}): string {
  const lines: string[] = [
    `你正在执行自定义技能：${args.name}`,
    `技能描述：${args.description}`,
  ];
  const keys = Object.keys(args.contextRules);
  if (keys.length > 0) {
    lines.push(`上下文规则：${JSON.stringify(args.contextRules)}`);
  }
  return lines.join("\n");
}

function toCustomSkillRecord(row: CustomSkillDbRow): CustomSkillRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    promptTemplate: row.promptTemplate,
    inputType: row.inputType,
    contextRules: parseContextRulesJson(row.contextRules),
    scope: row.scope,
    enabled: row.enabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Build a stable IPC error object.
 *
 * Why: skills must surface deterministic, UI-displayable failures without throwing.
 */
function ipcError(code: IpcErrorCode, message: string, details?: unknown): Err {
  return { ok: false, error: { code, message, details } };
}

/**
 * Resolve the current project info, if set.
 */
function getCurrentProjectInfo(args: {
  db: Database.Database;
  userDataDir: string;
  logger: Logger;
}): ServiceResult<{ projectId: string; rootPath: string } | null> {
  const projectSvc = createProjectService({
    db: args.db,
    userDataDir: args.userDataDir,
    logger: args.logger,
  });
  const current = projectSvc.getCurrent();
  if (!current.ok) {
    if (current.error.code === "NOT_FOUND") {
      return { ok: true, data: null };
    }
    return current;
  }
  return {
    ok: true,
    data: {
      projectId: current.data.projectId,
      rootPath: current.data.rootPath,
    },
  };
}

/**
 * Read enabled flags for known skills.
 */
function readEnabledMap(
  db: Database.Database,
): ServiceResult<Map<string, boolean>> {
  try {
    const rows = db
      .prepare<
        [],
        SkillDbRow
      >("SELECT skill_id as skillId, enabled FROM skills")
      .all();
    const map = new Map<string, boolean>();
    for (const r of rows) {
      map.set(r.skillId, r.enabled === 1);
    }
    return { ok: true, data: map };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to read skill state",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Read current custom skills visible to the active project context.
 */
function readCustomSkills(args: {
  db: Database.Database;
  currentProjectId: string | null;
}): ServiceResult<CustomSkillRecord[]> {
  try {
    let rows: CustomSkillDbRow[];
    if (args.currentProjectId) {
      rows = args.db
        .prepare<[{ currentProjectId: string }], CustomSkillDbRow>(
          `
          SELECT
            id,
            name,
            description,
            prompt_template as promptTemplate,
            input_type as inputType,
            context_rules as contextRules,
            scope,
            project_id as projectId,
            enabled,
            created_at as createdAt,
            updated_at as updatedAt
          FROM custom_skills
          WHERE scope = 'global' OR (scope = 'project' AND project_id = @currentProjectId)
          ORDER BY updated_at DESC, id ASC
          `,
        )
        .all({ currentProjectId: args.currentProjectId });
    } else {
      rows = args.db
        .prepare<[], CustomSkillDbRow>(
          `
          SELECT
            id,
            name,
            description,
            prompt_template as promptTemplate,
            input_type as inputType,
            context_rules as contextRules,
            scope,
            project_id as projectId,
            enabled,
            created_at as createdAt,
            updated_at as updatedAt
          FROM custom_skills
          WHERE scope = 'global'
          ORDER BY updated_at DESC, id ASC
          `,
        )
        .all();
    }

    return {
      ok: true,
      data: rows.map((row) => toCustomSkillRecord(row)),
    };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to read custom skills",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function readCustomSkillById(args: {
  db: Database.Database;
  currentProjectId: string | null;
  id: string;
}): ServiceResult<CustomSkillRecord | null> {
  const listed = readCustomSkills({
    db: args.db,
    currentProjectId: args.currentProjectId,
  });
  if (!listed.ok) {
    return listed;
  }
  const found = listed.data.find((item) => item.id === args.id) ?? null;
  return { ok: true, data: found };
}

function readCustomSkillOwnershipById(args: {
  db: Database.Database;
  id: string;
}): ServiceResult<CustomSkillOwnershipRow | null> {
  try {
    const row = args.db
      .prepare<
        [string],
        CustomSkillOwnershipRow
      >("SELECT id, scope, project_id as projectId FROM custom_skills WHERE id = ?")
      .get(args.id);
    return { ok: true, data: row ?? null };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to read custom skill scope ownership",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function countCustomSkills(args: {
  db: Database.Database;
  scope: CustomSkillScope;
  projectId: string | null;
  excludeSkillId?: string;
}): ServiceResult<number> {
  try {
    if (args.scope === "global") {
      const row = args.excludeSkillId
        ? args.db
            .prepare<
              [string],
              { count: number }
            >("SELECT COUNT(*) as count FROM custom_skills WHERE scope = 'global' AND id != ?")
            .get(args.excludeSkillId)
        : args.db
            .prepare<
              [],
              { count: number }
            >("SELECT COUNT(*) as count FROM custom_skills WHERE scope = 'global'")
            .get();
      return { ok: true, data: row?.count ?? 0 };
    }

    if (!args.projectId) {
      return ipcError("NOT_FOUND", "Project scope is unavailable");
    }

    const row = args.excludeSkillId
      ? args.db
          .prepare<
            [string, string],
            { count: number }
          >("SELECT COUNT(*) as count FROM custom_skills WHERE scope = 'project' AND project_id = ? AND id != ?")
          .get(args.projectId, args.excludeSkillId)
      : args.db
          .prepare<
            [string],
            { count: number }
          >("SELECT COUNT(*) as count FROM custom_skills WHERE scope = 'project' AND project_id = ?")
          .get(args.projectId);
    return { ok: true, data: row?.count ?? 0 };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to count custom skills",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function ensureCustomSkillCapacity(args: {
  db: Database.Database;
  scope: CustomSkillScope;
  projectId: string | null;
  excludeSkillId?: string;
}): ServiceResult<true> {
  const counted = countCustomSkills(args);
  if (!counted.ok) {
    return counted;
  }

  const limit =
    args.scope === "global"
      ? GLOBAL_CUSTOM_SKILL_LIMIT
      : PROJECT_CUSTOM_SKILL_LIMIT;
  if (counted.data >= limit) {
    return ipcError(
      "SKILL_CAPACITY_EXCEEDED",
      "Custom skill capacity exceeded",
      {
        scope: args.scope,
        projectId: args.projectId,
        count: counted.data,
        limit,
      },
    );
  }

  return { ok: true, data: true };
}

function insertCustomSkill(args: {
  db: Database.Database;
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  inputType: CustomSkillInputType;
  contextRules: Record<string, unknown>;
  scope: CustomSkillScope;
  projectId: string | null;
  enabled: boolean;
}): ServiceResult<CustomSkillRecord> {
  try {
    const ts = nowTs();
    args.db
      .prepare(
        `
        INSERT INTO custom_skills (
          id,
          name,
          description,
          prompt_template,
          input_type,
          context_rules,
          scope,
          project_id,
          enabled,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        args.id,
        args.name,
        args.description,
        args.promptTemplate,
        args.inputType,
        JSON.stringify(args.contextRules),
        args.scope,
        args.projectId,
        args.enabled ? 1 : 0,
        ts,
        ts,
      );
    return {
      ok: true,
      data: {
        id: args.id,
        name: args.name,
        description: args.description,
        promptTemplate: args.promptTemplate,
        inputType: args.inputType,
        contextRules: args.contextRules,
        scope: args.scope,
        enabled: args.enabled,
        createdAt: ts,
        updatedAt: ts,
      },
    };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to create custom skill",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function updateCustomSkillRow(args: {
  db: Database.Database;
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  inputType: CustomSkillInputType;
  contextRules: Record<string, unknown>;
  scope: CustomSkillScope;
  projectId: string | null;
  enabled: boolean;
}): ServiceResult<CustomSkillRecord> {
  try {
    const ts = nowTs();
    args.db
      .prepare(
        `
        UPDATE custom_skills
        SET
          name = ?,
          description = ?,
          prompt_template = ?,
          input_type = ?,
          context_rules = ?,
          scope = ?,
          project_id = ?,
          enabled = ?,
          updated_at = ?
        WHERE id = ?
        `,
      )
      .run(
        args.name,
        args.description,
        args.promptTemplate,
        args.inputType,
        JSON.stringify(args.contextRules),
        args.scope,
        args.projectId,
        args.enabled ? 1 : 0,
        ts,
        args.id,
      );
    const createdAt = args.db
      .prepare<
        [string],
        { createdAt: number }
      >("SELECT created_at as createdAt FROM custom_skills WHERE id = ?")
      .get(args.id)?.createdAt;
    return {
      ok: true,
      data: {
        id: args.id,
        name: args.name,
        description: args.description,
        promptTemplate: args.promptTemplate,
        inputType: args.inputType,
        contextRules: args.contextRules,
        scope: args.scope,
        enabled: args.enabled,
        createdAt: createdAt ?? ts,
        updatedAt: ts,
      },
    };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to update custom skill",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Upsert skill state rows (enabled + validation status).
 */
function upsertSkillRows(args: {
  db: Database.Database;
  skills: LoadedSkill[];
  enabledMap: Map<string, boolean>;
}): ServiceResult<true> {
  try {
    const ts = nowTs();
    const stmt = args.db.prepare(
      "INSERT INTO skills (skill_id, enabled, valid, error_code, error_message, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(skill_id) DO UPDATE SET enabled = excluded.enabled, valid = excluded.valid, error_code = excluded.error_code, error_message = excluded.error_message, updated_at = excluded.updated_at",
    );

    args.db.transaction(() => {
      for (const s of args.skills) {
        const enabled = args.enabledMap.get(s.id) ?? true;
        stmt.run(
          s.id,
          enabled ? 1 : 0,
          s.valid ? 1 : 0,
          s.valid ? null : (s.error_code ?? "INVALID_ARGUMENT"),
          s.valid ? null : (s.error_message ?? "Invalid skill"),
          ts,
        );
      }
    })();

    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to persist skill state",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function normalizeUnknownError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function createDirectDataProcessRunner(): DataProcessTaskRunner {
  return {
    run: async <T>(args: {
      execute?: (signal: AbortSignal) => Promise<T>;
      run?: (signal: AbortSignal) => Promise<T>;
    }) => {
      const execute = args.execute ?? args.run;
      if (!execute) {
        return {
          status: "error" as const,
          error: new Error("Data process execute callback is required"),
        };
      }

      try {
        const value = await execute(new AbortController().signal);
        return { status: "completed" as const, value };
      } catch (error) {
        return {
          status: "error" as const,
          error: normalizeUnknownError(error),
        };
      }
    },
  };
}

/**
 * Rewrite the YAML `scope` frontmatter field for scope promotion/demotion.
 *
 * Why: moved files must remain valid against directory scope validation.
 */
function rewriteFrontmatterScope(args: {
  content: string;
  scope: "global" | "project";
}): string {
  const normalized = args.content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0]?.trim() !== "---") {
    return args.content;
  }

  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i]?.trim() === "---") {
      break;
    }
    if (lines[i]?.trim().startsWith("scope:")) {
      lines[i] = `scope: ${args.scope}`;
      return lines.join("\n");
    }
  }

  return args.content;
}

/**
 * Build a SkillFileRef from a loaded skill and a target scope root.
 */
function toScopeFileRef(args: {
  skill: LoadedSkill;
  scope: SkillScope;
  srcRoot: string;
  destRoot: string;
}): ServiceResult<SkillFileRef> {
  const rel = path.relative(args.srcRoot, args.skill.filePath);
  const isInside =
    rel.length > 0 && !rel.startsWith("..") && !path.isAbsolute(rel);
  if (!isInside) {
    return ipcError("INTERNAL", "Skill path is outside expected root");
  }

  const filePath = path.join(args.destRoot, rel);
  const skillDirName = path.basename(path.dirname(filePath));
  return {
    ok: true,
    data: {
      scope: args.scope,
      packageId: args.skill.packageId,
      version: args.skill.version,
      skillDirName,
      filePath,
    },
  };
}

/**
 * Resolve a root directory by scope from loaded roots.
 */
function scopeRoot(args: {
  scope: SkillScope;
  roots: {
    builtinSkillsDir: string;
    globalSkillsDir: string;
    projectSkillsDir: string | null;
  };
}): string | null {
  if (args.scope === "builtin") {
    return args.roots.builtinSkillsDir;
  }
  if (args.scope === "global") {
    return args.roots.globalSkillsDir;
  }
  return args.roots.projectSkillsDir;
}

/**
 * Remove a source skill file after a successful scope move.
 */
function removeSkillContent(filePath: string): ServiceResult<true> {
  try {
    fs.rmSync(filePath, { force: true });
    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "IO_ERROR",
      "Failed to remove old skill file after scope update",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Create the skills service.
 */
export function createSkillService(deps: {
  db: Database.Database;
  userDataDir: string;
  builtinSkillsDir: string;
  logger: Logger;
  dataProcess?: DataProcessTaskRunner;
  skillFileIo?: SkillFileIo;
  skillFileIoTimeoutMs?: number;
}): SkillService {
  const globalSkillsDir = path.join(deps.userDataDir, "skills");
  const skillFileIo =
    deps.skillFileIo ??
    createSkillFileIo({
      dataProcess: deps.dataProcess ?? createDirectDataProcessRunner(),
      timeoutMs: deps.skillFileIoTimeoutMs,
    });
  const skillRegistryCache = new Map<string, SkillRegistryCacheEntry>();
  let activeProjectCacheKey: string | null = null;

  const invalidateSkillRegistryCache = (): void => {
    skillRegistryCache.clear();
  };

  const readSkillRegistryCache = (
    projectCacheKey: string,
  ): SkillRegistryCacheEntry | null => {
    const cached = skillRegistryCache.get(projectCacheKey);
    if (!cached) {
      return null;
    }
    skillRegistryCache.delete(projectCacheKey);
    skillRegistryCache.set(projectCacheKey, cached);
    return cached;
  };

  const writeSkillRegistryCache = (
    projectCacheKey: string,
    entry: SkillRegistryCacheEntry,
  ): void => {
    if (skillRegistryCache.has(projectCacheKey)) {
      skillRegistryCache.delete(projectCacheKey);
    }
    skillRegistryCache.set(projectCacheKey, entry);
    while (skillRegistryCache.size > SKILL_REGISTRY_PROJECT_CACHE_LIMIT) {
      const oldest = skillRegistryCache.keys().next();
      if (oldest.done) {
        return;
      }
      skillRegistryCache.delete(oldest.value);
    }
  };

  const resolveLoaded = (): ServiceResult<{
    skills: LoadedSkill[];
    enabledMap: Map<string, boolean>;
    currentProjectId: string | null;
    roots: {
      builtinSkillsDir: string;
      globalSkillsDir: string;
      projectSkillsDir: string | null;
    };
  }> => {
    const currentProject = getCurrentProjectInfo({
      db: deps.db,
      userDataDir: deps.userDataDir,
      logger: deps.logger,
    });
    if (!currentProject.ok) {
      return currentProject;
    }

    const projectSkillsDir =
      currentProject.data === null
        ? null
        : path.join(currentProject.data.rootPath, ".creonow", "skills");

    const roots = {
      builtinSkillsDir: deps.builtinSkillsDir,
      globalSkillsDir,
      projectSkillsDir,
    };
    const projectCacheKey =
      currentProject.data === null
        ? NO_PROJECT_CACHE_KEY
        : `${currentProject.data.projectId}:${currentProject.data.rootPath}`;

    if (
      activeProjectCacheKey !== null &&
      activeProjectCacheKey !== projectCacheKey
    ) {
      invalidateSkillRegistryCache();
    }
    activeProjectCacheKey = projectCacheKey;

    const cached = readSkillRegistryCache(projectCacheKey);
    let resolvedSkills: LoadedSkill[];
    if (cached) {
      resolvedSkills = cached.skills;
    } else {
      const loaded = loadSkills({
        logger: deps.logger,
        roots,
      });
      if (!loaded.ok) {
        return loaded;
      }
      resolvedSkills = loaded.data.skills;
      writeSkillRegistryCache(projectCacheKey, {
        skills: resolvedSkills,
      });
    }

    const enabledMapRes = readEnabledMap(deps.db);
    if (!enabledMapRes.ok) {
      return enabledMapRes;
    }

    const upserted = upsertSkillRows({
      db: deps.db,
      skills: resolvedSkills,
      enabledMap: enabledMapRes.data,
    });
    if (!upserted.ok) {
      return upserted;
    }

    return {
      ok: true,
      data: {
        skills: resolvedSkills,
        enabledMap: enabledMapRes.data,
        roots,
        currentProjectId: currentProject.data?.projectId ?? null,
      },
    };
  };

  return {
    list: ({ includeDisabled }) => {
      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const builtins = loaded.data.skills.map((s): SkillListItem => {
        const enabled = loaded.data.enabledMap.get(s.id) ?? true;
        return {
          id: s.id,
          name: s.name,
          scope: s.scope,
          packageId: s.packageId,
          version: s.version,
          enabled,
          valid: s.valid,
          error_code: s.error_code,
          error_message: s.error_message,
        };
      });

      const customSkills = readCustomSkills({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
      });
      if (!customSkills.ok) {
        return customSkills;
      }

      const customItems = customSkills.data.map(
        (item): SkillListItem => ({
          id: encodeCustomListId(item.id),
          name: item.name,
          scope: item.scope,
          packageId: "pkg.creonow.custom",
          version: "1.0.0",
          enabled: item.enabled,
          valid: item.promptTemplate.trim().length > 0,
        }),
      );

      const items = [...builtins, ...customItems].filter((s) =>
        includeDisabled ? true : s.enabled,
      );

      return { ok: true, data: { items } };
    },

    read: async ({ id }) => {
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required", {
          fieldName: "id",
        });
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const skill = loaded.data.skills.find((s) => s.id === id) ?? null;
      if (!skill) {
        return ipcError("NOT_FOUND", "Skill not found", { id });
      }

      const content = await skillFileIo.read({ filePath: skill.filePath });
      if (!content.ok) {
        return content;
      }
      return { ok: true, data: { id, content: content.data } };
    },

    write: async ({ id, content }) => {
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required", {
          fieldName: "id",
        });
      }
      if (content.length === 0) {
        return ipcError("INVALID_ARGUMENT", "content is required", {
          fieldName: "content",
        });
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const skill = loaded.data.skills.find((s) => s.id === id) ?? null;
      if (!skill) {
        return ipcError("NOT_FOUND", "Skill not found", { id });
      }

      const projectAvailable = loaded.data.roots.projectSkillsDir !== null;
      const targetScope: SkillScope =
        skill.scope === "project" || skill.scope === "global"
          ? skill.scope
          : projectAvailable
            ? "project"
            : "global";

      const targetRoot =
        targetScope === "project"
          ? loaded.data.roots.projectSkillsDir
          : loaded.data.roots.globalSkillsDir;
      if (targetRoot === null) {
        return ipcError(
          "NOT_FOUND",
          "No current project for project skill write",
        );
      }

      const srcRoot =
        skill.scope === "project"
          ? loaded.data.roots.projectSkillsDir
          : skill.scope === "global"
            ? loaded.data.roots.globalSkillsDir
            : loaded.data.roots.builtinSkillsDir;
      if (srcRoot === null) {
        return ipcError("INTERNAL", "Missing source root for skill");
      }

      const ref = toScopeFileRef({
        skill,
        scope: targetScope,
        srcRoot,
        destRoot: targetRoot,
      });
      if (!ref.ok) {
        return ref;
      }

      const written = await skillFileIo.write({
        filePath: ref.data.filePath,
        content,
      });
      if (!written.ok) {
        return written;
      }

      const reloaded = loadSkillFile({ ref: ref.data });
      const enabledMapRes = readEnabledMap(deps.db);
      if (!enabledMapRes.ok) {
        return enabledMapRes;
      }
      const upserted = upsertSkillRows({
        db: deps.db,
        skills: [reloaded],
        enabledMap: enabledMapRes.data,
      });
      if (!upserted.ok) {
        return upserted;
      }

      invalidateSkillRegistryCache();

      return { ok: true, data: { id, scope: targetScope, written: true } };
    },

    toggle: ({ id, enabled }) => {
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required", {
          fieldName: "id",
        });
      }

      const normalizedCustomId = normalizeCustomSkillId(id);

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const custom = readCustomSkillById({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
        id: normalizedCustomId,
      });
      if (!custom.ok) {
        return custom;
      }
      if (custom.data) {
        try {
          deps.db
            .prepare(
              "UPDATE custom_skills SET enabled = ?, updated_at = ? WHERE id = ?",
            )
            .run(enabled ? 1 : 0, nowTs(), custom.data.id);
          return {
            ok: true,
            data: {
              id: encodeCustomListId(custom.data.id),
              enabled,
            },
          };
        } catch (error) {
          return ipcError(
            "DB_ERROR",
            "Failed to toggle custom skill",
            error instanceof Error ? { message: error.message } : { error },
          );
        }
      }

      const skill = loaded.data.skills.find((s) => s.id === id) ?? null;
      if (!skill) {
        return ipcError("NOT_FOUND", "Skill not found", { id });
      }

      try {
        const ts = nowTs();
        deps.db
          .prepare(
            "INSERT INTO skills (skill_id, enabled, valid, error_code, error_message, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(skill_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at",
          )
          .run(
            id,
            enabled ? 1 : 0,
            skill.valid ? 1 : 0,
            skill.valid ? null : (skill.error_code ?? "INVALID_ARGUMENT"),
            skill.valid ? null : (skill.error_message ?? "Invalid skill"),
            ts,
          );

        deps.logger.info("skill_toggled", { id, enabled });
        return { ok: true, data: { id, enabled } };
      } catch (error) {
        deps.logger.error("skill_toggle_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to toggle skill");
      }
    },

    updateCustom: ({
      id,
      scope,
      name,
      description,
      promptTemplate,
      inputType,
      contextRules,
      enabled,
    }) => {
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required", {
          fieldName: "id",
        });
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const customId = normalizeCustomSkillId(id);
      const custom = readCustomSkillById({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
        id: customId,
      });
      if (!custom.ok) {
        return custom;
      }
      if (custom.data) {
        const nextScope = scope ?? custom.data.scope;
        const validScope = requireCustomScope(nextScope);
        if (!validScope.ok) {
          return validScope;
        }

        const nextName = name ?? custom.data.name;
        const validName = requireTextField("name", nextName, "name 不能为空");
        if (!validName.ok) {
          return validName;
        }

        const nextDescription = description ?? custom.data.description;
        const validDescription = requireTextField(
          "description",
          nextDescription,
          "description 不能为空",
        );
        if (!validDescription.ok) {
          return validDescription;
        }

        const nextTemplate = promptTemplate ?? custom.data.promptTemplate;
        const validTemplate = requireTextField(
          "promptTemplate",
          nextTemplate,
          "promptTemplate 不能为空",
        );
        if (!validTemplate.ok) {
          return validTemplate;
        }

        const nextInputType = inputType ?? custom.data.inputType;
        const validInputType = requireInputType(nextInputType);
        if (!validInputType.ok) {
          return validInputType;
        }

        const parsedContextRules =
          contextRules === undefined
            ? { ok: true as const, data: custom.data.contextRules }
            : parseContextRules(contextRules);
        if (!parsedContextRules.ok) {
          return parsedContextRules;
        }

        const nextEnabled = enabled ?? custom.data.enabled;
        const projectId =
          validScope.data === "project" ? loaded.data.currentProjectId : null;
        if (validScope.data === "project" && !projectId) {
          return ipcError("NOT_FOUND", "Project scope is unavailable");
        }

        const capacityGuard = ensureCustomSkillCapacity({
          db: deps.db,
          scope: validScope.data,
          projectId,
          excludeSkillId: custom.data.id,
        });
        if (!capacityGuard.ok) {
          return capacityGuard;
        }

        const updated = updateCustomSkillRow({
          db: deps.db,
          id: custom.data.id,
          name: validName.data,
          description: validDescription.data,
          promptTemplate: validTemplate.data,
          inputType: validInputType.data,
          contextRules: parsedContextRules.data,
          scope: validScope.data,
          projectId,
          enabled: nextEnabled,
        });
        if (!updated.ok) {
          return updated;
        }

        return {
          ok: true,
          data: {
            id: custom.data.id,
            scope: updated.data.scope,
          },
        };
      }

      if (!scope) {
        return validationError("scope", "scope 不能为空");
      }
      const validScope = requireCustomScope(scope);
      if (!validScope.ok) {
        return validScope;
      }

      const skill = loaded.data.skills.find((s) => s.id === id) ?? null;
      if (!skill) {
        return ipcError("NOT_FOUND", "Skill not found", { id });
      }

      if (skill.scope === "builtin") {
        return ipcError("UNSUPPORTED", "Builtin skills cannot change scope", {
          id,
        });
      }

      if (skill.scope === validScope.data) {
        return { ok: true, data: { id, scope: validScope.data } };
      }

      const srcRoot = scopeRoot({
        scope: skill.scope,
        roots: loaded.data.roots,
      });
      const destRoot = scopeRoot({
        scope: validScope.data,
        roots: loaded.data.roots,
      });
      if (!srcRoot || !destRoot) {
        return ipcError("NOT_FOUND", "Project scope is unavailable", {
          scope: validScope.data,
        });
      }

      const targetRef = toScopeFileRef({
        skill,
        scope: validScope.data,
        srcRoot,
        destRoot,
      });
      if (!targetRef.ok) {
        return targetRef;
      }

      const content = readSkillContent(skill.filePath);
      if (!content.ok) {
        return content;
      }

      const rewrittenContent = rewriteFrontmatterScope({
        content: content.data,
        scope,
      });

      const written = writeSkillContent({
        filePath: targetRef.data.filePath,
        content: rewrittenContent,
      });
      if (!written.ok) {
        return written;
      }

      if (targetRef.data.filePath !== skill.filePath) {
        const removed = removeSkillContent(skill.filePath);
        if (!removed.ok) {
          return removed;
        }
      }

      const reloaded = loadSkillFile({ ref: targetRef.data });
      const enabledMapRes = readEnabledMap(deps.db);
      if (!enabledMapRes.ok) {
        return enabledMapRes;
      }
      const upserted = upsertSkillRows({
        db: deps.db,
        skills: [reloaded],
        enabledMap: enabledMapRes.data,
      });
      if (!upserted.ok) {
        return upserted;
      }

      invalidateSkillRegistryCache();

      deps.logger.info("skill_scope_updated", {
        id,
        from: skill.scope,
        to: validScope.data,
      });
      return { ok: true, data: { id, scope: validScope.data } };
    },

    createCustom: ({
      name,
      description,
      promptTemplate,
      inputType,
      contextRules,
      scope,
      enabled = true,
    }) => {
      const validName = requireTextField("name", name, "name 不能为空");
      if (!validName.ok) {
        return validName;
      }
      const validDescription = requireTextField(
        "description",
        description,
        "description 不能为空",
      );
      if (!validDescription.ok) {
        return validDescription;
      }
      const validTemplate = requireTextField(
        "promptTemplate",
        promptTemplate,
        "promptTemplate 不能为空",
      );
      if (!validTemplate.ok) {
        return validTemplate;
      }
      const validInputType = requireInputType(inputType);
      if (!validInputType.ok) {
        return validInputType;
      }
      const validScope = requireCustomScope(scope);
      if (!validScope.ok) {
        return validScope;
      }
      const parsedContextRules = parseContextRules(contextRules);
      if (!parsedContextRules.ok) {
        return parsedContextRules;
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }
      const projectId =
        validScope.data === "project" ? loaded.data.currentProjectId : null;
      if (validScope.data === "project" && !projectId) {
        return ipcError("NOT_FOUND", "Project scope is unavailable");
      }

      const capacityGuard = ensureCustomSkillCapacity({
        db: deps.db,
        scope: validScope.data,
        projectId,
      });
      if (!capacityGuard.ok) {
        return capacityGuard;
      }

      const inserted = insertCustomSkill({
        db: deps.db,
        id: randomUUID(),
        name: validName.data,
        description: validDescription.data,
        promptTemplate: validTemplate.data,
        inputType: validInputType.data,
        contextRules: parsedContextRules.data,
        scope: validScope.data,
        projectId,
        enabled,
      });
      if (!inserted.ok) {
        return inserted;
      }
      return { ok: true, data: { skill: inserted.data } };
    },

    deleteCustom: ({ id }) => {
      if (id.trim().length === 0) {
        return validationError("id", "id 不能为空");
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }
      const normalizedId = normalizeCustomSkillId(id);
      const custom = readCustomSkillById({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
        id: normalizedId,
      });
      if (!custom.ok) {
        return custom;
      }
      if (!custom.data) {
        return ipcError("NOT_FOUND", "Custom skill not found", {
          id: normalizedId,
        });
      }

      try {
        deps.db
          .prepare("DELETE FROM custom_skills WHERE id = ?")
          .run(custom.data.id);
        return { ok: true, data: { id: custom.data.id, deleted: true } };
      } catch (error) {
        return ipcError(
          "DB_ERROR",
          "Failed to delete custom skill",
          error instanceof Error ? { message: error.message } : { error },
        );
      }
    },

    listCustom: () => {
      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }
      const listed = readCustomSkills({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
      });
      if (!listed.ok) {
        return listed;
      }
      return { ok: true, data: { items: listed.data } };
    },

    resolveForRun: ({ id }) => {
      if (id.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "id is required", {
          fieldName: "id",
        });
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      const customId = normalizeCustomSkillId(id);
      const custom = readCustomSkillById({
        db: deps.db,
        currentProjectId: loaded.data.currentProjectId,
        id: customId,
      });
      if (!custom.ok) {
        return custom;
      }
      if (custom.data) {
        const prompt = {
          system: customPromptSystem({
            name: custom.data.name,
            description: custom.data.description,
            contextRules: custom.data.contextRules,
          }),
          user: custom.data.promptTemplate,
        };

        return {
          ok: true,
          data: {
            skill: {
              id: encodeCustomListId(custom.data.id),
              name: custom.data.name,
              scope: custom.data.scope,
              packageId: "pkg.creonow.custom",
              version: "1.0.0",
              filePath: "",
              valid: true,
              prompt,
              bodyMd: "",
            },
            enabled: custom.data.enabled,
            inputType: custom.data.inputType,
          },
        };
      }

      const ownership = readCustomSkillOwnershipById({
        db: deps.db,
        id: customId,
      });
      if (!ownership.ok) {
        return ownership;
      }
      if (
        ownership.data &&
        ownership.data.scope === "project" &&
        ownership.data.projectId !== loaded.data.currentProjectId
      ) {
        deps.logger.info("skill_scope_violation", {
          skillId: customId,
          requestedProjectId: loaded.data.currentProjectId,
          ownerProjectId: ownership.data.projectId,
        });
        return ipcError(
          "SKILL_SCOPE_VIOLATION",
          "Custom skill is outside current project scope",
          {
            skillId: customId,
            requestedProjectId: loaded.data.currentProjectId,
            ownerProjectId: ownership.data.projectId,
          },
        );
      }

      const skill = loaded.data.skills.find((s) => s.id === id) ?? null;
      if (!skill) {
        return ipcError("NOT_FOUND", "Skill not found", { id });
      }

      const enabled = loaded.data.enabledMap.get(id) ?? true;
      return { ok: true, data: { skill, enabled } };
    },

    isDependencyAvailable: ({ dependencyId }) => {
      const trimmed = dependencyId.trim();
      if (trimmed.length === 0) {
        return ipcError("INVALID_ARGUMENT", "dependencyId is required", {
          fieldName: "dependencyId",
        });
      }

      const loaded = resolveLoaded();
      if (!loaded.ok) {
        return loaded;
      }

      if (trimmed.startsWith("custom:")) {
        const custom = readCustomSkillById({
          db: deps.db,
          currentProjectId: loaded.data.currentProjectId,
          id: normalizeCustomSkillId(trimmed),
        });
        if (!custom.ok) {
          return custom;
        }
        return { ok: true, data: { available: custom.data?.enabled === true } };
      }

      const matched = loaded.data.skills.find(
        (skill) => skill.id === trimmed || leafSkillId(skill.id) === trimmed,
      );
      if (!matched) {
        return { ok: true, data: { available: false } };
      }

      const enabled = loaded.data.enabledMap.get(matched.id) ?? true;
      return { ok: true, data: { available: enabled } };
    },
  };
}
