import { SKILL_STREAM_CHUNK_CHANNEL } from "@shared/types/ai";
import type {
  IpcErr,
  IpcError,
  IpcErrorCode,
  IpcResponse,
} from "@shared/types/ipc-generated";
import { nowTs } from "@shared/timeUtils";

export const MAX_AI_STREAM_SUBSCRIPTIONS = 500;
const DEFAULT_MAX_ID_COLLISION_RETRIES = 3;

export type IpcSecurityAuditEvent = {
  event: string;
  rendererId: string;
  channel: string;
  timestamp: number;
  details?: Record<string, unknown>;
};

type CreateAiStreamSubscriptionRegistryArgs = {
  rendererId: string;
  maxSubscriptions?: number;
  maxIdCollisionRetries?: number;
  now?: () => number;
  idFactory?: () => string;
  auditLog?: (event: IpcSecurityAuditEvent) => void;
};

function createSubscriptionId(): string {
  if (
    typeof globalThis.crypto === "object" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `sub-${nowTs()}-${Math.random().toString(16).slice(2)}`;
}

function toIpcError(
  code: IpcErrorCode,
  message: string,
  details?: unknown,
): IpcError {
  return {
    code,
    message,
    details,
    retryable: code === "TIMEOUT",
  };
}

function toErr(args: {
  code: IpcErrorCode;
  message: string;
  details?: unknown;
}): IpcErr {
  return {
    ok: false,
    error: toIpcError(args.code, args.message, args.details),
  };
}

function defaultAuditLog(event: IpcSecurityAuditEvent): void {
  console.warn("[ipc-security-audit]", JSON.stringify(event));
}

function normalizeMaxIdCollisionRetries(value: number | undefined): number {
  if (!Number.isInteger(value) || value === undefined || value < 0) {
    return DEFAULT_MAX_ID_COLLISION_RETRIES;
  }

  return value;
}

/**
 * Create per-renderer AI stream subscription registry with a hard upper bound.
 */
export function createAiStreamSubscriptionRegistry(
  args: CreateAiStreamSubscriptionRegistryArgs,
): {
  register: () => IpcResponse<{ subscriptionId: string }>;
  release: (subscriptionId: string) => void;
  count: () => number;
} {
  const maxSubscriptions = args.maxSubscriptions ?? MAX_AI_STREAM_SUBSCRIPTIONS;
  const maxIdCollisionRetries = normalizeMaxIdCollisionRetries(
    args.maxIdCollisionRetries,
  );
  const getNow = args.now ?? nowTs;
  const createId = args.idFactory ?? createSubscriptionId;
  const auditLog = args.auditLog ?? defaultAuditLog;
  const active = new Set<string>();

  return {
    register: () => {
      if (active.size >= maxSubscriptions) {
        auditLog({
          event: "ipc_subscription_limit_exceeded",
          rendererId: args.rendererId,
          channel: SKILL_STREAM_CHUNK_CHANNEL,
          timestamp: getNow(),
          details: {
            current: active.size,
            limit: maxSubscriptions,
          },
        });

        return toErr({
          code: "IPC_SUBSCRIPTION_LIMIT_EXCEEDED",
          message: "订阅数量超过上限",
          details: {
            current: active.size,
            limit: maxSubscriptions,
          },
        });
      }

      let attempt = 0;
      let lastCollisionId: string | undefined;
      while (attempt <= maxIdCollisionRetries) {
        const subscriptionId = createId();
        if (!active.has(subscriptionId)) {
          active.add(subscriptionId);
          return {
            ok: true,
            data: { subscriptionId },
          };
        }

        lastCollisionId = subscriptionId;
        auditLog({
          event: "ipc_subscription_id_collision",
          rendererId: args.rendererId,
          channel: SKILL_STREAM_CHUNK_CHANNEL,
          timestamp: getNow(),
          details: {
            subscriptionId,
            attempt: attempt + 1,
            maxRetries: maxIdCollisionRetries,
          },
        });
        attempt += 1;
      }

      auditLog({
        event: "ipc_subscription_id_collision_exhausted",
        rendererId: args.rendererId,
        channel: SKILL_STREAM_CHUNK_CHANNEL,
        timestamp: getNow(),
        details: {
          subscriptionId: lastCollisionId,
          attempts: maxIdCollisionRetries + 1,
          maxRetries: maxIdCollisionRetries,
        },
      });
      return toErr({
        code: "CONFLICT",
        message: "订阅ID冲突，请重试",
        details: {
          subscriptionId: lastCollisionId,
          attempts: maxIdCollisionRetries + 1,
        },
      });
    },
    release: (subscriptionId: string) => {
      active.delete(subscriptionId);
    },
    count: () => active.size,
  };
}
