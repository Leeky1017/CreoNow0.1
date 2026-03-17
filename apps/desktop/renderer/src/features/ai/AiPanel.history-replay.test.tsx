import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AiPanel } from "./AiPanel";
import type { AiStore } from "../../stores/aiStore";

vi.mock("../../stores/aiStore", () => ({
  useAiStore: vi.fn((selector) => {
    const state = {
      status: "idle" as const,
      stream: false,
      selectedSkillId: "default",
      skills: [
        {
          id: "default",
          name: "Default Skill",
          enabled: true,
          valid: true,
          scope: "global",
        },
      ],
      skillsStatus: "ready" as const,
      skillsLastError: null,
      input: "",
      outputText: "",
      lastRunId: null,
      activeRunId: null,
      activeChunkSeq: 0,
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
      chatSessions: [],
      chatSessionsStatus: "ready" as const,
      activeChatSessionId: "session-1",
      activeChatMessages: [
        {
          messageId: "m1",
          projectId: "project-1",
          role: "user" as const,
          content: "第一条历史问题",
          timestamp: 1,
          traceId: "trace-1",
        },
        {
          messageId: "m2",
          projectId: "project-1",
          role: "assistant" as const,
          content: "第一条历史回答",
          timestamp: 2,
          traceId: "trace-1",
        },
      ],
      setInput: vi.fn(),
      setStream: vi.fn(),
      setSelectedSkillId: vi.fn(),
      refreshSkills: vi.fn().mockResolvedValue(undefined),
      clearError: vi.fn(),
      setError: vi.fn(),
      setSelectionSnapshot: vi.fn(),
      setProposal: vi.fn(),
      setSelectedCandidateId: vi.fn(),
      persistAiApply: vi.fn(),
      logAiApplyConflict: vi.fn(),
      run: vi.fn().mockResolvedValue({ ok: true }),
      regenerateWithStrongNegative: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state as unknown as AiStore);
  }),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector) => {
    const state = {
      editor: null,
      bootstrapStatus: "ready",
      compareMode: false,
      setCompareMode: vi.fn(),
      projectId: null,
      documentId: null,
    };
    return selector(state);
  }),
}));

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      current: null,
    };
    return selector(state);
  }),
}));

vi.mock("./useAiStream", () => ({
  useAiStream: vi.fn(),
}));

describe("AiPanel history replay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("选择历史会话后应展示历史消息回放", () => {
    render(<AiPanel />);

    expect(screen.getByTestId("ai-history-replay-list")).toBeInTheDocument();
    expect(screen.getByText("第一条历史问题")).toBeInTheDocument();
    expect(screen.getByText("第一条历史回答")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-output")).not.toBeInTheDocument();
  });
});
