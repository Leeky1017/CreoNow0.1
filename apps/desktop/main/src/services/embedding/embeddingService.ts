import type { Logger } from "../../logging/logger";
import { embedTextToUnitVector } from "./hashEmbedding";
import type {
  OnnxEmbeddingRuntime,
  OnnxEmbeddingRuntimeError,
} from "./onnxRuntime";
import { logWarn } from "../shared/degradationCounter";
import { ipcError, type ServiceResult, type Err } from "../shared/ipcResult";
export type { ServiceResult };

export type EmbeddingEncodeResult = { vectors: number[][]; dimension: number };
export type EmbeddingProvider = "hash" | "onnx";

type PrimaryFailureReason = "PRIMARY_TIMEOUT" | "PRIMARY_UNAVAILABLE";

type EmbeddingFallbackPolicy = {
  enabled: boolean;
  provider: EmbeddingProvider;
  onReasons?: PrimaryFailureReason[];
};

export type EmbeddingProviderPolicy = {
  primaryProvider: EmbeddingProvider;
  fallback?: EmbeddingFallbackPolicy;
};

export type EmbeddingService = {
  /**
   * Encode texts into vectors.
   *
   * Why: both RAG rerank and future vector indexing need a single encoding surface
   * with deterministic, testable error semantics.
   */
  encode: (args: {
    texts: readonly string[];
    model?: string;
  }) => ServiceResult<EmbeddingEncodeResult>;
};

const MAX_TEXTS = 64;
const MAX_TEXT_LENGTH = 8_000;

const HASH_MODEL_ALIASES = new Set([
  "hash",
  "hash-v1",
  "local:hash",
  "local:hash-v1",
]);

const HASH_MODEL_DIMENSION = 256;
const ONNX_MODEL_ALIASES = new Set(["onnx", "onnx-v1", "local:onnx"]);
const PRIMARY_TIMEOUT_REASONS: PrimaryFailureReason[] = ["PRIMARY_TIMEOUT"];

function normalizeModelId(model?: string): string {
  const m = typeof model === "string" ? model.trim() : "";
  return m.length === 0 ? "default" : m;
}

function normalizeProviderPolicy(
  policy?: EmbeddingProviderPolicy,
): EmbeddingProviderPolicy | undefined {
  if (!policy) {
    return undefined;
  }
  return {
    primaryProvider: policy.primaryProvider,
    fallback: policy.fallback
      ? {
          enabled: Boolean(policy.fallback.enabled),
          provider: policy.fallback.provider,
          onReasons: policy.fallback.onReasons ?? PRIMARY_TIMEOUT_REASONS,
        }
      : undefined,
  };
}

function isTimeoutMarker(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("etimedout")
  );
}

function classifyPrimaryFailureReason(
  error: OnnxEmbeddingRuntimeError,
): PrimaryFailureReason {
  const detailsError =
    typeof error.details.error === "string" ? error.details.error : "";

  if (isTimeoutMarker(error.message) || isTimeoutMarker(detailsError)) {
    return "PRIMARY_TIMEOUT";
  }

  return "PRIMARY_UNAVAILABLE";
}

function serializeRuntimeError(error: OnnxEmbeddingRuntimeError): Record<string, unknown> {
  return {
    code: error.code,
    message: error.message,
    provider: error.details.provider,
    modelPath: error.details.modelPath,
    ...(typeof error.details.error === "string"
      ? { error: error.details.error }
      : {}),
  };
}

function mapOnnxRuntimeError(args: {
  modelId: string;
  logger: Logger;
  error: OnnxEmbeddingRuntimeError;
}): Err {
  const details = {
    model: args.modelId,
    runtimeCode: args.error.code,
    provider: args.error.details.provider,
    modelPath: args.error.details.modelPath,
    ...(args.error.details.error ? { error: args.error.details.error } : {}),
    ...(typeof args.error.details.expectedDimension === "number"
      ? { expectedDimension: args.error.details.expectedDimension }
      : {}),
    ...(typeof args.error.details.actualDimension === "number"
      ? { actualDimension: args.error.details.actualDimension }
      : {}),
  };

  args.logger.error("embedding_runtime_error", details);

  if (args.error.code === "EMBEDDING_RUNTIME_UNAVAILABLE") {
    return ipcError("MODEL_NOT_READY", "Embedding model not ready", details);
  }

  return ipcError("ENCODING_FAILED", "Embedding encoding failed", details);
}

/**
 * Create an embedding service with a deterministic local baseline.
 */
export function createEmbeddingService(deps: {
  logger: Logger;
  onnxRuntime?: OnnxEmbeddingRuntime;
  providerPolicy?: EmbeddingProviderPolicy;
}): EmbeddingService {
  const providerPolicy = normalizeProviderPolicy(deps.providerPolicy);

  const encodeWithHash = (args: {
    texts: readonly string[];
    modelId: string;
  }): ServiceResult<EmbeddingEncodeResult> => {
    const vectors = args.texts.map((t) =>
      embedTextToUnitVector({ text: t, dimension: HASH_MODEL_DIMENSION }),
    );
    deps.logger.info("embedding_encode_hash", {
      model: args.modelId,
      textCount: args.texts.length,
      dimension: HASH_MODEL_DIMENSION,
    });
    return {
      ok: true,
      data: { vectors, dimension: HASH_MODEL_DIMENSION },
    };
  };

  const encodeWithOnnx = (args: {
    texts: readonly string[];
    modelId: string;
  }): ServiceResult<EmbeddingEncodeResult> => {
    if (!deps.onnxRuntime) {
      return mapOnnxRuntimeError({
        modelId: args.modelId,
        logger: deps.logger,
        error: {
          code: "EMBEDDING_RUNTIME_UNAVAILABLE",
          message: "ONNX runtime not configured",
          details: {
            provider: "cpu",
            modelPath: "<unset>",
            error: "ONNX runtime not configured",
          },
        },
      });
    }

    const encoded = deps.onnxRuntime.encode({
      texts: args.texts,
    });
    if (!encoded.ok) {
      return mapOnnxRuntimeError({
        modelId: args.modelId,
        logger: deps.logger,
        error: encoded.error,
      });
    }

    deps.logger.info("embedding_encode_onnx", {
      model: args.modelId,
      textCount: args.texts.length,
      dimension: encoded.data.dimension,
    });
    return {
      ok: true,
      data: encoded.data,
    };
  };

  const encodeWithProviderForPolicy = (args: {
    provider: EmbeddingProvider;
    texts: readonly string[];
    modelId: string;
  }):
    | { ok: true; data: EmbeddingEncodeResult }
    | { ok: false; error: OnnxEmbeddingRuntimeError } => {
    if (args.provider === "hash") {
      const encoded = encodeWithHash({
        texts: args.texts,
        modelId: args.modelId,
      });
      if (!encoded.ok) {
        throw new Error("hash provider should not fail");
      }
      return encoded;
    }

    if (!deps.onnxRuntime) {
      return {
        ok: false,
        error: {
          code: "EMBEDDING_RUNTIME_UNAVAILABLE",
          message: "ONNX runtime not configured",
          details: {
            provider: "cpu",
            modelPath: "<unset>",
            error: "ONNX runtime not configured",
          },
        },
      };
    }

    const encoded = deps.onnxRuntime.encode({
      texts: args.texts,
    });
    if (!encoded.ok) {
      return encoded;
    }

    deps.logger.info("embedding_encode_onnx", {
      model: args.modelId,
      textCount: args.texts.length,
      dimension: encoded.data.dimension,
    });
    return encoded;
  };

  return {
    encode: (args) => {
      if (!Array.isArray(args.texts) || args.texts.length === 0) {
        return ipcError("INVALID_ARGUMENT", "texts is required");
      }
      if (args.texts.length > MAX_TEXTS) {
        return ipcError("INVALID_ARGUMENT", "texts is too large", {
          max: MAX_TEXTS,
        });
      }
      for (const text of args.texts) {
        if (typeof text !== "string" || text.trim().length === 0) {
          return ipcError(
            "INVALID_ARGUMENT",
            "texts must be non-empty strings",
          );
        }
        if (text.length > MAX_TEXT_LENGTH) {
          return ipcError("INVALID_ARGUMENT", "text is too long", {
            maxLength: MAX_TEXT_LENGTH,
          });
        }
      }

      const modelId = normalizeModelId(args.model);
      if (HASH_MODEL_ALIASES.has(modelId)) {
        return encodeWithHash({
          texts: args.texts,
          modelId,
        });
      }

      if (ONNX_MODEL_ALIASES.has(modelId)) {
        return encodeWithOnnx({
          texts: args.texts,
          modelId,
        });
      }

      if (modelId === "default" && providerPolicy) {
        const primary = encodeWithProviderForPolicy({
          provider: providerPolicy.primaryProvider,
          texts: args.texts,
          modelId,
        });

        if (primary.ok) {
          return primary;
        }

        const reason = classifyPrimaryFailureReason(primary.error);
        const fallbackPolicy = providerPolicy.fallback;
        const shouldFallback =
          Boolean(fallbackPolicy?.enabled) &&
          Boolean(fallbackPolicy?.provider) &&
          (fallbackPolicy?.onReasons ?? PRIMARY_TIMEOUT_REASONS).includes(
            reason,
          );

        if (shouldFallback && fallbackPolicy) {
          deps.logger.info("embedding_provider_fallback", {
            primaryProvider: providerPolicy.primaryProvider,
            fallbackProvider: fallbackPolicy.provider,
            reason,
          });

          const fallback = encodeWithProviderForPolicy({
            provider: fallbackPolicy.provider,
            texts: args.texts,
            modelId,
          });
          if (fallback.ok) {
            return fallback;
          }

          logWarn(
            deps.logger as Logger & {
              warn?: (event: string, data?: Record<string, unknown>) => void;
            },
            "embedding_fallback_failure",
            {
              module: "embedding-service",
              reason,
              primaryProvider: providerPolicy.primaryProvider,
              fallbackProvider: fallbackPolicy.provider,
              primaryError: serializeRuntimeError(primary.error),
              fallbackError: serializeRuntimeError(fallback.error),
            },
          );

          return ipcError(
            "EMBEDDING_PROVIDER_UNAVAILABLE",
            "Embedding provider unavailable",
            {
              primaryProvider: providerPolicy.primaryProvider,
              fallbackProvider: fallbackPolicy.provider,
              fallbackEnabled: true,
              reason,
              runtimeCode: primary.error.code,
              fallbackRuntimeCode: fallback.error.code,
            },
          );
        }

        return ipcError(
          "EMBEDDING_PROVIDER_UNAVAILABLE",
          "Embedding provider unavailable",
          {
            primaryProvider: providerPolicy.primaryProvider,
            fallbackProvider: fallbackPolicy?.provider,
            fallbackEnabled: Boolean(fallbackPolicy?.enabled),
            reason,
            runtimeCode: primary.error.code,
          },
        );
      }

      deps.logger.info("embedding_model_not_ready", {
        textCount: args.texts.length,
        model: modelId,
      });

      if (modelId !== "default") {
        return ipcError("INVALID_ARGUMENT", "Unknown embedding model", {
          model: modelId,
          supported: [
            ...HASH_MODEL_ALIASES.values(),
            ...ONNX_MODEL_ALIASES.values(),
            "default",
          ].sort(),
        });
      }

      return ipcError("MODEL_NOT_READY", "Embedding model not ready", {
        model: modelId,
      });
    },
  };
}
