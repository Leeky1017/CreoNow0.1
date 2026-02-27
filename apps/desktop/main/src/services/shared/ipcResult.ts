/**
 * Shared IPC result helpers.
 *
 * Previously duplicated across 30+ service files. Centralised here so all
 * services import from a single source of truth.
 */

import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: IpcError };
export type ServiceResult<T> = Ok<T> | Err;

export type IpcErrorOptions = {
  traceId?: string;
  retryable?: boolean;
};

export function ipcError(
  code: IpcErrorCode,
  message: string,
  details?: unknown,
  options?: IpcErrorOptions,
): Err {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
      ...(options?.traceId ? { traceId: options.traceId } : {}),
      ...(options?.retryable === undefined
        ? {}
        : { retryable: options.retryable }),
    },
  };
}

export function ipcOk<T>(data: T): Ok<T> {
  return { ok: true, data };
}

/**
 * Returns the current timestamp in milliseconds.
 * Centralised so fake-timer injection only needs one patch point.
 */
export function nowTs(): number {
  return Date.now();
}
