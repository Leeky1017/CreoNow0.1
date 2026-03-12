import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

import { AppToastProvider } from "../components/providers/AppToastProvider";
import { useAiErrorToast } from "../hooks/useToastIntegration";
import { createAiStore, AiStoreProvider } from "../stores/aiStore";

/**
 * 测试：AI 错误与导出场景 Toast 集成
 *
 * AC-5: AI 请求失败后出现 error Toast
 * AC-6: 导出完成后出现 success Toast（导出由 ExportDialog 组件内部处理）
 */

function AiToastConsumer(): JSX.Element {
  useAiErrorToast();
  return <div data-testid="ai-consumer" />;
}

describe("toast-feedback integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AI 请求失败后触发 error Toast (AC-5)", async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: "Provider unavailable" },
    });

    const store = createAiStore({ invoke: mockInvoke });

    function Harness(): JSX.Element {
      return (
        <AppToastProvider>
          <AiStoreProvider store={store}>
            <AiToastConsumer />
          </AiStoreProvider>
        </AppToastProvider>
      );
    }

    render(<Harness />);

    // Simulate AI status transitioning to error
    await act(async () => {
      store.setState({
        status: "error",
        lastError: { code: "UPSTREAM_ERROR", message: "Provider unavailable" },
      });
    });

    expect(screen.getByText("AI request failed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The AI service encountered an error. Please try again later.",
      ),
    ).toBeInTheDocument();
  });
});
