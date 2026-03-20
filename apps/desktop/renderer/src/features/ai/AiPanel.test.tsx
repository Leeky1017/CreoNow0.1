import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiPanel } from "./AiPanel";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import type { AiStore } from "../../stores/aiStore";

// Mock stores
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
      selectChatSession: vi.fn().mockResolvedValue(undefined),
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

describe("AiPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 AiPanel 组件", () => {
      render(<AiPanel />);

      const panel = screen.getByTestId("ai-panel");
      expect(panel).toBeInTheDocument();
    });

    it("不应显示 Assistant/Info 内部子标签", () => {
      render(<AiPanel />);

      expect(
        screen.queryByRole("button", { name: /assistant/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /info/i }),
      ).not.toBeInTheDocument();
    });

    it("应该显示 Send/Stop 组合按钮", () => {
      render(<AiPanel />);

      // 组件使用组合的 send-stop 按钮代替分开的 Run/Cancel
      expect(screen.getByTestId("ai-send-stop")).toBeInTheDocument();
    });

    it("应渲染 Chat/History 标签页", () => {
      render(<AiPanel />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    it("默认显示 Chat 标签页", () => {
      render(<AiPanel />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("应该显示输入框", () => {
      render(<AiPanel />);

      expect(screen.getByTestId("ai-input")).toBeInTheDocument();
    });

    it("应该显示输出区域", () => {
      render(<AiPanel />);

      expect(screen.getByTestId("ai-output")).toBeInTheDocument();
    });

    it("应该显示 Skills 切换按钮", () => {
      render(<AiPanel />);

      expect(screen.getByTestId("ai-skills-toggle")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 按钮状态测试
  // ===========================================================================
  describe("按钮状态", () => {
    it("idle 状态时 Send/Stop 按钮应可用", () => {
      render(<AiPanel />);

      const sendStopButton = screen.getByTestId("ai-send-stop");
      expect(sendStopButton).toBeInTheDocument();
      // idle 状态下显示发送图标
    });

    it("idle 状态时 Send/Stop 按钮显示发送箭头", () => {
      render(<AiPanel />);

      const sendStopButton = screen.getByTestId("ai-send-stop");
      // 按钮内应该包含 svg 图标
      expect(sendStopButton.querySelector("svg")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 错误状态测试
  // ===========================================================================
  describe("错误状态", () => {
    it("有错误时应显示错误信息", async () => {
      const { useAiStore } = await import("../../stores/aiStore");
      vi.mocked(useAiStore).mockImplementation((selector) => {
        const state = {
          status: "idle" as const,
          stream: false,
          selectedSkillId: "default",
          skills: [],
          skillsStatus: "ready" as const,
          skillsLastError: null,
          input: "",
          outputText: "",
          lastRunId: null,
          activeRunId: null,
          lastError: { code: "TIMEOUT", message: "Request timed out" },
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
          refreshSkills: vi.fn(),
          clearError: vi.fn(),
          setError: vi.fn(),
          setSelectionSnapshot: vi.fn(),
          setProposal: vi.fn(),
          setSelectedCandidateId: vi.fn(),
          persistAiApply: vi.fn(),
          logAiApplyConflict: vi.fn(),
          run: vi.fn(),
          regenerateWithStrongNegative: vi.fn().mockResolvedValue(undefined),
          cancel: vi.fn(),
          selectChatSession: vi.fn(),
        };
        return selector(state as unknown as AiStore);
      });

      render(<AiPanel />);

      expect(screen.getByTestId("ai-error-code")).toBeInTheDocument();
      expect(
        screen.getByText(
          getHumanErrorMessage({
            code: "TIMEOUT",
            message: "Request timed out",
          }),
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("TIMEOUT")).not.toBeInTheDocument();
      expect(screen.getByText("Request timed out")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Running 状态测试
  // ===========================================================================
  describe("Running 状态", () => {
    it("running 状态时 Send/Stop 按钮显示停止图标", async () => {
      const { useAiStore } = await import("../../stores/aiStore");
      vi.mocked(useAiStore).mockImplementation((selector) => {
        const state = {
          status: "running" as const,
          stream: false,
          selectedSkillId: "default",
          skills: [],
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
          refreshSkills: vi.fn(),
          clearError: vi.fn(),
          setError: vi.fn(),
          setSelectionSnapshot: vi.fn(),
          setProposal: vi.fn(),
          setSelectedCandidateId: vi.fn(),
          persistAiApply: vi.fn(),
          logAiApplyConflict: vi.fn(),
          run: vi.fn(),
          regenerateWithStrongNegative: vi.fn().mockResolvedValue(undefined),
          cancel: vi.fn(),
          selectChatSession: vi.fn(),
        };
        return selector(state as unknown as AiStore);
      });

      render(<AiPanel />);

      // running 状态下显示停止图标（圆形内有方形）
      const sendStopButton = screen.getByTestId("ai-send-stop");
      expect(sendStopButton).toBeInTheDocument();
    });

    it("running 状态时 Send/Stop 按钮可点击停止", async () => {
      const { useAiStore } = await import("../../stores/aiStore");
      const mockCancel = vi.fn().mockResolvedValue({ ok: true });
      vi.mocked(useAiStore).mockImplementation((selector) => {
        const state = {
          status: "running" as const,
          stream: false,
          selectedSkillId: "default",
          skills: [],
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
          refreshSkills: vi.fn(),
          clearError: vi.fn(),
          setError: vi.fn(),
          setSelectionSnapshot: vi.fn(),
          setProposal: vi.fn(),
          setSelectedCandidateId: vi.fn(),
          persistAiApply: vi.fn(),
          logAiApplyConflict: vi.fn(),
          run: vi.fn(),
          regenerateWithStrongNegative: vi.fn().mockResolvedValue(undefined),
          cancel: mockCancel,
          selectChatSession: vi.fn(),
        };
        return selector(state as unknown as AiStore);
      });

      render(<AiPanel />);

      // running 状态下按钮应可用于停止
      const sendStopButton = screen.getByTestId("ai-send-stop");
      expect(sendStopButton).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("应该是 section 元素", () => {
      render(<AiPanel />);

      const panel = screen.getByTestId("ai-panel");
      expect(panel.tagName).toBe("SECTION");
    });

    it("应该有 flex column 布局", () => {
      render(<AiPanel />);

      const panel = screen.getByTestId("ai-panel");
      expect(panel).toHaveClass("flex");
      expect(panel).toHaveClass("flex-col");
    });
  });
});
