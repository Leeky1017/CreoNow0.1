import fs from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { redactUserDataPath } from "../../db/paths";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };
import {
  ensureCreonowDirStructure,
  getCreonowRootPath,
} from "../context/contextFs";
import {
  evaluateLifecycleTransition,
  type ProjectLifecycleState,
} from "./projectLifecycleStateMachine";
import {
  resolveTemplateSeedDocuments,
  type ProjectTemplateInput,
} from "./templateService";

export type ProjectInfo = {
  projectId: string;
  rootPath: string;
};

export type ProjectType = "novel" | "screenplay" | "media";
export type ProjectStage = "outline" | "draft" | "revision" | "final";
export type NarrativePerson = "first" | "third-limited" | "third-omniscient";

export type ProjectMetadata = {
  type: ProjectType;
  description: string;
  stage: ProjectStage;
  targetWordCount: number | null;
  targetChapterCount: number | null;
  narrativePerson: NarrativePerson;
  languageStyle: string;
  targetAudience: string;
  defaultSkillSetId: string | null;
  knowledgeGraphId: string | null;
};

export type ProjectListItem = {
  projectId: string;
  name: string;
  rootPath: string;
  type: ProjectType;
  stage: ProjectStage;
  updatedAt: number;
  archivedAt?: number;
};

type ProjectRow = {
  projectId: string;
  name: string;
  rootPath: string;
  type: ProjectType;
  description: string;
  stage: ProjectStage;
  targetWordCount: number | null;
  targetChapterCount: number | null;
  narrativePerson: NarrativePerson;
  languageStyle: string;
  targetAudience: string;
  defaultSkillSetId: string | null;
  knowledgeGraphId: string | null;
  updatedAt: number;
  archivedAt: number | null;
};

type DuplicateDocumentRow = {
  documentId: string;
  title: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
};

type SettingsRow = {
  valueJson: string;
};

export type ProjectService = {
  create: (args: {
    name?: string;
    type?: ProjectType;
    description?: string;
    template?: ProjectTemplateInput;
  }) => ServiceResult<ProjectInfo>;
  createAiAssistDraft: (args: { prompt: string }) => ServiceResult<{
    name: string;
    type: ProjectType;
    description: string;
    chapterOutlines: string[];
    characters: string[];
  }>;
  list: (args?: {
    includeArchived?: boolean;
  }) => ServiceResult<{ items: ProjectListItem[] }>;
  update: (args: {
    projectId: string;
    patch: Partial<ProjectMetadata>;
  }) => ServiceResult<{ updated: true }>;
  stats: () => ServiceResult<{
    total: number;
    active: number;
    archived: number;
  }>;
  getCurrent: () => ServiceResult<ProjectInfo>;
  setCurrent: (args: { projectId: string }) => ServiceResult<ProjectInfo>;
  switchProject: (args: {
    projectId: string;
    fromProjectId: string;
    operatorId: string;
    traceId: string;
  }) => ServiceResult<{ currentProjectId: string; switchedAt: string }>;
  delete: (args: { projectId: string }) => ServiceResult<{ deleted: true }>;
  rename: (args: {
    projectId: string;
    name: string;
  }) => ServiceResult<{ projectId: string; name: string; updatedAt: number }>;
  duplicate: (args: {
    projectId: string;
  }) => ServiceResult<{ projectId: string; rootPath: string; name: string }>;
  archive: (args: { projectId: string; archived: boolean }) => ServiceResult<{
    projectId: string;
    archived: boolean;
    archivedAt?: number;
  }>;
  lifecycleArchive: (args: {
    projectId: string;
    traceId?: string;
  }) => ServiceResult<{
    projectId: string;
    state: ProjectLifecycleState;
    archivedAt?: number;
  }>;
  lifecycleRestore: (args: {
    projectId: string;
    traceId?: string;
  }) => ServiceResult<{
    projectId: string;
    state: ProjectLifecycleState;
  }>;
  lifecyclePurge: (args: {
    projectId: string;
    traceId?: string;
  }) => ServiceResult<{
    projectId: string;
    state: ProjectLifecycleState;
  }>;
  lifecycleGet: (args: {
    projectId: string;
    traceId?: string;
  }) => ServiceResult<{
    projectId: string;
    state: ProjectLifecycleState;
  }>;
};

const SETTINGS_SCOPE = "app" as const;
const CURRENT_PROJECT_ID_KEY = "creonow.project.currentId" as const;
const PROJECT_SETTINGS_SCOPE_PREFIX = "project:" as const;
const CURRENT_DOCUMENT_ID_KEY = "creonow.document.currentId" as const;
const MAX_PROJECT_NAME_LENGTH = 120;
const MAX_PROJECT_COUNT = 2_000;

const PROJECT_TYPE_SET = new Set<ProjectType>(["novel", "screenplay", "media"]);
const PROJECT_STAGE_SET = new Set<ProjectStage>([
  "outline",
  "draft",
  "revision",
  "final",
]);
const NARRATIVE_PERSON_SET = new Set<NarrativePerson>([
  "first",
  "third-limited",
  "third-omniscient",
]);

function nowTs(): number {
  return Date.now();
}

/**
 * Compute the app-managed project root path.
 *
 * Why: V1 prefers a userData-managed root for deterministic Windows E2E and
 * to avoid permissions issues with arbitrary paths.
 */
function getProjectRootPath(userDataDir: string, projectId: string): string {
  return path.join(userDataDir, "projects", projectId);
}

/**
 * Normalize and validate a project name.
 *
 * Why: dashboard rename/create must reject empty and oversized labels.
 */
function normalizeProjectName(
  name: string | undefined,
  fallback: string,
): ServiceResult<string> {
  const trimmed = name?.trim() ?? "";
  const normalized = trimmed.length > 0 ? trimmed : fallback;

  if (normalized.trim().length === 0) {
    return ipcError("INVALID_ARGUMENT", "name is required");
  }
  if (normalized.length > MAX_PROJECT_NAME_LENGTH) {
    return ipcError(
      "INVALID_ARGUMENT",
      `name too long (max ${MAX_PROJECT_NAME_LENGTH})`,
    );
  }

  return { ok: true, data: normalized };
}

/**
 * Normalize project type with a deterministic default.
 */
function normalizeProjectType(
  type: string | undefined,
): ServiceResult<ProjectType> {
  if (!type) {
    return { ok: true, data: "novel" };
  }
  if (PROJECT_TYPE_SET.has(type as ProjectType)) {
    return { ok: true, data: type as ProjectType };
  }
  return ipcError("PROJECT_METADATA_INVALID_ENUM", "Invalid project type", {
    field: "type",
    value: type,
  });
}

function normalizeProjectStage(
  stage: string | undefined,
): ServiceResult<ProjectStage> {
  if (!stage) {
    return { ok: true, data: "outline" };
  }
  if (PROJECT_STAGE_SET.has(stage as ProjectStage)) {
    return { ok: true, data: stage as ProjectStage };
  }
  return ipcError("PROJECT_METADATA_INVALID_ENUM", "Invalid project stage", {
    field: "stage",
    value: stage,
  });
}

function normalizeNarrativePerson(
  value: string | undefined,
): ServiceResult<NarrativePerson> {
  if (!value) {
    return { ok: true, data: "first" };
  }
  if (NARRATIVE_PERSON_SET.has(value as NarrativePerson)) {
    return { ok: true, data: value as NarrativePerson };
  }
  return ipcError("PROJECT_METADATA_INVALID_ENUM", "Invalid narrative person", {
    field: "narrativePerson",
    value,
  });
}

function createDefaultProjectMetadata(args: {
  type?: string;
  description?: string;
}): ServiceResult<ProjectMetadata> {
  const normalizedType = normalizeProjectType(args.type);
  if (!normalizedType.ok) {
    return normalizedType;
  }

  return {
    ok: true,
    data: {
      type: normalizedType.data,
      description: args.description?.trim() ?? "",
      stage: "outline",
      targetWordCount: null,
      targetChapterCount: null,
      narrativePerson: "first",
      languageStyle: "",
      targetAudience: "",
      defaultSkillSetId: null,
      knowledgeGraphId: null,
    },
  };
}

function hashJson(json: string): string {
  return createHash("sha256").update(json, "utf8").digest("hex");
}

function buildDocumentContentJson(contentMd: string): string {
  const text = contentMd.trim();
  if (text.length === 0) {
    return JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
  }
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
}

/**
 * Compute a settings scope for project-scoped settings.
 *
 * Why: duplicated project should preserve current document pointer if possible.
 */
function getProjectSettingsScope(projectId: string): string {
  return `${PROJECT_SETTINGS_SCOPE_PREFIX}${projectId}`;
}

/**
 * Read the current projectId from settings.
 *
 * Why: the current project must persist across restarts for a stable local entry.
 */
function readCurrentProjectId(db: Database.Database): ServiceResult<string> {
  try {
    const row = db
      .prepare<
        [string, string],
        { value_json: string }
      >("SELECT value_json FROM settings WHERE scope = ? AND key = ?")
      .get(SETTINGS_SCOPE, CURRENT_PROJECT_ID_KEY);
    if (!row) {
      return ipcError("NOT_FOUND", "No current project");
    }
    const parsed: unknown = JSON.parse(row.value_json);
    if (typeof parsed !== "string" || parsed.length === 0) {
      return ipcError("DB_ERROR", "Invalid current project setting");
    }
    return { ok: true, data: parsed };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to read current project setting",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function writeCurrentProjectId(
  db: Database.Database,
  projectId: string,
): ServiceResult<true> {
  try {
    const ts = nowTs();
    db.prepare(
      "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
    ).run(
      SETTINGS_SCOPE,
      CURRENT_PROJECT_ID_KEY,
      JSON.stringify(projectId),
      ts,
    );
    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to persist current project",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function clearCurrentProjectId(db: Database.Database): ServiceResult<true> {
  try {
    db.prepare("DELETE FROM settings WHERE scope = ? AND key = ?").run(
      SETTINGS_SCOPE,
      CURRENT_PROJECT_ID_KEY,
    );
    return { ok: true, data: true };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to clear current project",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

function getProjectById(
  db: Database.Database,
  projectId: string,
): ServiceResult<ProjectRow> {
  try {
    const row = db
      .prepare<
        [string],
        {
          projectId: string;
          name: string;
          rootPath: string;
          type: ProjectType;
          description: string;
          stage: ProjectStage;
          targetWordCount: number | null;
          targetChapterCount: number | null;
          narrativePerson: NarrativePerson;
          languageStyle: string;
          targetAudience: string;
          defaultSkillSetId: string | null;
          knowledgeGraphId: string | null;
          updatedAt: number;
          archivedAt: number | null;
        }
      >(
        "SELECT project_id as projectId, name, root_path as rootPath, type, description, stage, target_word_count as targetWordCount, target_chapter_count as targetChapterCount, narrative_person as narrativePerson, language_style as languageStyle, target_audience as targetAudience, default_skill_set_id as defaultSkillSetId, knowledge_graph_id as knowledgeGraphId, updated_at as updatedAt, archived_at as archivedAt FROM projects WHERE project_id = ?",
      )
      .get(projectId);
    if (!row) {
      return ipcError("NOT_FOUND", "Project not found", { projectId });
    }
    return { ok: true, data: row };
  } catch (error) {
    return ipcError(
      "DB_ERROR",
      "Failed to load project",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Derive lifecycle state from the persisted row shape.
 *
 * Why: PM-2 lifecycle transitions use `archived_at` as the persisted source.
 */
function deriveLifecycleState(
  row: Pick<ProjectRow, "archivedAt">,
): ProjectLifecycleState {
  return row.archivedAt == null ? "active" : "archived";
}

/**
 * Remove a project root directory from disk.
 *
 * Why: lifecycle purge must clear project files after archived->deleted.
 */
function defaultRemoveProjectRoot(rootPath: string): void {
  if (!fs.existsSync(rootPath)) {
    return;
  }
  fs.rmSync(rootPath, { recursive: true, force: false });
}

/**
 * Copy `.creonow` metadata directory from source project to duplicate project.
 *
 * Why: duplicate should preserve authoring context when source metadata exists,
 * but metadata copy failures must not block duplicate core behavior.
 */
function copyCreonowDirBestEffort(args: {
  sourceRootPath: string;
  targetRootPath: string;
  logger: Logger;
}): void {
  const sourceCreonowPath = getCreonowRootPath(args.sourceRootPath);
  const targetCreonowPath = getCreonowRootPath(args.targetRootPath);

  if (!fs.existsSync(sourceCreonowPath)) {
    return;
  }

  try {
    fs.cpSync(sourceCreonowPath, targetCreonowPath, {
      recursive: true,
      force: true,
      errorOnExist: false,
    });
  } catch (error) {
    args.logger.error("project_duplicate_copy_creonow_failed", {
      code: "IO_ERROR",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Create a project service backed by SQLite (SSOT).
 */
export function createProjectService(args: {
  db: Database.Database;
  userDataDir: string;
  logger: Logger;
  now?: () => number;
  switchKnowledgeGraphContext?: (args: {
    fromProjectId: string;
    toProjectId: string;
    traceId: string;
  }) => void;
  switchMemoryContext?: (args: {
    fromProjectId: string;
    toProjectId: string;
    traceId: string;
  }) => void;
  removeProjectRoot?: (rootPath: string) => void;
}): ProjectService {
  const now = args.now ?? nowTs;
  const switchKnowledgeGraphContext =
    args.switchKnowledgeGraphContext ?? (() => {});
  const switchMemoryContext = args.switchMemoryContext ?? (() => {});
  const removeProjectRoot = args.removeProjectRoot ?? defaultRemoveProjectRoot;

  const service: ProjectService = {
    create: ({ name, type, description, template }) => {
      const projectId = randomUUID();
      const rootPath = getProjectRootPath(args.userDataDir, projectId);

      const normalized = normalizeProjectName(name, "Untitled");
      if (!normalized.ok) {
        return normalized;
      }

      const metadata = createDefaultProjectMetadata({ type, description });
      if (!metadata.ok) {
        return metadata;
      }

      try {
        const countRow = args.db
          .prepare<
            [],
            { count: number }
          >("SELECT COUNT(*) as count FROM projects WHERE archived_at IS NULL")
          .get();
        if ((countRow?.count ?? 0) >= MAX_PROJECT_COUNT) {
          return ipcError("PROJECT_CAPACITY_EXCEEDED", "项目数量已达上限", {
            limit: MAX_PROJECT_COUNT,
          });
        }
      } catch (error) {
        args.logger.error("project_count_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to check project capacity");
      }

      const ensured = ensureCreonowDirStructure(rootPath);
      if (!ensured.ok) {
        return ensured;
      }

      const templateDocuments = resolveTemplateSeedDocuments(template);
      if (!templateDocuments.ok) {
        return ipcError("INVALID_ARGUMENT", templateDocuments.error.message, {
          field: templateDocuments.error.field,
        });
      }

      const initialDocuments =
        templateDocuments.data.length > 0
          ? templateDocuments.data
          : [{ title: "Untitled Chapter", contentMd: "" }];

      const ts = now();

      try {
        args.db.transaction(() => {
          args.db
            .prepare(
              "INSERT INTO projects (project_id, name, root_path, type, description, stage, target_word_count, target_chapter_count, narrative_person, language_style, target_audience, default_skill_set_id, knowledge_graph_id, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
            )
            .run(
              projectId,
              normalized.data,
              rootPath,
              metadata.data.type,
              metadata.data.description,
              metadata.data.stage,
              metadata.data.targetWordCount,
              metadata.data.targetChapterCount,
              metadata.data.narrativePerson,
              metadata.data.languageStyle,
              metadata.data.targetAudience,
              metadata.data.defaultSkillSetId,
              metadata.data.knowledgeGraphId,
              ts,
              ts,
            );

          let currentDocumentId = "";
          for (const document of initialDocuments) {
            const documentId = randomUUID();
            const contentJson = buildDocumentContentJson(document.contentMd);
            const contentText = document.contentMd.trim();

            args.db
              .prepare(
                "INSERT INTO documents (document_id, project_id, title, content_json, content_text, content_md, content_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              )
              .run(
                documentId,
                projectId,
                document.title,
                contentJson,
                contentText,
                document.contentMd,
                hashJson(contentJson),
                ts,
                ts,
              );

            if (currentDocumentId.length === 0) {
              currentDocumentId = documentId;
            }
          }

          args.db
            .prepare(
              "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
            )
            .run(
              getProjectSettingsScope(projectId),
              CURRENT_DOCUMENT_ID_KEY,
              JSON.stringify(currentDocumentId),
              ts,
            );
        })();

        args.logger.info("project_created", {
          project_id: projectId,
          root_path: redactUserDataPath(args.userDataDir, rootPath),
        });

        return { ok: true, data: { projectId, rootPath } };
      } catch (error) {
        args.logger.error("project_create_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to create project");
      }
    },

    createAiAssistDraft: ({ prompt }) => {
      const trimmed = prompt.trim();
      if (trimmed.length === 0) {
        return ipcError("INVALID_ARGUMENT", "prompt is required");
      }

      if (
        trimmed.includes("限流") ||
        trimmed.toLowerCase().includes("timeout") ||
        trimmed.includes("超时")
      ) {
        return ipcError("RATE_LIMITED", "AI assist mock rate limited");
      }

      const draftType: ProjectType =
        trimmed.includes("剧本") || trimmed.toLowerCase().includes("screenplay")
          ? "screenplay"
          : trimmed.includes("自媒体") ||
              trimmed.toLowerCase().includes("media")
            ? "media"
            : "novel";

      return {
        ok: true,
        data: {
          name: "AI 辅助项目",
          type: draftType,
          description: trimmed,
          chapterOutlines: ["第一章", "第二章", "第三章", "第四章", "第五章"],
          characters: ["主角", "配角", "反派"],
        },
      };
    },

    list: ({ includeArchived = false } = {}) => {
      try {
        const whereClause = includeArchived ? "" : "WHERE archived_at IS NULL";
        const rows = args.db
          .prepare<
            [],
            ProjectRow
          >(`SELECT project_id as projectId, name, root_path as rootPath, type, description, stage, target_word_count as targetWordCount, target_chapter_count as targetChapterCount, narrative_person as narrativePerson, language_style as languageStyle, target_audience as targetAudience, default_skill_set_id as defaultSkillSetId, knowledge_graph_id as knowledgeGraphId, updated_at as updatedAt, archived_at as archivedAt FROM projects ${whereClause} ORDER BY updated_at DESC, project_id ASC`)
          .all();
        const items: ProjectListItem[] = rows.map((row) => ({
          projectId: row.projectId,
          name: row.name,
          rootPath: row.rootPath,
          type: row.type,
          stage: row.stage,
          updatedAt: row.updatedAt,
          ...(row.archivedAt == null ? {} : { archivedAt: row.archivedAt }),
        }));
        return { ok: true, data: { items } };
      } catch (error) {
        args.logger.error("project_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to list projects");
      }
    },

    update: ({ projectId, patch }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        return project;
      }

      const stage = normalizeProjectStage(patch.stage);
      if (!stage.ok) {
        return stage;
      }
      const type = normalizeProjectType(patch.type);
      if (!type.ok) {
        return type;
      }
      const narrativePerson = normalizeNarrativePerson(patch.narrativePerson);
      if (!narrativePerson.ok) {
        return narrativePerson;
      }

      const next: ProjectMetadata = {
        type: patch.type ?? project.data.type,
        description: patch.description ?? project.data.description,
        stage: patch.stage ?? project.data.stage,
        targetWordCount:
          patch.targetWordCount === undefined
            ? project.data.targetWordCount
            : patch.targetWordCount,
        targetChapterCount:
          patch.targetChapterCount === undefined
            ? project.data.targetChapterCount
            : patch.targetChapterCount,
        narrativePerson: patch.narrativePerson ?? project.data.narrativePerson,
        languageStyle: patch.languageStyle ?? project.data.languageStyle,
        targetAudience: patch.targetAudience ?? project.data.targetAudience,
        defaultSkillSetId:
          patch.defaultSkillSetId === undefined
            ? project.data.defaultSkillSetId
            : patch.defaultSkillSetId,
        knowledgeGraphId:
          patch.knowledgeGraphId === undefined
            ? project.data.knowledgeGraphId
            : patch.knowledgeGraphId,
      };

      if (!PROJECT_TYPE_SET.has(next.type)) {
        return ipcError(
          "PROJECT_METADATA_INVALID_ENUM",
          "Invalid project type",
          {
            field: "type",
            value: next.type,
          },
        );
      }
      if (!PROJECT_STAGE_SET.has(next.stage)) {
        return ipcError(
          "PROJECT_METADATA_INVALID_ENUM",
          "Invalid project stage",
          { field: "stage", value: next.stage },
        );
      }
      if (!NARRATIVE_PERSON_SET.has(next.narrativePerson)) {
        return ipcError(
          "PROJECT_METADATA_INVALID_ENUM",
          "Invalid narrative person",
          { field: "narrativePerson", value: next.narrativePerson },
        );
      }

      const ts = now();
      try {
        args.db
          .prepare(
            "UPDATE projects SET type = ?, description = ?, stage = ?, target_word_count = ?, target_chapter_count = ?, narrative_person = ?, language_style = ?, target_audience = ?, default_skill_set_id = ?, knowledge_graph_id = ?, updated_at = ? WHERE project_id = ?",
          )
          .run(
            next.type,
            next.description,
            next.stage,
            next.targetWordCount,
            next.targetChapterCount,
            next.narrativePerson,
            next.languageStyle,
            next.targetAudience,
            next.defaultSkillSetId,
            next.knowledgeGraphId,
            ts,
            projectId,
          );

        return { ok: true, data: { updated: true } };
      } catch (error) {
        args.logger.error("project_update_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to update project metadata");
      }
    },

    stats: () => {
      try {
        const row = args.db
          .prepare<
            [],
            { total: number; active: number; archived: number }
          >("SELECT COUNT(*) as total, SUM(CASE WHEN archived_at IS NULL THEN 1 ELSE 0 END) as active, SUM(CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END) as archived FROM projects")
          .get();

        return {
          ok: true,
          data: {
            total: row?.total ?? 0,
            active: row?.active ?? 0,
            archived: row?.archived ?? 0,
          },
        };
      } catch (error) {
        args.logger.error("project_stats_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to load project stats");
      }
    },

    getCurrent: () => {
      const currentId = readCurrentProjectId(args.db);
      if (!currentId.ok) {
        return currentId;
      }

      const project = getProjectById(args.db, currentId.data);
      if (!project.ok) {
        if (project.error.code === "NOT_FOUND") {
          void clearCurrentProjectId(args.db);
        }
        return project;
      }

      return {
        ok: true,
        data: {
          projectId: project.data.projectId,
          rootPath: project.data.rootPath,
        },
      };
    },

    setCurrent: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        return project;
      }

      const persisted = writeCurrentProjectId(args.db, projectId);
      if (!persisted.ok) {
        return persisted;
      }

      try {
        args.db
          .prepare("UPDATE projects SET updated_at = ? WHERE project_id = ?")
          .run(now(), projectId);
      } catch (error) {
        args.logger.error("project_touch_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }

      args.logger.info("project_set_current", { project_id: projectId });
      return {
        ok: true,
        data: {
          projectId: project.data.projectId,
          rootPath: project.data.rootPath,
        },
      };
    },

    switchProject: ({ projectId, fromProjectId, operatorId, traceId }) => {
      if (projectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required",
          undefined,
          { traceId },
        );
      }
      if (fromProjectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "fromProjectId is required",
          undefined,
          { traceId },
        );
      }
      if (operatorId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "operatorId is required",
          undefined,
          { traceId },
        );
      }

      const nextProject = getProjectById(args.db, projectId);
      if (!nextProject.ok) {
        return nextProject;
      }

      const persisted = writeCurrentProjectId(args.db, projectId);
      if (!persisted.ok) {
        return persisted;
      }

      const ts = now();

      try {
        args.db
          .prepare("UPDATE projects SET updated_at = ? WHERE project_id = ?")
          .run(ts, projectId);
      } catch (error) {
        args.logger.error("project_switch_touch_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
      }

      try {
        switchKnowledgeGraphContext({
          fromProjectId,
          toProjectId: projectId,
          traceId,
        });
      } catch (error) {
        args.logger.error("project_switch_kg_hook_failed", {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
      }

      try {
        switchMemoryContext({
          fromProjectId,
          toProjectId: projectId,
          traceId,
        });
      } catch (error) {
        args.logger.error("project_switch_memory_hook_failed", {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
      }

      args.logger.info("project_switched", {
        from_project_id: fromProjectId,
        to_project_id: projectId,
        operator_id: operatorId,
        trace_id: traceId,
      });

      return {
        ok: true,
        data: {
          currentProjectId: nextProject.data.projectId,
          switchedAt: new Date(ts).toISOString(),
        },
      };
    },

    lifecycleGet: ({ projectId, traceId }) => {
      if (projectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required",
          undefined,
          { traceId },
        );
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        return project;
      }

      return {
        ok: true,
        data: {
          projectId,
          state: deriveLifecycleState(project.data),
        },
      };
    },

    lifecycleArchive: ({ projectId, traceId }) => {
      if (projectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required",
          undefined,
          { traceId },
        );
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        return project;
      }

      const currentState = deriveLifecycleState(project.data);
      const transition = evaluateLifecycleTransition({
        from: currentState,
        to: "archived",
        traceId,
      });
      if (!transition.ok) {
        return { ok: false, error: transition.error };
      }

      if (project.data.archivedAt !== null) {
        return {
          ok: true,
          data: {
            projectId,
            state: "archived",
            archivedAt: project.data.archivedAt,
          },
        };
      }

      const ts = now();
      try {
        args.db
          .prepare(
            "UPDATE projects SET archived_at = ?, updated_at = ? WHERE project_id = ?",
          )
          .run(ts, ts, projectId);
      } catch (error) {
        args.logger.error("project_lifecycle_archive_failed", {
          code: "PROJECT_LIFECYCLE_WRITE_FAILED",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
        return ipcError(
          "PROJECT_LIFECYCLE_WRITE_FAILED",
          "生命周期状态写入失败",
          {
            transition: "active->archived",
            projectId,
          },
          { traceId },
        );
      }

      return {
        ok: true,
        data: {
          projectId,
          state: "archived",
          archivedAt: ts,
        },
      };
    },

    lifecycleRestore: ({ projectId, traceId }) => {
      if (projectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required",
          undefined,
          { traceId },
        );
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        return project;
      }

      const currentState = deriveLifecycleState(project.data);
      const transition = evaluateLifecycleTransition({
        from: currentState,
        to: "active",
        traceId,
      });
      if (!transition.ok) {
        return { ok: false, error: transition.error };
      }

      if (project.data.archivedAt === null) {
        return {
          ok: true,
          data: {
            projectId,
            state: "active",
          },
        };
      }

      const ts = now();
      try {
        args.db
          .prepare(
            "UPDATE projects SET archived_at = NULL, updated_at = ? WHERE project_id = ?",
          )
          .run(ts, projectId);
      } catch (error) {
        args.logger.error("project_lifecycle_restore_failed", {
          code: "PROJECT_LIFECYCLE_WRITE_FAILED",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
        return ipcError(
          "PROJECT_LIFECYCLE_WRITE_FAILED",
          "生命周期状态写入失败",
          {
            transition: "archived->active",
            projectId,
          },
          { traceId },
        );
      }

      return {
        ok: true,
        data: {
          projectId,
          state: "active",
        },
      };
    },

    lifecyclePurge: ({ projectId, traceId }) => {
      if (projectId.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required",
          undefined,
          { traceId },
        );
      }

      const project = getProjectById(args.db, projectId);
      if (!project.ok) {
        if (project.error.code === "NOT_FOUND") {
          return ipcError("NOT_FOUND", "项目已删除", { projectId }, { traceId });
        }
        return project;
      }

      const currentState = deriveLifecycleState(project.data);
      const transition = evaluateLifecycleTransition({
        from: currentState,
        to: "deleted",
        traceId,
      });
      if (!transition.ok) {
        return { ok: false, error: transition.error };
      }

      try {
        removeProjectRoot(project.data.rootPath);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err?.code === "EACCES" || err?.code === "EPERM") {
          args.logger.error("project_lifecycle_purge_permission_denied", {
            code: "PROJECT_PURGE_PERMISSION_DENIED",
            message: err.message,
            trace_id: traceId,
            project_id: projectId,
          });
          return ipcError(
            "PROJECT_PURGE_PERMISSION_DENIED",
            "删除失败，路径无写权限",
            { projectId, rootPath: project.data.rootPath },
            { traceId },
          );
        }

        args.logger.error("project_lifecycle_purge_io_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
        return ipcError("IO_ERROR", "Failed to remove project files", { projectId }, {
          traceId,
        });
      }

      try {
        const result = args.db
          .prepare("DELETE FROM projects WHERE project_id = ?")
          .run(projectId);
        if (result.changes === 0) {
          return ipcError("NOT_FOUND", "项目已删除", { projectId }, { traceId });
        }
      } catch (error) {
        args.logger.error("project_lifecycle_purge_db_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
          trace_id: traceId,
          project_id: projectId,
        });
        return ipcError("DB_ERROR", "Failed to purge project", { projectId }, {
          traceId,
        });
      }

      const currentId = readCurrentProjectId(args.db);
      if (currentId.ok && currentId.data === projectId) {
        void clearCurrentProjectId(args.db);
      }

      args.logger.info("project_lifecycle_purged", {
        project_id: projectId,
        trace_id: traceId,
      });

      return {
        ok: true,
        data: {
          projectId,
          state: "deleted",
        },
      };
    },

    delete: ({ projectId }) => {
      const purgeRes = service.lifecyclePurge({
        projectId,
        traceId: randomUUID(),
      });
      if (!purgeRes.ok) {
        return purgeRes;
      }
      return { ok: true, data: { deleted: true } };
    },

    rename: ({ projectId, name }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      const normalized = normalizeProjectName(name, "");
      if (!normalized.ok) {
        return normalized;
      }

      const ts = now();
      try {
        const res = args.db
          .prepare<
            [string, number, string]
          >("UPDATE projects SET name = ?, updated_at = ? WHERE project_id = ?")
          .run(normalized.data, ts, projectId);
        if (res.changes === 0) {
          return ipcError("NOT_FOUND", "Project not found", { projectId });
        }

        args.logger.info("project_renamed", {
          project_id: projectId,
        });
        return {
          ok: true,
          data: { projectId, name: normalized.data, updatedAt: ts },
        };
      } catch (error) {
        args.logger.error("project_rename_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to rename project");
      }
    },

    duplicate: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      const sourceProject = getProjectById(args.db, projectId);
      if (!sourceProject.ok) {
        return sourceProject;
      }

      const duplicatedProjectId = randomUUID();
      const duplicatedRootPath = getProjectRootPath(
        args.userDataDir,
        duplicatedProjectId,
      );

      const duplicatedNameBase = sourceProject.data.name.trim().length
        ? sourceProject.data.name
        : "Untitled";
      const duplicatedNameRes = normalizeProjectName(
        `${duplicatedNameBase} (Copy)`,
        "Untitled (Copy)",
      );
      if (!duplicatedNameRes.ok) {
        return duplicatedNameRes;
      }

      const ensured = ensureCreonowDirStructure(duplicatedRootPath);
      if (!ensured.ok) {
        return ensured;
      }

      const ts = now();
      let copiedDocuments = 0;

      try {
        args.db.transaction(() => {
          args.db
            .prepare(
              "INSERT INTO projects (project_id, name, root_path, type, description, stage, target_word_count, target_chapter_count, narrative_person, language_style, target_audience, default_skill_set_id, knowledge_graph_id, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)",
            )
            .run(
              duplicatedProjectId,
              duplicatedNameRes.data,
              duplicatedRootPath,
              sourceProject.data.type,
              sourceProject.data.description,
              sourceProject.data.stage,
              sourceProject.data.targetWordCount,
              sourceProject.data.targetChapterCount,
              sourceProject.data.narrativePerson,
              sourceProject.data.languageStyle,
              sourceProject.data.targetAudience,
              sourceProject.data.defaultSkillSetId,
              sourceProject.data.knowledgeGraphId,
              ts,
              ts,
            );

          const sourceDocuments = args.db
            .prepare<
              [string],
              DuplicateDocumentRow
            >("SELECT document_id as documentId, title, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM documents WHERE project_id = ? ORDER BY updated_at DESC, document_id ASC")
            .all(projectId);

          const documentIdMap = new Map<string, string>();

          for (const sourceDocument of sourceDocuments) {
            const duplicatedDocumentId = randomUUID();
            documentIdMap.set(sourceDocument.documentId, duplicatedDocumentId);

            args.db
              .prepare(
                "INSERT INTO documents (document_id, project_id, title, content_json, content_text, content_md, content_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              )
              .run(
                duplicatedDocumentId,
                duplicatedProjectId,
                sourceDocument.title,
                sourceDocument.contentJson,
                sourceDocument.contentText,
                sourceDocument.contentMd,
                sourceDocument.contentHash,
                ts,
                ts,
              );
          }

          copiedDocuments = sourceDocuments.length;

          const sourceCurrentDocument = args.db
            .prepare<
              [string, string],
              SettingsRow
            >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
            .get(getProjectSettingsScope(projectId), CURRENT_DOCUMENT_ID_KEY);

          if (sourceCurrentDocument) {
            const parsedCurrent: unknown = JSON.parse(
              sourceCurrentDocument.valueJson,
            );
            const sourceCurrentDocumentId =
              typeof parsedCurrent === "string" ? parsedCurrent : null;
            if (sourceCurrentDocumentId) {
              const duplicatedCurrentDocumentId = documentIdMap.get(
                sourceCurrentDocumentId,
              );
              if (duplicatedCurrentDocumentId) {
                args.db
                  .prepare(
                    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
                  )
                  .run(
                    getProjectSettingsScope(duplicatedProjectId),
                    CURRENT_DOCUMENT_ID_KEY,
                    JSON.stringify(duplicatedCurrentDocumentId),
                    ts,
                  );
              }
            }
          }
        })();
      } catch (error) {
        args.logger.error("project_duplicate_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to duplicate project");
      }

      copyCreonowDirBestEffort({
        sourceRootPath: sourceProject.data.rootPath,
        targetRootPath: duplicatedRootPath,
        logger: args.logger,
      });

      args.logger.info("project_duplicated", {
        project_id: projectId,
        new_project_id: duplicatedProjectId,
        copied_documents: copiedDocuments,
      });

      return {
        ok: true,
        data: {
          projectId: duplicatedProjectId,
          rootPath: duplicatedRootPath,
          name: duplicatedNameRes.data,
        },
      };
    },

    archive: ({ projectId, archived }) => {
      if (archived) {
        const res = service.lifecycleArchive({
          projectId,
          traceId: randomUUID(),
        });
        if (!res.ok) {
          return res;
        }
        return {
          ok: true,
          data: {
            projectId: res.data.projectId,
            archived: true,
            archivedAt: res.data.archivedAt,
          },
        };
      }

      const restored = service.lifecycleRestore({
        projectId,
        traceId: randomUUID(),
      });
      if (!restored.ok) {
        return restored;
      }
      return {
        ok: true,
        data: {
          projectId: restored.data.projectId,
          archived: false,
        },
      };
    },
  };

  return service;
}
