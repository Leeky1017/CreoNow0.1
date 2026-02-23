import { createRequire } from "node:module";

import type Database from "better-sqlite3";

export type DbExecutionRole = "main" | "compute" | "data";

export type DbWriteExecutionResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        code: "DB_READONLY_ROLE" | "DB_WRITE_FAILED";
        message: string;
      };
    };

const READ_ONLY_ROLES = new Set<DbExecutionRole>(["main", "compute"]);
const require = createRequire(import.meta.url);
type BetterSqlite3Ctor = new (
  filename: string,
  options?: Database.Options,
) => Database.Database;

export type DbWriteStatementParams =
  | readonly unknown[]
  | Record<string, unknown>
  | undefined;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "unknown_db_write_error";
}

function runWithParams(args: {
  statement: Database.Statement;
  params: DbWriteStatementParams;
}): Database.RunResult {
  if (args.params === undefined) {
    return args.statement.run();
  }
  if (Array.isArray(args.params)) {
    return args.statement.run(...args.params);
  }
  return args.statement.run(args.params);
}

export function openUtilityProcessDb(args: {
  dbPath: string;
  role: DbExecutionRole;
  fileMustExist?: boolean;
}): Database.Database {
  const BetterSqlite3 = require("better-sqlite3") as BetterSqlite3Ctor;
  const readonly = READ_ONLY_ROLES.has(args.role);
  const db = new BetterSqlite3(args.dbPath, {
    readonly,
    fileMustExist: args.fileMustExist ?? readonly,
  });

  if (!readonly) {
    db.pragma("journal_mode = WAL");
  }

  return db;
}

export function executeRoleScopedWrite(args: {
  role: DbExecutionRole;
  db: Database.Database;
  sql: string;
  params?: DbWriteStatementParams;
}): DbWriteExecutionResult<Database.RunResult> {
  if (READ_ONLY_ROLES.has(args.role)) {
    return {
      ok: false,
      error: {
        code: "DB_READONLY_ROLE",
        message: `${args.role} process is read-only; only data process can write`,
      },
    };
  }

  try {
    const statement = args.db.prepare(args.sql);
    return {
      ok: true,
      value: runWithParams({ statement, params: args.params }),
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "DB_WRITE_FAILED",
        message: toErrorMessage(error),
      },
    };
  }
}

export function executeRoleBoundWrite<T>(args: {
  role: DbExecutionRole;
  write: () => T;
}): DbWriteExecutionResult<T> {
  if (READ_ONLY_ROLES.has(args.role)) {
    return {
      ok: false,
      error: {
        code: "DB_READONLY_ROLE",
        message: `${args.role} role is read-only`,
      },
    };
  }

  try {
    return { ok: true, value: args.write() };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "DB_WRITE_FAILED",
        message: toErrorMessage(error),
      },
    };
  }
}
