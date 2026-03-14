import { beforeEach, describe, expect, it, vi } from "vitest";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => {
  let modelsMode: "ok" | "ai_not_configured" = "ok";

  const invoke = vi.fn(async (channel: string) => {
    if (channel === "ai:models:list") {
      if (modelsMode === "ai_not_configured") {
        return {
          ok: false,
          error: {
            code: "AI_NOT_CONFIGURED",
            message: "Please configure provider first",
          },
        };
      }
      return {
        ok: true,
        data: {
          source: "proxy",
          items: [{ id: "gpt-5.2", name: "GPT-5.2", provider: "openai" }],
        },
      };
    }
    if (channel === "judge:quality:evaluate") {
      return { ok: true, data: { accepted: true } };
    }
    return { ok: true, data: {} };
  });

  const openSettings = vi.fn();

  const aiState = {
    status: "idle" as const,
    stream: true,
    selectedSkillId: "builtin:polish",
    skills: [],
    skillsStatus: "ready" as const,
    skillsLastError: null as {
      code: string;
      message: string;
      details?: unknown;
    } | null,
    input: "",
    outputText: "",
    activeRunId: null,
    activeChunkSeq: 0,
    lastRunId: null,
    lastError: null as {
      code: string;
      message: string;
      details?: unknown;
    } | null,
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
    modelsMode = "ok";
    openSettings.mockReset();
    invoke.mockClear();
    aiState.skillsLastError = null;
    aiState.lastError = null;
    aiState.outputText = "";
    aiState.lastRunId = null;
  }

  function setModelsMode(mode: "ok" | "ai_not_configured"): void {
    modelsMode = mode;
  }

  return { aiState, invoke, openSettings, reset, setModelsMode };
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

vi.mock("./applySelection", () => ({
  captureSelectionRef: vi.fn(() => ({ ok: false })),
  applySelection: vi.fn(),
}));

vi.mock("./useAiStream", () => ({
  useAiStream: vi.fn(),
}));

vi.mock("./modelCatalogEvents", () => ({
  onAiModelCatalogUpdated: vi.fn(() => () => {}),
}));

vi.mock("../../contexts/OpenSettingsContext", () => ({
  useOpenSettings: vi.fn(() => mocks.openSettings),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: mocks.invoke,
}));

describe("AiPanel error guidance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("AI-FE-GUIDE-S1 renders rebuild guidance for DB_ERROR", async () => {
    mocks.aiState.lastError = {
      code: "DB_ERROR",
      message: "Native binding missing",
      details: {
        remediation: {
          command: "pnpm -C apps/desktop rebuild:native",
          restartRequired: true,
        },
      },
    };

    const { AiPanel } = await import("./AiPanel");
    render(<AiPanel />);

    expect(await screen.findByTestId("ai-error-guide-db")).toBeInTheDocument();
    expect(
      screen.getByText("pnpm -C apps/desktop rebuild:native"),
    ).toBeInTheDocument();
    expect(screen.getByText(/restart the app/i)).toBeInTheDocument();
  });

  it("AI-FE-GUIDE-S1b renders rebuild guidance when skillsLastError is DB_ERROR", async () => {
    mocks.aiState.skillsLastError = {
      code: "DB_ERROR",
      message: "SQLite binding mismatch",
      details: {
        remediation: {
          command: "pnpm -C apps/desktop rebuild:native --workspace-root",
          restartRequired: true,
        },
      },
    };

    const { AiPanel } = await import("./AiPanel");
    render(<AiPanel />);

    expect(await screen.findByTestId("ai-error-guide-db")).toBeInTheDocument();
    expect(
      screen.getByText("pnpm -C apps/desktop rebuild:native --workspace-root"),
    ).toBeInTheDocument();
  });

  it("AI-FE-GUIDE-S2 renders settings guidance for AI_NOT_CONFIGURED", async () => {
    mocks.setModelsMode("ai_not_configured");

    const { AiPanel } = await import("./AiPanel");
    render(<AiPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-error-guide-provider")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("ai-error-guide-open-settings"));
    expect(mocks.openSettings).toHaveBeenCalledWith("ai");
  });

  it("AI-FE-GUIDE-S2b falls back to generic error card for unknown code", async () => {
    mocks.aiState.lastError = {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong",
    };

    const { AiPanel } = await import("./AiPanel");
    render(<AiPanel />);

    expect(await screen.findByTestId("ai-error-code")).toHaveTextContent(
      getHumanErrorMessage({
        code: "UNKNOWN_ERROR" as never,
        message: "Something went wrong",
      }),
    );
    expect(screen.queryByTestId("ai-error-guide-db")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("ai-error-guide-provider"),
    ).not.toBeInTheDocument();
  });

  it("AI-FE-GUIDE-S2c keeps UPSTREAM_ERROR on generic error card", async () => {
    mocks.aiState.lastError = {
      code: "UPSTREAM_ERROR",
      message: "Gateway timeout",
    };

    const { AiPanel } = await import("./AiPanel");
    render(<AiPanel />);

    expect(await screen.findByTestId("ai-error-code")).toHaveTextContent(
      getHumanErrorMessage({
        code: "UPSTREAM_ERROR",
        message: "Gateway timeout",
      }),
    );
    expect(
      screen.queryByTestId("ai-error-guide-provider"),
    ).not.toBeInTheDocument();
  });
});
