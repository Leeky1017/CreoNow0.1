import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import type { OnnxEmbeddingRuntime } from "../../services/embedding/onnxRuntime";
import { createEmbeddingService } from "../../services/embedding/embeddingService";

type LogEntry = {
  event: string;
  data: Record<string, unknown> | undefined;
};

function createLogger(logs: LogEntry[]): Logger & {
  warn: (event: string, data?: Record<string, unknown>) => void;
} {
  return {
    logPath: "<test>",
    info: () => {},
    warn: (event, data) => {
      logs.push({ event, data });
    },
    error: (event, data) => {
      logs.push({ event, data });
    },
  };
}

// Scenario: AUD-C3-S4 primary + fallback failure must be logged together
{
  const logs: LogEntry[] = [];
  const logger = createLogger(logs);
  let attempt = 0;

  const onnxRuntime: OnnxEmbeddingRuntime = {
    encode: () => {
      attempt += 1;
      if (attempt === 1) {
        return {
          ok: false,
          error: {
            code: "EMBEDDING_RUNTIME_UNAVAILABLE",
            message: "primary timeout",
            details: {
              provider: "cpu",
              modelPath: "/models/primary.onnx",
              error: "ETIMEDOUT",
            },
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "EMBEDDING_RUNTIME_UNAVAILABLE",
          message: "fallback unavailable",
          details: {
            provider: "cpu",
            modelPath: "/models/fallback.onnx",
            error: "fallback failed",
          },
        },
      };
    },
  };

  const service = createEmbeddingService({
    logger,
    onnxRuntime,
    providerPolicy: {
      primaryProvider: "onnx",
      fallback: {
        enabled: true,
        provider: "onnx",
        onReasons: ["PRIMARY_TIMEOUT", "PRIMARY_UNAVAILABLE"],
      },
    },
  });

  const result = service.encode({ texts: ["degradation chain"] });
  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("AUD-C3-S4: expected encode failure");
  }

  const warn = logs.find(
    (entry) => entry.event === "embedding_fallback_failure",
  );
  assert.ok(warn, "AUD-C3-S4: expected embedding_fallback_failure warning");
  assert.equal(warn?.data?.module, "embedding-service");
  assert.equal(warn?.data?.primaryProvider, "onnx");
  assert.equal(warn?.data?.fallbackProvider, "onnx");
  assert.equal(typeof warn?.data?.primaryError, "object");
  assert.equal(typeof warn?.data?.fallbackError, "object");
}

console.log("embedding-fallback-degradation.test.ts: all assertions passed");
