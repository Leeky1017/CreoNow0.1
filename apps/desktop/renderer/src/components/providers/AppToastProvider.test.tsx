import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { AppToastProvider, useAppToast } from "./AppToastProvider";

/**
 * 便捷消费者组件：调用 showToast 并渲染按钮
 */
function ToastTrigger({
  variant = "success",
  title = "Test Toast",
  description,
  duration,
  action,
}: {
  variant?: "default" | "success" | "error" | "warning";
  title?: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}): JSX.Element {
  const { showToast } = useAppToast();
  return (
    <button
      onClick={() =>
        showToast({ title, description, variant, duration, action })
      }
    >
      Trigger
    </button>
  );
}

describe("AppToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // AC-1: Provider 挂载后 Toast 可触发
  // ===========================================================================
  it("在 AppToastProvider 包裹下调用 showToast() 后渲染 Toast DOM 节点", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger title="Hello Toast" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    expect(screen.getByText("Hello Toast")).toBeInTheDocument();
  });

  // ===========================================================================
  // AC-2: 未包裹 AppToastProvider 时抛出明确错误
  // ===========================================================================
  it("未包裹 AppToastProvider 时调用 useAppToast() 抛出明确错误", () => {
    let capturedErrorMessage: string | null = null;

    function Orphan(): JSX.Element {
      try {
        useAppToast();
      } catch (error) {
        capturedErrorMessage =
          error instanceof Error ? error.message : String(error);
      }
      return <div />;
    }

    render(<Orphan />);

    expect(capturedErrorMessage).toBe(
      "useAppToast must be used within AppToastProvider",
    );
  });

  // ===========================================================================
  // variant 样式验证：success border
  // ===========================================================================
  it("showToast({ variant: 'success' }) 渲染的 Toast 边框色匹配 --color-success", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger variant="success" title="Success!" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    const toastEl = screen.getByText("Success!").closest("[data-state]");
    expect(toastEl).toHaveClass("border-[var(--color-success)]");
  });

  // ===========================================================================
  // AC: error variant aria-live=assertive
  // ===========================================================================
  it("showToast({ variant: 'error' }) 渲染的 Toast aria-live='assertive'", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger variant="error" title="Error!" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    const toastEl = screen.getByText("Error!").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "assertive");
  });

  // ===========================================================================
  // AC: success variant aria-live=polite
  // ===========================================================================
  it("showToast({ variant: 'success' }) 渲染的 Toast aria-live='polite'", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger variant="success" title="Saved!" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    const toastEl = screen.getByText("Saved!").closest("[data-state]");
    expect(toastEl).toHaveAttribute("aria-live", "polite");
  });

  // ===========================================================================
  // AC-8: error variant 默认 duration 8000ms
  // ===========================================================================
  it("error variant 的 Toast 在 8000ms 后消失", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger variant="error" title="Error Toast" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    expect(screen.getByText("Error Toast")).toBeInTheDocument();

    // 5000ms 后仍在
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Error Toast")).toBeInTheDocument();

    // 8100ms 后消失
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    // Radix Toast 使用 animation 机制移除元素
    await vi.waitFor(() => {
      expect(screen.queryByText("Error Toast")).not.toBeInTheDocument();
    });
  }, 15000);

  // ===========================================================================
  // AC-8: success variant 默认 duration 5000ms
  // ===========================================================================
  it("success variant 的 Toast 在 5000ms 后消失", async () => {
    render(
      <AppToastProvider>
        <ToastTrigger variant="success" title="Success Toast" />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Trigger").click();
    });

    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    // 5100ms 后消失
    act(() => {
      vi.advanceTimersByTime(5100);
    });

    await vi.waitFor(() => {
      expect(screen.queryByText("Success Toast")).not.toBeInTheDocument();
    });
  }, 15000);

  // ===========================================================================
  // AC-10: 多条 Toast 堆叠
  // ===========================================================================
  it("连续调用两次 showToast() 后 Viewport 内存在两条 Toast", async () => {
    function MultiTrigger(): JSX.Element {
      const { showToast } = useAppToast();
      return (
        <>
          <button
            onClick={() => showToast({ title: "Toast A", variant: "success" })}
          >
            A
          </button>
          <button
            onClick={() => showToast({ title: "Toast B", variant: "error" })}
          >
            B
          </button>
        </>
      );
    }

    render(
      <AppToastProvider>
        <MultiTrigger />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("A").click();
    });
    await act(async () => {
      screen.getByText("B").click();
    });

    expect(screen.getByText("Toast A")).toBeInTheDocument();
    expect(screen.getByText("Toast B")).toBeInTheDocument();
  });

  it("两条 Toast 按触发顺序排列", async () => {
    function MultiTrigger(): JSX.Element {
      const { showToast } = useAppToast();
      return (
        <button
          onClick={() => {
            showToast({ title: "First", variant: "success" });
            showToast({ title: "Second", variant: "error" });
          }}
        >
          Both
        </button>
      );
    }

    render(
      <AppToastProvider>
        <MultiTrigger />
      </AppToastProvider>,
    );

    await act(async () => {
      screen.getByText("Both").click();
    });

    const firstEl = screen.getByText("First");
    const secondEl = screen.getByText("Second");

    // Verify both rendered and First appears before Second in DOM order
    expect(firstEl).toBeInTheDocument();
    expect(secondEl).toBeInTheDocument();

    const firstToast = firstEl.closest("[data-state]");
    const secondToast = secondEl.closest("[data-state]");
    expect(firstToast).toBeTruthy();
    expect(secondToast).toBeTruthy();

    // DOM order: compareDocumentPosition bit 4 = DOCUMENT_POSITION_FOLLOWING
    const position = firstToast!.compareDocumentPosition(secondToast!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
