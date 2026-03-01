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
      lastError: null,
      selectionRef: null,
      selectionText: "",
      proposal: null,
      applyStatus: "idle" as const,
      lastCandidates: [],
      usageStats: null,
      selectedCandidateId: null,
      lastRunRequest: null,
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

describe("AiPanel.layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[WB-FE-AI-TAB-S2] AI 主界面不渲染独立 header 行", () => {
    render(<AiPanel />);

    const panel = screen.getByTestId("ai-panel");
    expect(panel.querySelector("header")).toBeNull();
    expect(screen.queryByTestId("ai-history-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ai-new-chat")).not.toBeInTheDocument();
  });

  it("[WB-FE-AI-TAB-S3] AI 主界面不暴露 candidateCount 循环按钮", () => {
    render(<AiPanel />);

    expect(screen.queryByTestId("ai-candidate-count")).not.toBeInTheDocument();
  });
});
