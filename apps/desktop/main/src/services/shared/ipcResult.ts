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

export function ipcError(
  code: IpcErrorCode,
  message: string,
  details?: unknown,
): Err {
  return { ok: false, error: { code, message, details } };
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
