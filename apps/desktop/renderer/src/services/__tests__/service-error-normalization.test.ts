import { describe, expect, it } from "vitest";

import type { IpcError } from "@shared/types/ipc-generated";

import { normalizeIpcError } from "../serviceErrorNormalization";

describe("service error normalization (IPC-P2-S3)", () => {
  it("normalizes IPC_TIMEOUT to timeout kind", () => {
    const error: IpcError = {
      code: "IPC_TIMEOUT",
      message: "timed out",
    };

    expect(normalizeIpcError(error)).toEqual({
      kind: "timeout",
      code: "IPC_TIMEOUT",
      message: "timed out",
      details: undefined,
      retryable: undefined,
      traceId: undefined,
    });
  });

  it("normalizes VALIDATION_ERROR to validation kind", () => {
    const error: IpcError = {
      code: "VALIDATION_ERROR",
      message: "bad input",
      details: { field: "name" },
    };

    expect(normalizeIpcError(error)).toEqual({
      kind: "validation",
      code: "VALIDATION_ERROR",
      message: "bad input",
      details: { field: "name" },
      retryable: undefined,
      traceId: undefined,
    });
  });

  it("normalizes INTERNAL_ERROR to internal kind", () => {
    const error: IpcError = {
      code: "INTERNAL_ERROR",
      message: "boom",
      traceId: "trace-1",
    };

    expect(normalizeIpcError(error)).toEqual({
      kind: "internal",
      code: "INTERNAL_ERROR",
      message: "boom",
      details: undefined,
      retryable: undefined,
      traceId: "trace-1",
    });
  });

  it("normalizes DB_ERROR to internal kind", () => {
    const error: IpcError = {
      code: "DB_ERROR",
      message: "db write failed",
    };

    expect(normalizeIpcError(error)).toEqual({
      kind: "internal",
      code: "DB_ERROR",
      message: "db write failed",
      details: undefined,
      retryable: undefined,
      traceId: undefined,
    });
  });
});
