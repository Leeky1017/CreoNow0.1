import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiPanel } from "./AiPanel";

// Mock stores (same pattern as AiPanel.test.tsx)
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
    return selector(state);
  }),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn((selector) => {
    const state = {
      editor: null,
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

describe("AiPanel aria-live (WB-FE-ARIA-S1)", () => {
  it("AI 输出容器应包含 aria-live='polite'", () => {
    render(<AiPanel />);

    const output = screen.getByTestId("ai-output");
    expect(output).toHaveAttribute("aria-live", "polite");
  });

  it("AI 输出容器应包含 aria-atomic='false'", () => {
    render(<AiPanel />);

    const output = screen.getByTestId("ai-output");
    expect(output).toHaveAttribute("aria-atomic", "false");
  });
});
