import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";

const mocks = vi.hoisted(() => {
  let judgeMode: "ok" | "throw" = "ok";

  const invoke = vi.fn(async (channel: string) => {
    if (channel === "ai:models:list") {
      return {
        ok: true,
        data: {
          source: "proxy",
          items: [{ id: "gpt-5.2", name: "GPT-5.2", provider: "openai" }],
        },
      };
    }
    if (channel === "judge:quality:evaluate") {
      if (judgeMode === "throw") {
        throw new Error("judge unavailable");
      }
      return { ok: true, data: { accepted: true } };
    }
    return { ok: true, data: {} };
  });

  const aiState = {
    status: "idle" as "idle" | "running",
    stream: true,
    selectedSkillId: "builtin:polish",
    skills: [],
    skillsStatus: "ready" as const,
    skillsLastError: null,
    input: "",
    outputText: "judge output text",
    activeRunId: null,
    activeChunkSeq: 0,
    lastRunId: "run-1",
    lastError: null,
    selectionRef: null,
    selectionText: "",
    proposal: null,
    applyStatus: "idle" as const,
    lastCandidates: [],
    usageStats: null,
    selectedCandidateId: null,
    lastRunRequest: null,
    queuePosition: null,
    queuedCount: 0,
    globalRunningCount: 0,
    setStream: vi.fn(),
    setSelectedSkillId: vi.fn(),
    refreshSkills: vi.fn().mockResolvedValue(undefined),
    setInput: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
    setSelectionSnapshot: vi.fn(),
    setProposal: vi.fn(),
    setSelectedCandidateId: vi.fn(),
    persistAiApply: vi.fn().mockResolvedValue(undefined),
    logAiApplyConflict: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined),
    regenerateWithStrongNegative: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
    onStreamEvent: vi.fn(),
  };

  function reset(): void {
    judgeMode = "ok";
    invoke.mockClear();
    aiState.status = "idle";
    aiState.outputText = "judge output text";
    aiState.lastRunId = "run-1";
  }

  function setJudgeMode(mode: "ok" | "throw"): void {
    judgeMode = mode;
  }

  return { invoke, aiState, reset, setJudgeMode };
});

vi.mock("../../stores/aiStore", () => ({
  useAiStore: vi.fn((selector: (state: typeof mocks.aiState) => unknown) =>
    selector(mocks.aiState),
  ),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (
      selector: (state: {
        editor: null;
        projectId: string;
        documentId: string;
        bootstrapStatus: "ready";
        compareMode: boolean;
        setCompareMode: (enabled: boolean, versionId?: string | null) => void;
      }) => unknown,
    ) =>
      selector({
        editor: null,
        projectId: "project-1",
        documentId: "doc-1",
        bootstrapStatus: "ready",
        compareMode: false,
        setCompareMode: vi.fn(),
      }),
  ),
}));

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn(
    (selector: (state: { current: { projectId: string } | null }) => unknown) =>
      selector({ current: { projectId: "project-1" } }),
  ),
}));

vi.mock("../../features/ai/applySelection", () => ({
  captureSelectionRef: vi.fn(() => ({ ok: false })),
  applySelection: vi.fn(),
}));

vi.mock("../../features/ai/useAiStream", () => ({
  useAiStream: vi.fn(),
}));

vi.mock("../../features/ai/modelCatalogEvents", () => ({
  onAiModelCatalogUpdated: vi.fn(() => () => {}),
}));

vi.mock("../../contexts/OpenSettingsContext", () => ({
  useOpenSettings: vi.fn(() => vi.fn()),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: mocks.invoke,
}));

describe("AiPanel error logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  afterEach(() => {
    cleanup();
  });

  it("AUD-C3-S5 logs localStorage read failures with key and operation", async () => {
    mocks.aiState.outputText = "";
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation((key: string) => {
        if (key === "creonow.ai.recentModels") {
          throw new Error("storage blocked");
        }
        return null;
      });

    const { AiPanel } = await import("../../features/ai/AiPanel");
    render(React.createElement(AiPanel));

    await waitFor(() => {
      const matched = consoleErrorSpy.mock.calls.find((call) => {
        const [message, data] = call;
        return (
          String(message).includes("AiPanel localStorage read failed") &&
          typeof data === "object" &&
          data !== null &&
          (data as Record<string, unknown>).operation === "read" &&
          (data as Record<string, unknown>).key === "creonow.ai.recentModels"
        );
      });
      expect(Boolean(matched)).toBe(true);
    });

    getItemSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("AUD-C3-S6 logs judge evaluation failures with run context", async () => {
    mocks.setJudgeMode("throw");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { AiPanel } = await import("../../features/ai/AiPanel");
    render(React.createElement(AiPanel));

    await waitFor(() => {
      const matched = consoleErrorSpy.mock.calls.find((call) => {
        const [message, data] = call;
        return (
          String(message).includes("AiPanel judge evaluation failed") &&
          typeof data === "object" &&
          data !== null &&
          (data as Record<string, unknown>).projectId === "project-1" &&
          (data as Record<string, unknown>).traceId === "run-1"
        );
      });
      expect(Boolean(matched)).toBe(true);
    });

    consoleErrorSpy.mockRestore();
  });
});
