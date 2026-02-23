import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";

export type ServiceErrorKind =
  | "timeout"
  | "validation"
  | "internal"
  | "unknown";

export type ServiceError = {
  kind: ServiceErrorKind;
  code: IpcErrorCode;
  message: string;
  details: unknown;
  retryable: boolean | undefined;
  traceId: string | undefined;
};

function toKind(code: IpcErrorCode): ServiceErrorKind {
  if (
    code === "IPC_TIMEOUT" ||
    code === "TIMEOUT" ||
    code.endsWith("_TIMEOUT")
  ) {
    return "timeout";
  }

  if (code === "VALIDATION_ERROR" || code === "CONSTRAINT_VALIDATION_ERROR") {
    return "validation";
  }

  if (
    code === "INTERNAL" ||
    code === "INTERNAL_ERROR" ||
    code.endsWith("_ERROR")
  ) {
    return "internal";
  }

  return "unknown";
}

export function normalizeIpcError(error: IpcError): ServiceError {
  return {
    kind: toKind(error.code),
    code: error.code,
    message: error.message,
    details: error.details,
    retryable: error.retryable,
    traceId: error.traceId,
  };
}
