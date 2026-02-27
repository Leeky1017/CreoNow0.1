import React from "react";
import { create } from "zustand";

import type {
  IpcError,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import type { AiStreamEvent } from "@shared/types/ai";
import type { IpcInvoke } from "../lib/ipcTypes";

export type AiStatus =
  | "idle"
  | "running"
  | "streaming"
  | "canceled"
  | "timeout"
  | "error";

export type SelectionRef = {
  range: { from: number; to: number };
  selectionTextHash: string;
};

export type AiApplyStatus = "idle" | "applying" | "applied";

export type AiProposal = {
  runId: string;
  selectionRef: SelectionRef;
  selectionText: string;
  replacementText: string;
};
export type SkillListItem =
  IpcResponseData<"skill:registry:list">["items"][number];

export type PromptDiagnostics = {
  stablePrefixHash: string;
  promptHash: string;
};

export type AiRunMode = "agent" | "plan" | "ask";
export type AiRunModel = string;
export type AiUsageStats = {
  promptTokens: number;
  completionTokens: number;
  sessionTotalTokens: number;
  estimatedCostUsd?: number;
};
export type AiCandidate = {
  id: string;
  runId: string;
  text: string;
  summary: string;
};
export type AiRunRequestSnapshot = {
  input: string;
  mode: AiRunMode;
  model: AiRunModel;
  candidateCount: number;
  stream: boolean;
  context?: { projectId?: string; documentId?: string };
};

export type { IpcInvoke };

export type AiState = {
  status: AiStatus;
  stream: boolean;
  selectedSkillId: string;
  skills: SkillListItem[];
  skillsStatus: "idle" | "loading" | "ready" | "error";
  skillsLastError: IpcError | null;
  input: string;
  outputText: string;
  activeRunId: string | null;
  activeChunkSeq: number;
  lastRunId: string | null;
  lastError: IpcError | null;
  selectionRef: SelectionRef | null;
  selectionText: string;
  proposal: AiProposal | null;
  applyStatus: AiApplyStatus;
  lastCandidates: AiCandidate[];
  usageStats: AiUsageStats | null;
  selectedCandidateId: string | null;
  lastRunRequest: AiRunRequestSnapshot | null;
  queuePosition: number | null;
  queuedCount: number;
  globalRunningCount: number;
};

export type AiActions = {
  setStream: (enabled: boolean) => void;
  setSelectedSkillId: (skillId: string) => void;
  refreshSkills: () => Promise<void>;
  setInput: (input: string) => void;
  clearError: () => void;
  setError: (error: IpcError | null) => void;
  setSelectionSnapshot: (
    snapshot: {
      selectionRef: SelectionRef;
      selectionText: string;
    } | null,
  ) => void;
  setProposal: (proposal: AiProposal | null) => void;
  setSelectedCandidateId: (candidateId: string | null) => void;
  persistAiApply: (args: {
    projectId: string;
    documentId: string;
    contentJson: string;
    runId: string;
  }) => Promise<void>;
  logAiApplyConflict: (args: {
    documentId: string;
    runId: string;
  }) => Promise<void>;
  run: (args?: {
    inputOverride?: string;
    context?: { projectId?: string; documentId?: string };
    promptDiagnostics?: PromptDiagnostics;
    mode?: AiRunMode;
    model?: AiRunModel;
    candidateCount?: number;
    streamOverride?: boolean;
  }) => Promise<void>;
  regenerateWithStrongNegative: (args?: {
    projectId?: string;
  }) => Promise<void>;
  cancel: () => Promise<void>;
  onStreamEvent: (event: AiStreamEvent) => void;
};

export type AiStore = AiState & AiActions;

export type UseAiStore = ReturnType<typeof createAiStore>;

const AiStoreContext = React.createContext<UseAiStore | null>(null);

/**
 * Derive an AI status from an IPC error.
 *
 * Why: renderer must map stable error codes into a stable state machine.
 */
function statusFromError(error: IpcError): AiStatus {
  if (error.code === "TIMEOUT" || error.code === "SKILL_TIMEOUT") {
    return "timeout";
  }
  if (error.code === "CANCELED") {
    return "canceled";
  }
  return "error";
}

function toUnexpectedIpcError(message: string, cause: unknown): IpcError {
  const causeMessage =
    cause instanceof Error ? cause.message : String(cause ?? "unknown");
  return {
    code: "INTERNAL",
    message,
    details: { cause: causeMessage },
  };
}

/**
 * Normalize candidateCount to the fixed 1..5 contract range.
 */
function normalizeCandidateCount(raw: number | undefined): number {
  if (!Number.isFinite(raw ?? 1)) {
    return 1;
  }
  const rounded = Math.trunc(raw ?? 1);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > 5) {
    return 5;
  }
  return rounded;
}

/**
 * Create a zustand store for AI runtime state.
 *
 * Why: UI must support stream/cancel/timeout/upstream-error with deterministic
 * state transitions for Windows E2E.
 */
export function createAiStore(deps: { invoke: IpcInvoke }) {
  return create<AiStore>((set, get) => ({
    status: "idle",
    stream: true,
    selectedSkillId: "builtin:polish",
    skills: [],
    skillsStatus: "idle",
    skillsLastError: null,
    input: "",
    outputText: "",
    activeRunId: null,
    activeChunkSeq: 0,
    lastRunId: null,
    lastError: null,
    selectionRef: null,
    selectionText: "",
    proposal: null,
    applyStatus: "idle",
    lastCandidates: [],
    usageStats: null,
    selectedCandidateId: null,
    lastRunRequest: null,
    queuePosition: null,
    queuedCount: 0,
    globalRunningCount: 0,

    setStream: (enabled) => set({ stream: enabled }),

    setSelectedSkillId: (skillId) => set({ selectedSkillId: skillId }),

    refreshSkills: async () => {
      const state = get();
      if (state.skillsStatus === "loading") {
        return;
      }

      set({ skillsStatus: "loading", skillsLastError: null });
      let nextStatus: "ready" | "error" = "error";
      let nextError: IpcError | null = {
        code: "INTERNAL",
        message: "Failed to refresh skills",
      };
      let nextSkills = get().skills;
      let nextSelectedSkillId = get().selectedSkillId;

      try {
        const res = await deps.invoke("skill:registry:list", {
          includeDisabled: true,
        });
        if (!res.ok) {
          nextError = res.error;
        } else {
          const currentSelected = get().selectedSkillId;
          const selectedExists = res.data.items.some(
            (s) => s.id === currentSelected,
          );
          const fallback =
            res.data.items.find((s) => s.enabled && s.valid)?.id ??
            currentSelected;

          nextStatus = "ready";
          nextError = null;
          nextSkills = res.data.items;
          nextSelectedSkillId = selectedExists ? currentSelected : fallback;
        }
      } catch (error) {
        nextError = toUnexpectedIpcError("Failed to refresh skills", error);
      }

      if (nextStatus === "ready") {
        set({
          skillsStatus: "ready",
          skills: nextSkills,
          skillsLastError: null,
          selectedSkillId: nextSelectedSkillId,
        });
        return;
      }

      set({
        skillsStatus: "error",
        skillsLastError: nextError,
      });
    },

    setInput: (input) => set({ input }),

    clearError: () => set({ lastError: null }),
    setError: (error) => set({ lastError: error }),

    setSelectionSnapshot: (snapshot) => {
      set({
        selectionRef: snapshot?.selectionRef ?? null,
        selectionText: snapshot?.selectionText ?? "",
      });
    },

    setProposal: (proposal) =>
      set({
        proposal,
        applyStatus: "idle",
      }),

    setSelectedCandidateId: (candidateId) =>
      set({
        selectedCandidateId: candidateId,
      }),

    persistAiApply: async (args) => {
      set({ applyStatus: "applying", lastError: null });

      const res = await deps.invoke("file:document:save", {
        projectId: args.projectId,
        documentId: args.documentId,
        contentJson: args.contentJson,
        actor: "ai",
        reason: "ai-accept",
      });

      if (!res.ok) {
        set({ applyStatus: "idle", lastError: res.error });
        return;
      }

      set({
        applyStatus: "applied",
        proposal: null,
        selectionRef: null,
        selectionText: "",
      });
    },

    logAiApplyConflict: async (args) => {
      await deps.invoke("version:aiapply:logconflict", {
        documentId: args.documentId,
        runId: args.runId,
      });
    },

    run: async (args) => {
      const state = get();
      if (state.status === "running" || state.status === "streaming") {
        return;
      }

      const selectedSkill =
        state.skills.find((s) => s.id === state.selectedSkillId) ?? null;
      if (selectedSkill && !selectedSkill.enabled) {
        set({
          status: "error",
          lastError: { code: "UNSUPPORTED", message: "Skill is disabled" },
        });
        return;
      }
      if (selectedSkill && !selectedSkill.valid) {
        set({
          status: "error",
          lastError: {
            code: selectedSkill.error_code ?? "INVALID_ARGUMENT",
            message: selectedSkill.error_message ?? "Skill is invalid",
          },
        });
        return;
      }
      const inputToSend = args?.inputOverride ?? state.input;
      const candidateCount = normalizeCandidateCount(args?.candidateCount);
      const stream =
        typeof args?.streamOverride === "boolean"
          ? args.streamOverride
          : state.stream;
      const requestSnapshot: AiRunRequestSnapshot = {
        input: inputToSend,
        mode: args?.mode ?? "ask",
        model: args?.model ?? "gpt-5.2",
        candidateCount,
        stream,
        context: args?.context ?? {},
      };

      set({
        status: "running",
        outputText: "",
        lastError: null,
        activeRunId: null,
        activeChunkSeq: 0,
        lastRunId: null,
        proposal: null,
        applyStatus: "idle",
        lastCandidates: [],
        usageStats: null,
        selectedCandidateId: null,
        lastRunRequest: requestSnapshot,
        queuePosition: null,
        queuedCount: 0,
        globalRunningCount: 0,
      });

      const res = await deps.invoke("ai:skill:run", {
        skillId: state.selectedSkillId,
        input: inputToSend,
        mode: requestSnapshot.mode,
        model: requestSnapshot.model,
        stream: requestSnapshot.stream,
        candidateCount: requestSnapshot.candidateCount,
        context: args?.context ?? {},
        promptDiagnostics: args?.promptDiagnostics,
      });

      if (!res.ok) {
        set({
          status: statusFromError(res.error),
          lastError: res.error,
          activeRunId: null,
          activeChunkSeq: 0,
          lastRunId: null,
          lastCandidates: [],
          usageStats: null,
          selectedCandidateId: null,
          queuePosition: null,
          queuedCount: 0,
          globalRunningCount: 0,
        });
        return;
      }

      if (typeof res.data.outputText === "string") {
        const candidates = Array.isArray(res.data.candidates)
          ? res.data.candidates
          : [];
        set({
          status: "idle",
          outputText: res.data.outputText,
          activeRunId: null,
          activeChunkSeq: 0,
          lastRunId: res.data.runId,
          lastCandidates: candidates,
          usageStats: res.data.usage ?? null,
          selectedCandidateId: candidates[0]?.id ?? null,
          lastError: null,
          queuePosition: null,
          queuedCount: 0,
          globalRunningCount: 0,
        });
        return;
      }

      set({
        status: "running",
        activeRunId: res.data.executionId,
        activeChunkSeq: 0,
        lastRunId: res.data.runId,
        lastCandidates: Array.isArray(res.data.candidates)
          ? res.data.candidates
          : [],
        usageStats: res.data.usage ?? null,
        selectedCandidateId: Array.isArray(res.data.candidates)
          ? (res.data.candidates[0]?.id ?? null)
          : null,
        lastError: null,
        queuePosition: null,
        queuedCount: 0,
        globalRunningCount: 0,
      });
    },

    regenerateWithStrongNegative: async (args) => {
      const state = get();
      if (!state.lastRunRequest) {
        return;
      }

      const selectedRunId =
        state.lastCandidates.find(
          (item) => item.id === state.selectedCandidateId,
        )?.runId ?? state.lastRunId;
      if (!selectedRunId) {
        return;
      }

      const evidenceRef = "feedback=strong_negative";
      const feedbackRes = await deps.invoke("ai:skill:feedback", {
        runId: selectedRunId,
        action: "reject",
        evidenceRef,
      });
      if (!feedbackRes.ok) {
        set({
          status: statusFromError(feedbackRes.error),
          lastError: feedbackRes.error,
        });
        return;
      }

      const normalizedProjectId = args?.projectId?.trim() ?? "";
      if (normalizedProjectId.length > 0) {
        const traceFeedbackRes = await deps.invoke("memory:trace:feedback", {
          projectId: normalizedProjectId,
          generationId: selectedRunId,
          verdict: "incorrect",
          reason: evidenceRef,
        });
        if (!traceFeedbackRes.ok) {
          set({
            status: statusFromError(traceFeedbackRes.error),
            lastError: traceFeedbackRes.error,
          });
          return;
        }
      }

      await get().run({
        inputOverride: state.lastRunRequest.input,
        context: state.lastRunRequest.context,
        mode: state.lastRunRequest.mode,
        model: state.lastRunRequest.model,
        candidateCount: state.lastRunRequest.candidateCount,
        streamOverride: state.lastRunRequest.stream,
      });
    },

    cancel: async () => {
      const state = get();
      if (
        (state.status !== "running" && state.status !== "streaming") ||
        !state.activeRunId
      ) {
        return;
      }

      const runId = state.activeRunId;
      set({
        status: "canceled",
        activeRunId: null,
        activeChunkSeq: 0,
        lastError: null,
        queuePosition: null,
        queuedCount: 0,
        globalRunningCount: 0,
      });

      const res = await deps.invoke("ai:skill:cancel", {
        runId,
      });
      if (!res.ok) {
        set({ status: statusFromError(res.error), lastError: res.error });
      }
    },

    onStreamEvent: (event) => {
      const state = get();
      if (!state.activeRunId || event.executionId !== state.activeRunId) {
        return;
      }

      if (event.type === "chunk") {
        set((prev) => {
          if (!prev.activeRunId || event.executionId !== prev.activeRunId) {
            return prev;
          }

          const shouldReset = event.seq === 1 && prev.activeChunkSeq > 0;
          if (!shouldReset && event.seq <= prev.activeChunkSeq) {
            return prev;
          }

          return {
            status: "streaming" as const,
            outputText: shouldReset
              ? event.chunk
              : `${prev.outputText}${event.chunk}`,
            activeChunkSeq: event.seq,
            lastRunId: event.runId,
            lastCandidates: [],
            usageStats: null,
            selectedCandidateId: null,
            queuePosition: null,
            queuedCount: 0,
            globalRunningCount: 0,
          };
        });
        return;
      }

      if (event.type === "queue") {
        set((prev) => {
          if (!prev.activeRunId || event.executionId !== prev.activeRunId) {
            return prev;
          }

          return {
            queuePosition: event.queuePosition,
            queuedCount: event.queued,
            globalRunningCount: event.globalRunning,
          };
        });
        return;
      }

      if (event.terminal === "completed") {
        set({
          status: "idle",
          outputText: event.outputText,
          activeRunId: null,
          activeChunkSeq: 0,
          lastRunId: event.runId,
          lastError: null,
          lastCandidates: [],
          usageStats: null,
          selectedCandidateId: null,
          queuePosition: null,
          queuedCount: 0,
          globalRunningCount: 0,
        });
        return;
      }

      if (event.terminal === "cancelled") {
        set({
          status: "canceled",
          outputText: event.outputText,
          activeRunId: null,
          activeChunkSeq: 0,
          lastRunId: event.runId,
          lastError: null,
          lastCandidates: [],
          usageStats: null,
          selectedCandidateId: null,
          queuePosition: null,
          queuedCount: 0,
          globalRunningCount: 0,
        });
        return;
      }

      const fallbackError: IpcError = {
        code: "INTERNAL",
        message: "AI stream failed",
      };
      const error = event.error ?? fallbackError;
      set({
        status: statusFromError(error),
        outputText: event.outputText,
        lastError: error,
        activeRunId: null,
        activeChunkSeq: 0,
        lastRunId: event.runId,
        lastCandidates: [],
        usageStats: null,
        selectedCandidateId: null,
        queuePosition: null,
        queuedCount: 0,
        globalRunningCount: 0,
      });
    },
  }));
}

/**
 * Provide an AI store instance for the Workbench UI.
 */
export function AiStoreProvider(props: {
  store: UseAiStore;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AiStoreContext.Provider value={props.store}>
      {props.children}
    </AiStoreContext.Provider>
  );
}

/**
 * Read values from the injected AI store.
 */
export function useAiStore<T>(selector: (state: AiStore) => T): T {
  const store = React.useContext(AiStoreContext);
  if (!store) {
    throw new Error("AiStoreProvider is missing");
  }
  return store(selector);
}

/**
 * Read values from AI store when provider exists, otherwise return null.
 *
 * Why: editor-only surfaces may render without AI context in unit tests.
 */
export function useOptionalAiStore<T>(
  selector: (state: AiStore) => T,
): T | null {
  const store = React.useContext(AiStoreContext);
  if (!store) {
    return null;
  }
  return store(selector);
}
