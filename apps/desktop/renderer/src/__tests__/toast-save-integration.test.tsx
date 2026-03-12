import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppToastProvider } from "../components/providers/AppToastProvider";
import { useAutoSaveToast } from "../hooks/useToastIntegration";
import {
  createEditorStore,
  EditorStoreProvider,
} from "../stores/editorStore";

/**
 * 测试：保存场景 Toast 集成
 *
 * AC-3: 普通保存成功后不触发 success Toast（仅重试后恢复才触发）
 * AC-4: 文档保存失败后出现 error Toast（含重试 action）
 */

function createMockInvoke(result: { ok: boolean; data?: unknown; error?: unknown }) {
  return vi.fn().mockResolvedValue(result);
}

function SaveToastConsumer(): JSX.Element {
  useAutoSaveToast();
  return <div data-testid="consumer" />;
}

describe("toast-save integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("editorStore.save() 成功后不触发 success Toast (AC-3)", async () => {
    const mockInvoke = createMockInvoke({
      ok: true,
      data: { version: 1 },
    });

    const store = createEditorStore({ invoke: mockInvoke });

    function Harness(): JSX.Element {
      return (
        <AppToastProvider>
          <EditorStoreProvider store={store}>
            <SaveToastConsumer />
          </EditorStoreProvider>
        </AppToastProvider>
      );
    }

    render(<Harness />);

    // Bootstrap the store first
    await act(async () => {
      store.setState({
        bootstrapStatus: "ready",
        projectId: "p1",
        documentId: "d1",
        documentContentJson: "[]",
        autosaveStatus: "idle",
      });
    });

    // Trigger save
    await act(async () => {
      await store.getState().save({
        projectId: "p1",
        documentId: "d1",
        contentJson: "[]",
        actor: "user",
        reason: "manual-save",
      });
    });

    // Should NOT show success toast (only retry recovery triggers success toast)
    expect(screen.queryByText("Document saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Save recovered")).not.toBeInTheDocument();
  });

  it("editorStore.save() 失败后触发 error Toast 含重试按钮 (AC-4)", async () => {
    const mockInvoke = createMockInvoke({
      ok: false,
      error: { code: "IO_ERROR", message: "Disk full" },
    });

    const store = createEditorStore({ invoke: mockInvoke });

    function Harness(): JSX.Element {
      return (
        <AppToastProvider>
          <EditorStoreProvider store={store}>
            <SaveToastConsumer />
          </EditorStoreProvider>
        </AppToastProvider>
      );
    }

    render(<Harness />);

    // Bootstrap
    await act(async () => {
      store.setState({
        bootstrapStatus: "ready",
        projectId: "p1",
        documentId: "d1",
        documentContentJson: "[]",
        autosaveStatus: "idle",
      });
    });

    // Trigger save (will fail)
    await act(async () => {
      await store.getState().save({
        projectId: "p1",
        documentId: "d1",
        contentJson: "[]",
        actor: "user",
        reason: "manual-save",
      });
    });

    // Should show error toast
    expect(screen.getByText("Save failed")).toBeInTheDocument();
    expect(
      screen.getByText("Auto-save failed. Your recent changes may not be saved."),
    ).toBeInTheDocument();

    // Should have retry action button
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("点击重试按钮后再次触发保存 (AC-4)", async () => {
    let callCount = 0;
    const mockInvoke = vi.fn().mockImplementation(() => {
      callCount += 1;
      if (callCount <= 1) {
        return Promise.resolve({
          ok: false,
          error: { code: "IO_ERROR", message: "Disk full" },
        });
      }
      return Promise.resolve({ ok: true, data: { version: 1 } });
    });

    const store = createEditorStore({ invoke: mockInvoke });

    function Harness(): JSX.Element {
      return (
        <AppToastProvider>
          <EditorStoreProvider store={store}>
            <SaveToastConsumer />
          </EditorStoreProvider>
        </AppToastProvider>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);

    // Bootstrap
    await act(async () => {
      store.setState({
        bootstrapStatus: "ready",
        projectId: "p1",
        documentId: "d1",
        documentContentJson: "[]",
        lastSavedOrQueuedJson: "[]",
        autosaveStatus: "idle",
      });
    });

    // Trigger save (will fail)
    await act(async () => {
      await store.getState().save({
        projectId: "p1",
        documentId: "d1",
        contentJson: "[]",
        actor: "user",
        reason: "manual-save",
      });
    });

    const saveCalls = mockInvoke.mock.calls.filter(
      (c: unknown[]) => c[0] === "file:document:save",
    ).length;

    // Click retry
    await act(async () => {
      await user.click(screen.getByText("Retry"));
    });

    // Wait for retry to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Save should have been called again
    const newSaveCalls = mockInvoke.mock.calls.filter(
      (c: unknown[]) => c[0] === "file:document:save",
    ).length;
    expect(newSaveCalls).toBeGreaterThan(saveCalls);
  });
});
