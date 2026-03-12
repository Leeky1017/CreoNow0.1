import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";

import { i18n } from "../i18n";

export type ErrorMessageResolver = (backendMessage: string) => string;

const TIMEOUT_DETAIL_PATTERN = /\((\d+ms)\)/u;
const t = (key: string): string => i18n.t(key);

export const USER_FACING_MESSAGE_BY_CODE: Record<
  IpcErrorCode,
  ErrorMessageResolver
> = {
  AI_AUTH_FAILED: () => t("error.code.AI_AUTH_FAILED"),
  AI_NOT_CONFIGURED: () => t("error.code.AI_NOT_CONFIGURED"),
  AI_PROVIDER_UNAVAILABLE: () => t("error.code.AI_PROVIDER_UNAVAILABLE"),
  AI_RATE_LIMITED: () => t("error.code.AI_RATE_LIMITED"),
  AI_SESSION_TOKEN_BUDGET_EXCEEDED: () =>
    t("error.code.AI_SESSION_TOKEN_BUDGET_EXCEEDED"),
  ALREADY_EXISTS: () => t("error.code.ALREADY_EXISTS"),
  CANCELED: () => t("error.code.CANCELED"),
  CONFLICT: () => t("error.code.CONFLICT"),
  CONSTRAINT_CONFLICT: () => t("error.code.CONSTRAINT_CONFLICT"),
  CONSTRAINT_NOT_FOUND: () => t("error.code.CONSTRAINT_NOT_FOUND"),
  CONSTRAINT_VALIDATION_ERROR: () =>
    t("error.code.CONSTRAINT_VALIDATION_ERROR"),
  CONTEXT_BACKPRESSURE: () => t("error.code.CONTEXT_BACKPRESSURE"),
  CONTEXT_BUDGET_CONFLICT: () => t("error.code.CONTEXT_BUDGET_CONFLICT"),
  CONTEXT_BUDGET_INVALID_MINIMUM: () =>
    t("error.code.CONTEXT_BUDGET_INVALID_MINIMUM"),
  CONTEXT_BUDGET_INVALID_RATIO: () =>
    t("error.code.CONTEXT_BUDGET_INVALID_RATIO"),
  CONTEXT_INPUT_TOO_LARGE: () => t("error.code.CONTEXT_INPUT_TOO_LARGE"),
  CONTEXT_INSPECT_FORBIDDEN: () => t("error.code.CONTEXT_INSPECT_FORBIDDEN"),
  CONTEXT_SCOPE_VIOLATION: () => t("error.code.CONTEXT_SCOPE_VIOLATION"),
  CONTEXT_TOKENIZER_MISMATCH: () => t("error.code.CONTEXT_TOKENIZER_MISMATCH"),
  DB_ERROR: () => t("error.code.DB_ERROR"),
  DOCUMENT_SAVE_CONFLICT: () => t("error.code.DOCUMENT_SAVE_CONFLICT"),
  DOCUMENT_SIZE_EXCEEDED: () => t("error.code.DOCUMENT_SIZE_EXCEEDED"),
  EMBEDDING_PROVIDER_UNAVAILABLE: () =>
    t("error.code.EMBEDDING_PROVIDER_UNAVAILABLE"),
  ENCODING_FAILED: () => t("error.code.ENCODING_FAILED"),
  FORBIDDEN: () => t("error.code.FORBIDDEN"),
  INTERNAL: () => t("error.code.INTERNAL"),
  INTERNAL_ERROR: () => t("error.code.INTERNAL_ERROR"),
  INVALID_ARGUMENT: () => t("error.code.INVALID_ARGUMENT"),
  IO_ERROR: () => t("error.code.IO_ERROR"),
  IPC_CHANNEL_FORBIDDEN: () => t("error.code.IPC_CHANNEL_FORBIDDEN"),
  IPC_PAYLOAD_TOO_LARGE: () => t("error.code.IPC_PAYLOAD_TOO_LARGE"),
  IPC_SUBSCRIPTION_LIMIT_EXCEEDED: () =>
    t("error.code.IPC_SUBSCRIPTION_LIMIT_EXCEEDED"),
  IPC_TIMEOUT: (backendMessage) => {
    const detail = TIMEOUT_DETAIL_PATTERN.exec(backendMessage)?.[1];
    const base = t("error.code.IPC_TIMEOUT");
    return detail ? `${base}（${detail}）` : base;
  },
  KG_ATTRIBUTE_KEYS_EXCEEDED: () => t("error.code.KG_ATTRIBUTE_KEYS_EXCEEDED"),
  KG_CAPACITY_EXCEEDED: () => t("error.code.KG_CAPACITY_EXCEEDED"),
  KG_ENTITY_CONFLICT: () => t("error.code.KG_ENTITY_CONFLICT"),
  KG_ENTITY_DUPLICATE: () => t("error.code.KG_ENTITY_DUPLICATE"),
  KG_QUERY_TIMEOUT: () => t("error.code.KG_QUERY_TIMEOUT"),
  KG_RECOGNITION_UNAVAILABLE: () => t("error.code.KG_RECOGNITION_UNAVAILABLE"),
  KG_RELATION_INVALID: () => t("error.code.KG_RELATION_INVALID"),
  KG_RELEVANT_QUERY_FAILED: () => t("error.code.KG_RELEVANT_QUERY_FAILED"),
  KG_SCOPE_VIOLATION: () => t("error.code.KG_SCOPE_VIOLATION"),
  KG_SUBGRAPH_K_EXCEEDED: () => t("error.code.KG_SUBGRAPH_K_EXCEEDED"),
  LLM_API_ERROR: () => t("error.code.LLM_API_ERROR"),
  MEMORY_BACKPRESSURE: () => t("error.code.MEMORY_BACKPRESSURE"),
  MEMORY_CAPACITY_EXCEEDED: () => t("error.code.MEMORY_CAPACITY_EXCEEDED"),
  MEMORY_CLEAR_CONFIRM_REQUIRED: () =>
    t("error.code.MEMORY_CLEAR_CONFIRM_REQUIRED"),
  MEMORY_CONFIDENCE_OUT_OF_RANGE: () =>
    t("error.code.MEMORY_CONFIDENCE_OUT_OF_RANGE"),
  MEMORY_DISTILL_LLM_UNAVAILABLE: () =>
    t("error.code.MEMORY_DISTILL_LLM_UNAVAILABLE"),
  MEMORY_EPISODE_WRITE_FAILED: () =>
    t("error.code.MEMORY_EPISODE_WRITE_FAILED"),
  MEMORY_SCOPE_DENIED: () => t("error.code.MEMORY_SCOPE_DENIED"),
  MEMORY_TRACE_MISMATCH: () => t("error.code.MEMORY_TRACE_MISMATCH"),
  MODEL_NOT_READY: () => t("error.code.MODEL_NOT_READY"),
  NOT_FOUND: () => t("error.code.NOT_FOUND"),
  PERMISSION_DENIED: () => t("error.code.PERMISSION_DENIED"),
  PROJECT_CAPACITY_EXCEEDED: () => t("error.code.PROJECT_CAPACITY_EXCEEDED"),
  PROJECT_DELETE_REQUIRES_ARCHIVE: () =>
    t("error.code.PROJECT_DELETE_REQUIRES_ARCHIVE"),
  PROJECT_IPC_SCHEMA_INVALID: () => t("error.code.PROJECT_IPC_SCHEMA_INVALID"),
  PROJECT_LIFECYCLE_WRITE_FAILED: () =>
    t("error.code.PROJECT_LIFECYCLE_WRITE_FAILED"),
  PROJECT_METADATA_INVALID_ENUM: () =>
    t("error.code.PROJECT_METADATA_INVALID_ENUM"),
  PROJECT_PURGE_PERMISSION_DENIED: () =>
    t("error.code.PROJECT_PURGE_PERMISSION_DENIED"),
  PROJECT_SWITCH_TIMEOUT: () => t("error.code.PROJECT_SWITCH_TIMEOUT"),
  RATE_LIMITED: () => t("error.code.RATE_LIMITED"),
  SEARCH_BACKPRESSURE: () => t("error.code.SEARCH_BACKPRESSURE"),
  SEARCH_CAPACITY_EXCEEDED: () => t("error.code.SEARCH_CAPACITY_EXCEEDED"),
  SEARCH_CONCURRENT_WRITE_CONFLICT: () =>
    t("error.code.SEARCH_CONCURRENT_WRITE_CONFLICT"),
  SEARCH_DATA_CORRUPTED: () => t("error.code.SEARCH_DATA_CORRUPTED"),
  SEARCH_PROJECT_FORBIDDEN: () => t("error.code.SEARCH_PROJECT_FORBIDDEN"),
  SEARCH_REINDEX_IO_ERROR: () => t("error.code.SEARCH_REINDEX_IO_ERROR"),
  SEARCH_TIMEOUT: () => t("error.code.SEARCH_TIMEOUT"),
  SKILL_CAPACITY_EXCEEDED: () => t("error.code.SKILL_CAPACITY_EXCEEDED"),
  SKILL_DEPENDENCY_MISSING: () => t("error.code.SKILL_DEPENDENCY_MISSING"),
  SKILL_INPUT_EMPTY: () => t("error.code.SKILL_INPUT_EMPTY"),
  SKILL_OUTPUT_INVALID: () => t("error.code.SKILL_OUTPUT_INVALID"),
  SKILL_QUEUE_OVERFLOW: () => t("error.code.SKILL_QUEUE_OVERFLOW"),
  SKILL_SCOPE_VIOLATION: () => t("error.code.SKILL_SCOPE_VIOLATION"),
  SKILL_TIMEOUT: () => t("error.code.SKILL_TIMEOUT"),
  TIMEOUT: () => t("error.code.TIMEOUT"),
  UNSUPPORTED: () => t("error.code.UNSUPPORTED"),
  UPSTREAM_ERROR: () => t("error.code.UPSTREAM_ERROR"),
  VALIDATION_ERROR: () => t("error.code.VALIDATION_ERROR"),
  VERSION_DIFF_PAYLOAD_TOO_LARGE: () =>
    t("error.code.VERSION_DIFF_PAYLOAD_TOO_LARGE"),
  VERSION_MERGE_TIMEOUT: () => t("error.code.VERSION_MERGE_TIMEOUT"),
  VERSION_ROLLBACK_CONFLICT: () => t("error.code.VERSION_ROLLBACK_CONFLICT"),
  VERSION_SNAPSHOT_COMPACTED: () => t("error.code.VERSION_SNAPSHOT_COMPACTED"),
};

export function getHumanErrorMessage(error: {
  code: IpcErrorCode;
  message: string;
}): string {
  const resolver = USER_FACING_MESSAGE_BY_CODE[error.code];
  if (!resolver) {
    return t("error.generic");
  }
  return resolver(error.message);
}

export function localizeIpcError(error: IpcError): IpcError {
  const localizedMessage = getHumanErrorMessage({
    code: error.code,
    message: error.message,
  });
  if (localizedMessage === error.message) {
    return error;
  }
  return {
    ...error,
    message: localizedMessage,
  };
}
