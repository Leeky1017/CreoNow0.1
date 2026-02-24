import type { BackgroundTaskResult } from "../utilityprocess/backgroundTaskRunner";
import type {
  RagRetrieveDiagnostics,
  RagRetrieveItem,
  ServiceResult,
} from "./ragService";

const DEFAULT_TIMEOUT_MS = 5_000;

type ComputeRunArgs<T> = {
  execute: (signal: AbortSignal) => Promise<T>;
  timeoutMs?: number;
  signal?: AbortSignal;
};

type RagRetrieveResult = {
  items: RagRetrieveItem[];
  diagnostics: RagRetrieveDiagnostics;
};

export type RagComputeRunner = {
  run: <T>(args: ComputeRunArgs<T>) => Promise<BackgroundTaskResult<T>>;
};

export type RagComputeOffload = {
  retrieve: (args: {
    projectId: string;
    queryText: string;
    topK: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  }) => Promise<ServiceResult<RagRetrieveResult>>;
};

function sortStableTopK(
  items: readonly RagRetrieveItem[],
  topK: number,
): RagRetrieveItem[] {
  const limit =
    Number.isFinite(topK) && Number.isInteger(topK) && topK > 0
      ? topK
      : items.length;

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (b.item.score !== a.item.score) {
        return b.item.score - a.item.score;
      }
      return a.index - b.index;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

function toFailureCode(
  status: Exclude<BackgroundTaskResult<unknown>["status"], "completed">,
): "SEARCH_TIMEOUT" | "CANCELED" | "INTERNAL_ERROR" {
  if (status === "timeout") {
    return "SEARCH_TIMEOUT";
  }
  if (status === "aborted") {
    return "CANCELED";
  }
  return "INTERNAL_ERROR";
}

function toFailureResult(
  status: Exclude<BackgroundTaskResult<unknown>["status"], "completed">,
  error: Error,
): ServiceResult<RagRetrieveResult> {
  return {
    ok: false,
    error: {
      code: toFailureCode(status),
      message: "RAG compute offload failed",
      details: {
        status,
        error: error.message,
      },
    },
  };
}

export function createRagComputeOffload(args: {
  computeRunner: RagComputeRunner;
  retrieveAndRerankOnCompute: (args: {
    projectId: string;
    queryText: string;
    topK: number;
    signal: AbortSignal;
  }) =>
    | ServiceResult<RagRetrieveResult>
    | Promise<ServiceResult<RagRetrieveResult>>;
  defaultTimeoutMs?: number;
}): RagComputeOffload {
  const configuredTimeoutMs = args.defaultTimeoutMs;
  const defaultTimeoutMs =
    typeof configuredTimeoutMs === "number" &&
    Number.isFinite(configuredTimeoutMs) &&
    configuredTimeoutMs > 0
      ? Math.floor(configuredTimeoutMs)
      : DEFAULT_TIMEOUT_MS;

  return {
    retrieve: async (retrieveArgs) => {
      try {
        const runResult = await args.computeRunner.run({
          timeoutMs: retrieveArgs.timeoutMs ?? defaultTimeoutMs,
          signal: retrieveArgs.signal,
          execute: async (signal) => {
            return await args.retrieveAndRerankOnCompute({
              projectId: retrieveArgs.projectId,
              queryText: retrieveArgs.queryText,
              topK: retrieveArgs.topK,
              signal,
            });
          },
        });

        if (runResult.status !== "completed") {
          return toFailureResult(runResult.status, runResult.error);
        }

        const retrieved = runResult.value;
        if (!retrieved.ok) {
          return retrieved;
        }

        return {
          ok: true,
          data: {
            ...retrieved.data,
            items: sortStableTopK(retrieved.data.items, retrieveArgs.topK),
          },
        };
      } catch (error) {
        return toFailureResult(
          "error",
          error instanceof Error
            ? error
            : new Error(typeof error === "string" ? error : "unknown error"),
        );
      }
    },
  };
}
