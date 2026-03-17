import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { createMemoryService } from "../../services/memory/memoryService";

type MemoryRow = {
  memoryId: string;
  type: string;
  scope: string;
  projectId: string | null;
  documentId: string | null;
  origin: string;
  sourceRef: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

type SettingsRow = {
  scope: string;
  key: string;
  valueJson: string;
};

type LogEntry = {
  event: string;
  data: Record<string, unknown> | undefined;
};

function createLogger(args: {
  warnLogs: LogEntry[];
  errorLogs: LogEntry[];
}): Logger & { warn: (event: string, data?: Record<string, unknown>) => void } {
  return {
    logPath: "<test>",
    info: () => {},
    warn: (event, data) => {
      args.warnLogs.push({ event, data });
    },
    error: (event, data) => {
      args.errorLogs.push({ event, data });
    },
  };
}

function cloneMemoryRow(row: MemoryRow): MemoryRow {
  return {
    memoryId: row.memoryId,
    type: row.type,
    scope: row.scope,
    projectId: row.projectId,
    documentId: row.documentId,
    origin: row.origin,
    sourceRef: row.sourceRef,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function createDbStub(args?: {
  memories?: MemoryRow[];
  settings?: SettingsRow[];
  loadExtensionFails?: boolean;
}): Database.Database {
  const memories = [...(args?.memories ?? [])];
  const settings = [...(args?.settings ?? [])];
  const loadExtensionFails = args?.loadExtensionFails ?? true;

  const db = {
    prepare: (sql: string) => {
      if (sql.includes("FROM settings WHERE scope = ? AND key = ?")) {
        return {
          get: (scope: string, key: string) => {
            const row = settings.find((item) => {
              return item.scope === scope && item.key === key;
            });
            if (!row) {
              return undefined;
            }
            return { valueJson: row.valueJson };
          },
        };
      }

      if (
        sql.includes("FROM user_memory") &&
        sql.includes("deleted_at IS NULL")
      ) {
        return {
          all: (...params: unknown[]) => {
            if (params.length === 0) {
              return memories
                .filter((m) => m.scope === "global")
                .map(cloneMemoryRow);
            }
            if (params.length === 1) {
              const projectId = params[0] as string;
              return memories
                .filter((m) => {
                  return (
                    m.scope === "global" ||
                    (m.scope === "project" && m.projectId === projectId)
                  );
                })
                .map(cloneMemoryRow);
            }

            const projectId = params[0] as string;
            const documentId = params[2] as string;
            return memories
              .filter((m) => {
                return (
                  m.scope === "global" ||
                  (m.scope === "project" && m.projectId === projectId) ||
                  (m.scope === "document" &&
                    m.projectId === projectId &&
                    m.documentId === documentId)
                );
              })
              .map(cloneMemoryRow);
          },
        };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
    loadExtension: () => {
      if (loadExtensionFails) {
        throw new Error("sqlite-vec unavailable");
      }
    },
  } as unknown as Database.Database;

  return db;
}

const memories: MemoryRow[] = [
  {
    memoryId: "project-1",
    type: "preference",
    scope: "project",
    projectId: "proj-1",
    documentId: null,
    origin: "learned",
    sourceRef: null,
    content: "偏好短句",
    createdAt: 10,
    updatedAt: 100,
    deletedAt: null,
  },
];

// Scenarios: AUD-C3-S8 + AUD-C3-S9
{
  const warnLogs: LogEntry[] = [];
  const errorLogs: LogEntry[] = [];
  const logger = createLogger({ warnLogs, errorLogs });

  const service = createMemoryService({
    db: createDbStub({
      loadExtensionFails: false,
      settings: [
        {
          scope: "app",
          key: "creonow.memory.injectionEnabled",
          valueJson: "true",
        },
        {
          scope: "app",
          key: "creonow.user_memory_vec.dimension",
          valueJson: "1024",
        },
      ],
      memories,
    }),
    logger,
    degradationEscalationThreshold: 3,
  } as never);

  for (let i = 0; i < 3; i += 1) {
    const result = service.previewInjection({
      projectId: "proj-1",
      queryText: "偏好短句",
    });

    assert.equal(result.ok, true);
    if (!result.ok) {
      throw new Error("AUD-C3-S8: expected deterministic degradation fallback");
    }
    assert.equal(result.data.mode, "deterministic");
    assert.equal(result.data.diagnostics?.degradedFrom, "semantic");
  }

  const degradeWarn = warnLogs.find(
    (entry) => entry.event === "memory_service_degradation",
  );
  assert.ok(degradeWarn, "AUD-C3-S8: expected memory_service_degradation warn");
  assert.equal(degradeWarn?.data?.module, "memory-system");
  assert.equal(degradeWarn?.data?.projectId, "proj-1");

  const escalate = errorLogs.find(
    (entry) => entry.event === "memory_service_degradation_escalation",
  );
  assert.ok(escalate, "AUD-C3-S9: expected memory degradation escalation log");
  assert.equal(escalate?.data?.count, 3);
}

console.log(
  "memory-service-degradation-telemetry.test.ts: all assertions passed",
);
