import { randomUUID } from "node:crypto";

import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type GenerationTraceMemoryType = "working" | "episodic" | "semantic";

export type GenerationTrace = {
  generationId: string;
  projectId: string;
  memoryReferences: {
    working: string[];
    episodic: string[];
    semantic: string[];
  };
  influenceWeights: Array<{
    memoryType: GenerationTraceMemoryType;
    referenceId: string;
    weight: number;
  }>;
  createdAt: number;
  updatedAt: number;
};

export type GenerationTraceFeedback = {
  feedbackId: string;
  projectId: string;
  generationId: string;
  verdict: "correct" | "incorrect";
  reason?: string;
  createdAt: number;
};

export type MemoryTraceService = {
  getTrace: (args: {
    projectId: string;
    generationId: string;
  }) => ServiceResult<{ trace: GenerationTrace }>;
  recordFeedback: (args: {
    projectId: string;
    generationId: string;
    verdict: "correct" | "incorrect";
    reason?: string;
  }) => ServiceResult<{ accepted: true; feedbackId: string }>;
  upsertTrace: (trace: GenerationTrace) => void;
  listFeedbackForGeneration: (args: {
    generationId: string;
  }) => GenerationTraceFeedback[];
};

function nowTs(): number {
  return Date.now();
}

function cloneTrace(trace: GenerationTrace): GenerationTrace {
  return {
    generationId: trace.generationId,
    projectId: trace.projectId,
    memoryReferences: {
      working: [...trace.memoryReferences.working],
      episodic: [...trace.memoryReferences.episodic],
      semantic: [...trace.memoryReferences.semantic],
    },
    influenceWeights: trace.influenceWeights.map((item) => ({ ...item })),
    createdAt: trace.createdAt,
    updatedAt: trace.updatedAt,
  };
}

function hasOnlyStrings(values: unknown): values is string[] {
  return (
    Array.isArray(values) && values.every((value) => typeof value === "string")
  );
}

function isValidTrace(trace: GenerationTrace): boolean {
  if (
    trace.generationId.trim().length === 0 ||
    trace.projectId.trim().length === 0
  ) {
    return false;
  }
  if (
    !hasOnlyStrings(trace.memoryReferences.working) ||
    !hasOnlyStrings(trace.memoryReferences.episodic) ||
    !hasOnlyStrings(trace.memoryReferences.semantic)
  ) {
    return false;
  }
  return trace.influenceWeights.every((item) => {
    if (
      item.memoryType !== "working" &&
      item.memoryType !== "episodic" &&
      item.memoryType !== "semantic"
    ) {
      return false;
    }
    if (
      typeof item.referenceId !== "string" ||
      item.referenceId.trim().length === 0
    ) {
      return false;
    }
    return Number.isFinite(item.weight);
  });
}

function normalizeReason(reason: string | undefined): string | undefined {
  if (typeof reason !== "string") {
    return undefined;
  }
  const trimmed = reason.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Build an in-memory GenerationTrace service for MS-3 provenance flows.
 *
 * Why: provenance queries/feedback must be testable without DB coupling and
 * return deterministic, explicit error codes for IPC handlers.
 */
export function createInMemoryMemoryTraceService(args?: {
  now?: () => number;
  seedTraces?: GenerationTrace[];
}): MemoryTraceService {
  const now = args?.now ?? nowTs;
  const traces = new Map<string, GenerationTrace>();
  const feedbackByGeneration = new Map<string, GenerationTraceFeedback[]>();

  for (const trace of args?.seedTraces ?? []) {
    traces.set(trace.generationId, cloneTrace(trace));
  }

  return {
    getTrace: ({ projectId, generationId }) => {
      const normalizedProjectId = projectId.trim();
      const normalizedGenerationId = generationId.trim();
      if (
        normalizedProjectId.length === 0 ||
        normalizedGenerationId.length === 0
      ) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId and generationId are required",
        );
      }

      const trace = traces.get(normalizedGenerationId);
      if (!trace || !isValidTrace(trace)) {
        return ipcError("MEMORY_TRACE_MISMATCH", "Generation trace mismatch", {
          generationId: normalizedGenerationId,
        });
      }

      if (trace.projectId !== normalizedProjectId) {
        return ipcError(
          "MEMORY_SCOPE_DENIED",
          "Cross-project trace access denied",
          {
            generationId: normalizedGenerationId,
          },
        );
      }

      return {
        ok: true,
        data: {
          trace: cloneTrace(trace),
        },
      };
    },

    recordFeedback: ({ projectId, generationId, verdict, reason }) => {
      if (verdict !== "correct" && verdict !== "incorrect") {
        return ipcError(
          "INVALID_ARGUMENT",
          "verdict must be correct or incorrect",
        );
      }

      const traced = traces.get(generationId.trim());
      if (!traced || !isValidTrace(traced)) {
        return ipcError("MEMORY_TRACE_MISMATCH", "Generation trace mismatch", {
          generationId: generationId.trim(),
        });
      }
      if (traced.projectId !== projectId.trim()) {
        return ipcError(
          "MEMORY_SCOPE_DENIED",
          "Cross-project trace access denied",
          {
            generationId: generationId.trim(),
          },
        );
      }

      const feedback: GenerationTraceFeedback = {
        feedbackId: randomUUID(),
        projectId: traced.projectId,
        generationId: traced.generationId,
        verdict,
        reason: normalizeReason(reason),
        createdAt: now(),
      };

      const existing = feedbackByGeneration.get(traced.generationId) ?? [];
      existing.push(feedback);
      feedbackByGeneration.set(traced.generationId, existing);

      return {
        ok: true,
        data: { accepted: true, feedbackId: feedback.feedbackId },
      };
    },

    upsertTrace: (trace) => {
      traces.set(trace.generationId, cloneTrace(trace));
    },

    listFeedbackForGeneration: ({ generationId }) => {
      const list = feedbackByGeneration.get(generationId.trim()) ?? [];
      return list.map((item) => ({ ...item }));
    },
  };
}
