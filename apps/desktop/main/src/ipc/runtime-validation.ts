import type { IpcMain } from "electron";
import { randomUUID } from "node:crypto";

import { ipcContract } from "./contract/ipc-contract";
import type { IpcSchema } from "./contract/schema";
import {
  createIpcAclEvaluator,
  type IpcAclDecision,
  type IpcAclEvaluator,
} from "./ipcAcl";

import type {
  IpcError,
  IpcErrorCode,
  IpcResponse,
} from "@shared/types/ipc-generated";

export type RuntimeValidationIssue = {
  path: string;
  message: string;
  expected: string;
  receivedType: string;
};

type RuntimeLogger = {
  info: (event: string, data?: Record<string, unknown>) => void;
  error: (event: string, data?: Record<string, unknown>) => void;
};

type TimeoutCleanup = () => void | Promise<void>;

type RuntimeChannelPolicy = {
  timeoutMs?: number;
  onTimeoutCleanup?: TimeoutCleanup;
};

type RequestResponseSchema = {
  request: IpcSchema;
  response: IpcSchema;
};

type HandleListener = Parameters<IpcMain["handle"]>[1];

type WrapIpcRequestResponseArgs = {
  channel: string;
  requestSchema: IpcSchema;
  responseSchema: IpcSchema;
  logger: RuntimeLogger;
  timeoutMs: number;
  onTimeoutCleanup?: TimeoutCleanup;
  aclEvaluator?: IpcAclEvaluator;
  handler: HandleListener;
};

type CreateValidatedIpcMainArgs = {
  ipcMain: IpcMain;
  logger: RuntimeLogger;
  defaultTimeoutMs?: number;
  channelPolicies?: Partial<Record<string, RuntimeChannelPolicy>>;
  aclEvaluator?: IpcAclEvaluator;
};

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Timeout sentinel used by IPC request-response wrapping.
 */
class IpcTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IpcTimeoutError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

/**
 * Render schema shape for validation diagnostics.
 */
function renderSchema(schema: IpcSchema): string {
  switch (schema.kind) {
    case "string":
    case "number":
    case "boolean":
      return schema.kind;
    case "literal":
      return JSON.stringify(schema.value);
    case "array":
      return `array<${renderSchema(schema.element)}>`;
    case "record":
      return `record<string, ${renderSchema(schema.value)}>`;
    case "union":
      return schema.variants
        .map((variant) => renderSchema(variant))
        .join(" | ");
    case "optional":
      return `${renderSchema(schema.schema)} | undefined`;
    case "object":
      return "object";
    default:
      return "unknown";
  }
}

function pushIssue(
  issues: RuntimeValidationIssue[],
  path: string,
  message: string,
  expected: string,
  received: unknown,
): void {
  issues.push({
    path,
    message,
    expected,
    receivedType: getValueType(received),
  });
}

function validateRecordSchema(
  schema: Extract<IpcSchema, { kind: "record" }>,
  value: unknown,
  path: string,
  issues: RuntimeValidationIssue[],
): void {
  if (!isRecord(value) || Array.isArray(value)) {
    pushIssue(issues, path, "must be object record", renderSchema(schema), value);
    return;
  }
  for (const [key, recordValue] of Object.entries(value)) {
    validateSchemaAtPath(schema.value, recordValue, `${path}.${key}`, issues);
  }
}

function validateObjectSchema(
  schema: Extract<IpcSchema, { kind: "object" }>,
  value: unknown,
  path: string,
  issues: RuntimeValidationIssue[],
): void {
  if (!isRecord(value) || Array.isArray(value)) {
    pushIssue(issues, path, "must be object", "object", value);
    return;
  }
  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const fieldPath = `${path}.${fieldName}`;
    if (!(fieldName in value)) {
      if (fieldSchema.kind !== "optional") {
        pushIssue(issues, fieldPath, "is required", renderSchema(fieldSchema), undefined);
      }
      continue;
    }
    validateSchemaAtPath(fieldSchema, (value as Record<string, unknown>)[fieldName], fieldPath, issues);
  }
  const knownFields = new Set(Object.keys(schema.fields));
  for (const fieldName of Object.keys(value)) {
    if (!knownFields.has(fieldName)) {
      pushIssue(issues, `${path}.${fieldName}`, "is not allowed", "no extra fields", (value as Record<string, unknown>)[fieldName]);
    }
  }
}

function validateSchemaAtPath(
  schema: IpcSchema,
  value: unknown,
  path: string,
  issues: RuntimeValidationIssue[],
): void {
  switch (schema.kind) {
    case "string":
      if (typeof value !== "string") {
        pushIssue(issues, path, "must be string", "string", value);
      }
      return;
    case "number":
      if (typeof value !== "number" || Number.isNaN(value)) {
        pushIssue(issues, path, "must be number", "number", value);
      }
      return;
    case "boolean":
      if (typeof value !== "boolean") {
        pushIssue(issues, path, "must be boolean", "boolean", value);
      }
      return;
    case "literal":
      if (value !== schema.value) {
        pushIssue(
          issues,
          path,
          "must match literal",
          renderSchema(schema),
          value,
        );
      }
      return;
    case "array":
      if (!Array.isArray(value)) {
        pushIssue(issues, path, "must be array", renderSchema(schema), value);
        return;
      }
      value.forEach((item, index) => {
        validateSchemaAtPath(schema.element, item, `${path}[${index}]`, issues);
      });
      return;
    case "record":
      validateRecordSchema(schema, value, path, issues);
      return;
    case "union": {
      const matchesVariant = schema.variants.some((variant) => {
        const variantIssues: RuntimeValidationIssue[] = [];
        validateSchemaAtPath(variant, value, path, variantIssues);
        return variantIssues.length === 0;
      });
      if (!matchesVariant) {
        pushIssue(
          issues,
          path,
          "must match one union variant",
          renderSchema(schema),
          value,
        );
      }
      return;
    }
    case "optional":
      if (value === undefined) {
        return;
      }
      validateSchemaAtPath(schema.schema, value, path, issues);
      return;
    case "object":
      validateObjectSchema(schema, value, path, issues);
      return;
    default:
      pushIssue(
        issues,
        path,
        "uses unsupported schema kind",
        "known schema kind",
        value,
      );
  }
}

function validateSchema(
  schema: IpcSchema,
  value: unknown,
): RuntimeValidationIssue[] {
  const issues: RuntimeValidationIssue[] = [];
  validateSchemaAtPath(schema, value, "$", issues);
  return issues;
}

function isIpcErrorCode(code: string): code is IpcErrorCode {
  return (ipcContract.errorCodes as readonly string[]).includes(code);
}

function toValidationError(
  channel: string,
  issues: RuntimeValidationIssue[],
): IpcResponse<never> {
  if (
    channel.startsWith("project:project:") ||
    channel.startsWith("project:lifecycle:")
  ) {
    return {
      ok: false,
      error: {
        code: "PROJECT_IPC_SCHEMA_INVALID",
        message: "Project request payload does not match IPC contract",
        traceId: randomUUID(),
        details: issues,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Request payload does not match IPC contract",
      details: issues,
    },
  };
}

function toInternalError(message: string): IpcResponse<never> {
  return {
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
  };
}

function toTimeoutError(timeoutMs: number): IpcResponse<never> {
  return {
    ok: false,
    error: {
      code: "IPC_TIMEOUT",
      message: `Request timed out (${timeoutMs}ms)`,
    },
  };
}

function toForbiddenError(
  decision: Extract<IpcAclDecision, { allowed: false }>,
): IpcResponse<never> {
  return {
    ok: false,
    error: {
      code: "FORBIDDEN",
      message: "Caller is not authorized",
      details: {
        reason: decision.reason,
        ...decision.details,
      },
    },
  };
}

function isIpcEnvelope(value: unknown): value is IpcResponse<unknown> {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  if (value.ok) {
    return "data" in value;
  }

  if (!("error" in value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
}

function sanitizeErrorEnvelope(rawError: IpcError): IpcError {
  if (!isIpcErrorCode(rawError.code)) {
    return {
      code: "INTERNAL_ERROR",
      message: "Internal error",
    };
  }

  const sanitized: IpcError = {
    code: rawError.code,
    message: rawError.message,
  };
  if ("details" in rawError) {
    sanitized.details = rawError.details;
  }
  if ("retryable" in rawError) {
    sanitized.retryable = rawError.retryable;
  }
  if ("traceId" in rawError) {
    sanitized.traceId = rawError.traceId;
  }
  return sanitized;
}

async function runWithTimeout(
  run: () => Promise<unknown>,
  timeoutMs: number,
  options?: { onTimeout?: () => void },
): Promise<unknown> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try {
        options?.onTimeout?.();
      } catch {
        // Ignore onTimeout failures to preserve timeout semantics.
      }
      reject(new IpcTimeoutError("ipc request timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function resolveRequestPayload(schema: IpcSchema, payload: unknown): unknown {
  if (
    payload === undefined &&
    schema.kind === "object" &&
    Object.keys(schema.fields).length === 0
  ) {
    return {};
  }
  return payload;
}

/**
 * Build a request-response handler wrapper with runtime contract validation.
 *
 * Why: all request/response validation and error-envelope normalization must be
 * enforced at a single IPC boundary to avoid per-handler drift.
 */
export function wrapIpcRequestResponse(
  args: WrapIpcRequestResponseArgs,
): HandleListener {
  const aclEvaluator = args.aclEvaluator ?? createIpcAclEvaluator();

  return async (event, payload): Promise<IpcResponse<unknown>> => {
    const aclDecision = aclEvaluator({
      channel: args.channel,
      event,
    });
    if (!aclDecision.allowed) {
      args.logger.error("ipc_acl_forbidden", {
        channel: args.channel,
        reason: aclDecision.reason,
        ...aclDecision.details,
      });
      return toForbiddenError(aclDecision);
    }

    const requestPayload = resolveRequestPayload(args.requestSchema, payload);
    const requestIssues = validateSchema(args.requestSchema, requestPayload);
    if (requestIssues.length > 0) {
      args.logger.error("ipc_request_validation_failed", {
        channel: args.channel,
        issueCount: requestIssues.length,
      });
      return toValidationError(args.channel, requestIssues);
    }

    try {
      const abortController = new AbortController();
      const raw = await runWithTimeout(
        async () =>
          await Promise.resolve(
            args.handler(event, requestPayload, abortController.signal),
          ),
        args.timeoutMs,
        {
          onTimeout: () => {
            abortController.abort();
          },
        },
      );

      if (!isIpcEnvelope(raw)) {
        args.logger.error("ipc_protocol_violation", {
          channel: args.channel,
          stage: "envelope",
          responseType: getValueType(raw),
        });
        return toInternalError("Response payload does not match IPC contract");
      }

      if (!raw.ok) {
        return {
          ok: false,
          error: sanitizeErrorEnvelope(raw.error),
        };
      }

      const responseIssues = validateSchema(args.responseSchema, raw.data);
      if (responseIssues.length > 0) {
        args.logger.error("ipc_response_validation_failed", {
          channel: args.channel,
          issueCount: responseIssues.length,
        });
        return toInternalError("Response payload does not match IPC contract");
      }

      return raw;
    } catch (error) {
      if (error instanceof IpcTimeoutError) {
        if (args.onTimeoutCleanup) {
          try {
            await args.onTimeoutCleanup();
          } catch (cleanupError) {
            args.logger.error("ipc_timeout_cleanup_failed", {
              channel: args.channel,
              message:
                cleanupError instanceof Error
                  ? cleanupError.message
                  : String(cleanupError),
            });
          }
        }
        return toTimeoutError(args.timeoutMs);
      }

      args.logger.error("ipc_handler_unhandled_error", {
        channel: args.channel,
        message: error instanceof Error ? error.message : String(error),
      });
      return toInternalError("Internal error");
    }
  };
}

function getRequestResponseSchema(
  channel: string,
): RequestResponseSchema | null {
  const entry =
    ipcContract.channels[channel as keyof typeof ipcContract.channels];
  if (!entry || !entry.request || !entry.response) {
    return null;
  }
  return {
    request: entry.request,
    response: entry.response,
  };
}

/**
 * Create an IpcMain proxy that wraps `.handle()` with runtime IPC guards.
 */
export function createValidatedIpcMain(
  args: CreateValidatedIpcMainArgs,
): IpcMain {
  const defaultTimeoutMs = args.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const aclEvaluator = args.aclEvaluator ?? createIpcAclEvaluator();

  const wrappedHandle: IpcMain["handle"] = (channel, listener) => {
    const contractSchema = getRequestResponseSchema(channel);
    if (!contractSchema) {
      args.logger.error("ipc_contract_missing_channel_schema", {
        channel,
      });
      args.ipcMain.handle(channel, async () =>
        toInternalError("IPC channel schema is missing from contract"),
      );
      return;
    }

    const policy = args.channelPolicies?.[channel];
    const wrapped = wrapIpcRequestResponse({
      channel,
      requestSchema: contractSchema.request,
      responseSchema: contractSchema.response,
      logger: args.logger,
      timeoutMs: policy?.timeoutMs ?? defaultTimeoutMs,
      onTimeoutCleanup: policy?.onTimeoutCleanup,
      aclEvaluator,
      handler: listener,
    });

    args.ipcMain.handle(channel, wrapped);
  };

  return new Proxy(args.ipcMain, {
    get(target, prop, receiver) {
      if (prop === "handle") {
        return wrappedHandle;
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as IpcMain;
}
