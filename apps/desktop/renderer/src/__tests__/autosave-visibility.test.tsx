import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";

import { AppToastProvider } from "../components/providers/AppToastProvider";
import { SaveIndicator } from "../components/layout/SaveIndicator";
import {
  useAutoSaveToast,
  useFlushErrorToast,
} from "../hooks/useToastIntegration";
import { createEditorStore, EditorStoreProvider } from "../stores/editorStore";

/**
 * A0-02: 自动保存失败可见化
 *
 * 测试覆盖：
 * - SaveIndicator 四态渲染
 * - SaveIndicator 点击重试
 * - Toast 失败触发（含 dedup）
 * - 文档切换 flush 失败 Toast
 * - saved → idle 自动转换（fake timers）
 */

function createMockInvoke(result: {
  ok: boolean;
  data?: unknown;
  error?: unknown;
}) {
  return vi.fn().mockResolvedValue(result);
}

function AutoSaveToastConsumer(): JSX.Element {
  useAutoSaveToast();
  return <div data-testid="autosave-consumer" />;
}

function FlushErrorToastConsumer(): JSX.Element {
  useFlushErrorToast();
  return <div data-testid="flush-consumer" />;
}

describe("A0-02 SaveIndicator 四态渲染", () => {
  it("idle 状态不显示文字", () => {
    render(<SaveIndicator autosaveStatus="idle" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("");
    expect(el).toHaveAttribute("data-status", "idle");
  });

  it("saving 状态显示 Saving... 和 spinner", () => {
    render(<SaveIndicator autosaveStatus="saving" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("Saving...");
    expect(el).toHaveAttribute("data-status", "saving");
    expect(screen.getByTestId("save-spinner")).toBeInTheDocument();
  });

  it("saved 状态显示 Saved", () => {
    render(<SaveIndicator autosaveStatus="saved" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("Saved");
    expect(el).toHaveAttribute("data-status", "saved");
  });

  it("error 状态显示 Save failed 并可点击", () => {
    const retry = vi.fn();
    render(<SaveIndicator autosaveStatus="error" onRetry={retry} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("Save failed");
    expect(el).toHaveAttribute("data-status", "error");
    expect(el).toHaveAttribute("role", "button");
  });
});

describe("A0-02 SaveIndicator 点击重试", () => {
  it("error 状态点击触发 onRetry", () => {
    const retry = vi.fn();
    render(<SaveIndicator autosaveStatus="error" onRetry={retry} />);
    fireEvent.click(screen.getByTestId("editor-autosave-status"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("error 状态键盘 Enter 触发 onRetry", () => {
    const retry = vi.fn();
    render(<SaveIndicator autosaveStatus="error" onRetry={retry} />);
    fireEvent.keyDown(screen.getByTestId("editor-autosave-status"), {
      key: "Enter",
    });
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("非 error 状态点击不触发 onRetry", () => {
    const retry = vi.fn();
    render(<SaveIndicator autosaveStatus="saved" onRetry={retry} />);
    fireEvent.click(screen.getByTestId("editor-autosave-status"));
    expect(retry).not.toHaveBeenCalled();
  });
});

describe("A0-02 saved → idle 自动转换", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saved 状态 2 秒后自动回到 idle", () => {
    render(<SaveIndicator autosaveStatus="saved" onRetry={vi.fn()} />);
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("Saved");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(el).toHaveTextContent("");
    expect(el).toHaveAttribute("data-status", "idle");
  });

  it("saved 期间如果变 error，不应回到 idle", () => {
    const { rerender } = render(
      <SaveIndicator autosaveStatus="saved" onRetry={vi.fn()} />,
    );
    const el = screen.getByTestId("editor-autosave-status");
    expect(el).toHaveTextContent("Saved");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    rerender(<SaveIndicator autosaveStatus="error" onRetry={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("editor-autosave-status")).toHaveTextContent(
      "Save failed",
    );
  });
});

describe("A0-02 Toast 失败触发 + dedup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("autosave error 触发 error Toast", async () => {
    const store = createEditorStore({
      invoke: createMockInvoke({ ok: true, data: {} }),
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <AutoSaveToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        documentId: "doc-1",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    expect(screen.getByText("Save failed")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to save document. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("同一 documentId 连续 error 只弹一次 Toast（dedup）", async () => {
    const store = createEditorStore({
      invoke: createMockInvoke({ ok: true, data: {} }),
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <AutoSaveToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    // 第一次 error
    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        documentId: "doc-1",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    const toasts1 = screen.getAllByText("Save failed");
    expect(toasts1).toHaveLength(1);

    // 状态回 saving 再回 error（同一 documentId）
    await act(async () => {
      store.setState({ autosaveStatus: "saving" });
    });
    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        autosaveError: { code: "IO_ERROR", message: "Disk full again" },
      });
    });

    // 仍然只有 1 个 toast（dedup 生效，同一 documentId 连续失败）
    const toasts2 = screen.getAllByText("Save failed");
    expect(toasts2).toHaveLength(1);
  });

  it("不同 documentId 的 error 可以再次弹 Toast", async () => {
    const store = createEditorStore({
      invoke: createMockInvoke({ ok: true, data: {} }),
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <AutoSaveToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    // doc-1 error
    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        documentId: "doc-1",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    // 切换到 doc-2 error
    await act(async () => {
      store.setState({ autosaveStatus: "idle" });
    });
    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        documentId: "doc-2",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    // 两个 toast 都存在
    const toasts = screen.getAllByText("Save failed");
    expect(toasts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("A0-02 文档切换 flush 失败 Toast", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("openDocument 前的 flush save 失败时，在新文档上下文弹 warning Toast", async () => {
    const invoke = vi.fn(async (channel: string) => {
      if (channel === "file:document:save") {
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Disk full" },
        };
      }

      if (channel === "file:document:read") {
        return {
          ok: true,
          data: {
            status: "draft",
            contentJson: '{"type":"doc","content":[]}',
          },
        };
      }

      return { ok: true, data: {} };
    });

    const store = createEditorStore({ invoke: invoke as never });

    await act(async () => {
      store.setState({
        projectId: "proj-1",
        documentId: "doc-1",
        lastSavedOrQueuedJson:
          '{"type":"doc","content":[{"type":"paragraph"}]}',
        autosaveStatus: "idle",
        autosaveError: null,
      });
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <FlushErrorToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    await act(async () => {
      await store.getState().openDocument({
        projectId: "proj-1",
        documentId: "doc-2",
      });
    });

    expect(invoke).toHaveBeenCalledWith(
      "file:document:save",
      expect.objectContaining({ documentId: "doc-1", reason: "autosave" }),
    );
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Some changes could not be saved before switching documents.",
      ),
    ).toBeInTheDocument();
  });

  it("普通 autosaveError 或文档切换本身不应误触 flush warning Toast", async () => {
    const store = createEditorStore({
      invoke: createMockInvoke({ ok: true, data: {} }),
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <FlushErrorToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    await act(async () => {
      store.setState({
        documentId: "doc-1",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    await act(async () => {
      store.setState({
        documentId: "doc-2",
        autosaveError: null,
      });
    });

    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });
});

describe("A0-02 retry 成功后的 toast", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("error → saved 转换时弹 retry 成功 Toast", async () => {
    const store = createEditorStore({
      invoke: createMockInvoke({ ok: true, data: {} }),
    });

    render(
      <AppToastProvider>
        <EditorStoreProvider store={store}>
          <AutoSaveToastConsumer />
        </EditorStoreProvider>
      </AppToastProvider>,
    );

    await act(async () => {
      store.setState({
        autosaveStatus: "error",
        documentId: "doc-1",
        autosaveError: { code: "IO_ERROR", message: "Disk full" },
      });
    });

    await act(async () => {
      store.setState({
        autosaveStatus: "saved",
        autosaveError: null,
      });
    });

    expect(screen.getByText("Document saved successfully")).toBeInTheDocument();
  });
});
