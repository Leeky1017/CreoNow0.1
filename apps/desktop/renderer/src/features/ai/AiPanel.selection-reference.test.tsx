import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type SelectionSnapshot = {
  selectionRef: {
    range: { from: number; to: number };
    selectionTextHash: string;
  };
  selectionText: string;
};

const mocks = vi.hoisted(() => {
  const selectionA: SelectionSnapshot = {
    selectionRef: {
      range: { from: 3, to: 28 },
      selectionTextHash: "hash-a",
    },
    selectionText: `这是第一段需要润色的文本，长度超过预览截断阈值，用于验证 reference card 的展示。${"扩展文本".repeat(
      40,
    )}`,
  };

  const selectionB: SelectionSnapshot = {
    selectionRef: {
      range: { from: 40, to: 66 },
      selectionTextHash: "hash-b",
    },
    selectionText: "这是第二段新选区内容。",
  };

  const listeners: Record<string, (() => void) | undefined> = {};

  const editor = {
    on: vi.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    off: vi.fn((event: string) => {
      listeners[event] = undefined;
    }),
    getJSON: vi.fn(() => ({ type: "doc", content: [] })),
  };

  const aiState = {
    status: "idle" as const,
    stream: true,
    selectedSkillId: "builtin:polish",
    skills: [
      {
        id: "builtin:polish",
        name: "Polish",
        description: "Polish text",
        scope: "global" as const,
        enabled: true,
        valid: true,
      },
    ],
    skillsStatus: "ready" as const,
    skillsLastError: null,
    input: "",
    outputText: "",
    activeRunId: null,
    activeChunkSeq: 0,
    lastRunId: null,
    lastError: null,
    selectionRef: null as SelectionSnapshot["selectionRef"] | null,
    selectionText: "",
    proposal: null,
    applyStatus: "idle" as const,
    lastCandidates: [],
    usageStats: null,
    selectedCandidateId: null,
    lastRunRequest: null,
    setStream: vi.fn(),
    setSelectedSkillId: vi.fn(),
    refreshSkills: vi.fn(async () => undefined),
    setInput: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
    setSelectionSnapshot: vi.fn(),
    setProposal: vi.fn(),
    setSelectedCandidateId: vi.fn(),
    persistAiApply: vi.fn(async () => undefined),
    logAiApplyConflict: vi.fn(async () => undefined),
    run: vi.fn(async (_args?: { inputOverride?: string }) => undefined),
    regenerateWithStrongNegative: vi.fn(async () => undefined),
    cancel: vi.fn(async () => ({ ok: true })),
    onStreamEvent: vi.fn(),
  };

  return {
    aiState,
    listeners,
    editor,
    selectionA,
    selectionB,
  };
});

const captureSelectionRefMock = vi.hoisted(() => vi.fn());

vi.mock("../../stores/aiStore", () => ({
  useAiStore: vi.fn((selector: (state: typeof mocks.aiState) => unknown) =>
    selector(mocks.aiState),
  ),
}));

vi.mock("../../stores/editorStore", () => ({
  useEditorStore: vi.fn(
    (
      selector: (state: {
        editor: typeof mocks.editor;
        projectId: string;
        documentId: string;
        bootstrapStatus: "ready";
        setCompareMode: (enabled: boolean, versionId?: string | null) => void;
      }) => unknown,
    ) =>
      selector({
        editor: mocks.editor,
        projectId: "project-1",
        documentId: "doc-1",
        bootstrapStatus: "ready",
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
  captureSelectionRef: captureSelectionRefMock,
  applySelection: vi.fn(),
}));

vi.mock("./useAiStream", () => ({
  useAiStream: vi.fn(),
}));

vi.mock("./modelCatalogEvents", () => ({
  onAiModelCatalogUpdated: vi.fn(() => () => {}),
}));

vi.mock("../../components/layout/RightPanel", () => ({
  useOpenSettings: vi.fn(() => vi.fn()),
}));

vi.mock("../../lib/ipcClient", () => ({
  invoke: vi.fn(async (channel: string) => {
    if (channel === "ai:models:list") {
      return {
        ok: true,
        data: {
          source: "proxy",
          items: [{ id: "gpt-5.2", name: "GPT-5.2", provider: "openai" }],
        },
      };
    }
    return { ok: true, data: {} };
  }),
}));

async function renderAiPanel(): Promise<void> {
  const { AiPanel } = await import("./AiPanel");

  await act(async () => {
    render(<AiPanel />);
  });

  await waitFor(() => {
    expect(screen.getByTestId("ai-panel")).toBeInTheDocument();
  });
}

describe("AiPanel selection reference card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aiState.status = "idle";
    mocks.aiState.input = "";
    mocks.aiState.selectionRef = null;
    mocks.aiState.selectionText = "";
    captureSelectionRefMock.mockReturnValue({
      ok: true,
      data: mocks.selectionA,
    });
  });

  it("should render selection reference card with preview when selection exists", async () => {
    mocks.aiState.selectionRef = mocks.selectionA.selectionRef;
    mocks.aiState.selectionText = mocks.selectionA.selectionText;

    await renderAiPanel();

    expect(
      screen.getByTestId("ai-selection-reference-card"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("ai-selection-reference-preview").textContent,
    ).toContain("...");
    expect(
      screen.getByTestId("ai-selection-reference-close"),
    ).toBeInTheDocument();
  });

  it("should clear selection snapshot when user closes reference card", async () => {
    const user = userEvent.setup();
    mocks.aiState.selectionRef = mocks.selectionA.selectionRef;
    mocks.aiState.selectionText = mocks.selectionA.selectionText;

    await renderAiPanel();

    await user.click(screen.getByTestId("ai-selection-reference-close"));

    expect(mocks.aiState.setSelectionSnapshot).toHaveBeenCalledWith(null);
  });

  it("should send with selection context and clear reference after Enter", async () => {
    mocks.aiState.input = "润色这段话";
    mocks.aiState.selectionRef = mocks.selectionA.selectionRef;
    mocks.aiState.selectionText = mocks.selectionA.selectionText;

    await renderAiPanel();

    fireEvent.keyDown(screen.getByTestId("ai-input"), {
      key: "Enter",
      code: "Enter",
      shiftKey: false,
    });

    await waitFor(() => {
      expect(mocks.aiState.run).toHaveBeenCalledTimes(1);
    });

    const payload = mocks.aiState.run.mock.calls[0]?.[0] as
      | { inputOverride?: string }
      | undefined;
    expect(payload?.inputOverride ?? "").toContain("润色这段话");
    expect(payload?.inputOverride ?? "").toContain(
      mocks.selectionA.selectionText,
    );
    expect(mocks.aiState.setSelectionSnapshot).toHaveBeenCalledWith(null);
  });

  it("should replace existing reference when a new selection is made", async () => {
    mocks.aiState.selectionRef = mocks.selectionA.selectionRef;
    mocks.aiState.selectionText = mocks.selectionA.selectionText;

    await renderAiPanel();

    captureSelectionRefMock.mockReturnValueOnce({
      ok: true,
      data: mocks.selectionB,
    });

    const selectionUpdate = mocks.listeners.selectionUpdate;
    expect(selectionUpdate).toBeTypeOf("function");
    selectionUpdate?.();

    expect(mocks.aiState.setSelectionSnapshot).toHaveBeenCalledWith(
      mocks.selectionB,
    );
  });

  it("should not render reference card when no selection exists", async () => {
    mocks.aiState.selectionRef = null;
    mocks.aiState.selectionText = "";

    await renderAiPanel();

    expect(
      screen.queryByTestId("ai-selection-reference-card"),
    ).not.toBeInTheDocument();
  });
});
