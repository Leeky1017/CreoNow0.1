import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiErrorCard } from "./AiErrorCard";
import type { AiErrorCardProps, AiErrorConfig } from "./types";
import { i18n } from "../../../i18n";

// =============================================================================
// 测试数据
// =============================================================================

const connectionError: AiErrorConfig = {
  type: "connection_failed",
  title: "Connection Failed",
  description: "Unable to reach the AI service.",
};

const timeoutError: AiErrorConfig = {
  type: "timeout",
  title: "Request Timed Out",
  description: "The request took too long to complete.",
};

const rateLimitError: AiErrorConfig = {
  type: "rate_limit",
  title: "Too Many Requests",
  description: "Please wait before trying again.",
  countdownSeconds: 30,
};

const usageLimitError: AiErrorConfig = {
  type: "usage_limit",
  title: "Usage Limit Reached",
  description: "You have exceeded your monthly quota.",
};

const serviceError: AiErrorConfig = {
  type: "service_error",
  title: "Service Error",
  description: "Service is experiencing issues.",
};

const serviceErrorWithCode: AiErrorConfig = {
  ...serviceError,
  errorCode: "upstream_error_503",
};

// =============================================================================
// AiErrorCard
// =============================================================================

  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  describe("渲染", () => {
    it("渲染错误标题和描述", () => {
      render(<AiErrorCard error={connectionError} />);

      expect(screen.getByText("Connection Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Unable to reach the AI service."),
      ).toBeInTheDocument();
    });

    it("服务错误显示人性化错误消息，不显示原始错误码", () => {
      render(<AiErrorCard error={serviceErrorWithCode} />);

      expect(
        screen.getByText(i18n.t("error.generic")),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("upstream_error_503"),
      ).not.toBeInTheDocument();
    });

    it("限速错误显示倒计时文本", () => {
      render(<AiErrorCard error={rateLimitError} />);
      expect(screen.getByText(/Try again in 30s/i)).toBeInTheDocument();
    });

    it("用量限制错误显示 Upgrade Plan 按钮", () => {
      render(
        <AiErrorCard
          error={usageLimitError}
          onUpgradePlan={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Upgrade Plan" }),
      ).toBeInTheDocument();
    });

    it("服务错误显示 Check Status 按钮", () => {
      render(
        <AiErrorCard
          error={serviceError}
          onCheckStatus={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /check status/i }),
      ).toBeInTheDocument();
    });

    it("showDismiss=true 时显示关闭按钮", () => {
      render(
        <AiErrorCard error={connectionError} showDismiss={true} />,
      );
      expect(screen.getByTitle("Dismiss")).toBeInTheDocument();
    });

    it("showDismiss=false 时不显示关闭按钮", () => {
      render(
        <AiErrorCard error={connectionError} showDismiss={false} />,
      );
      expect(screen.queryByTitle("Dismiss")).not.toBeInTheDocument();
    });

    it("超时错误重试按钮显示 'Try Again' 而非 'Retry'", () => {
      render(
        <AiErrorCard error={timeoutError} onRetry={vi.fn()} />,
      );
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
    });

    it("用量限制错误提供 onViewUsage 时显示 View Usage 按钮", () => {
      render(
        <AiErrorCard
          error={usageLimitError}
          onViewUsage={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /view usage/i }),
      ).toBeInTheDocument();
    });

    it("未提供 onRetry 时不渲染 Retry 按钮", () => {
      render(<AiErrorCard error={connectionError} />);
      expect(
        screen.queryByRole("button", { name: /retry/i }),
      ).not.toBeInTheDocument();
    });

    it("无 errorCode 时不显示错误码区域", () => {
      render(
        <AiErrorCard
          error={serviceError}
          errorCodeTestId="error-code"
        />,
      );
      expect(
        screen.queryByTestId("error-code"),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 交互
  // ---------------------------------------------------------------------------

  describe("交互", () => {
    it("点击 Retry 按钮触发 onRetry 回调", async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();
      render(
        <AiErrorCard error={connectionError} onRetry={onRetry} />,
      );

      await user.click(
        screen.getByRole("button", { name: /retry/i }),
      );

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 Dismiss 按钮触发 onDismiss 回调", async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();
      render(
        <AiErrorCard
          error={connectionError}
          showDismiss={true}
          onDismiss={onDismiss}
        />,
      );

      await user.click(screen.getByTitle("Dismiss"));

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 Upgrade Plan 触发 onUpgradePlan 回调", async () => {
      const onUpgradePlan = vi.fn();
      const user = userEvent.setup();
      render(
        <AiErrorCard
          error={usageLimitError}
          onUpgradePlan={onUpgradePlan}
        />,
      );

      await user.click(
        screen.getByRole("button", { name: "Upgrade Plan" }),
      );
      expect(onUpgradePlan).toHaveBeenCalledTimes(1);
    });

    it("点击 Check Status 触发 onCheckStatus 回调", async () => {
      const onCheckStatus = vi.fn();
      const user = userEvent.setup();
      render(
        <AiErrorCard
          error={serviceError}
          onCheckStatus={onCheckStatus}
        />,
      );

      await user.click(
        screen.getByRole("button", { name: /check status/i }),
      );
      expect(onCheckStatus).toHaveBeenCalledTimes(1);
    });

    it("点击 View Usage 触发 onViewUsage 回调", async () => {
      const onViewUsage = vi.fn();
      const user = userEvent.setup();
      render(
        <AiErrorCard
          error={usageLimitError}
          onViewUsage={onViewUsage}
        />,
      );

      await user.click(
        screen.getByRole("button", { name: /view usage/i }),
      );
      expect(onViewUsage).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 状态 — 重试
  // ---------------------------------------------------------------------------

  describe("状态 — 重试", () => {
    it("onRetry 被 reject 时显示 'Failed' 状态", async () => {
      const user = userEvent.setup();
      const onRetry = vi
        .fn()
        .mockRejectedValueOnce(new Error("retry failed"));
      render(
        <AiErrorCard error={connectionError} onRetry={onRetry} />,
      );

      await user.click(
        screen.getByRole("button", { name: /retry/i }),
      );

      expect(onRetry).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("重试中显示 'Retrying...' 加载状态", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn(() => new Promise<void>(() => {}));
      render(
        <AiErrorCard error={connectionError} onRetry={onRetry} />,
      );

      await user.click(
        screen.getByRole("button", { name: /retry/i }),
      );

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Retrying...")).toBeInTheDocument();
    });

    it("重试中 Retry 按钮被禁用", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn(() => new Promise<void>(() => {}));
      render(
        <AiErrorCard error={connectionError} onRetry={onRetry} />,
      );

      await user.click(
        screen.getByRole("button", { name: /retry/i }),
      );

      const retryButton = screen.getByRole("button", {
        name: /retrying/i,
      });
      expect(retryButton).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // 状态 — 倒计时
  // ---------------------------------------------------------------------------

  describe("状态 — 倒计时", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("每秒递减倒计时显示", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 3,
      };
      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      expect(screen.getByText(/Try again in 3s/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Try again in 2s/i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/Try again in 1s/i)).toBeInTheDocument();
    });

    it("倒计时结束后显示 'Ready to retry'", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 2,
      };
      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/Ready to retry/i)).toBeInTheDocument();
    });

    it("倒计时期间禁用 Retry 按钮", () => {
      render(
        <AiErrorCard error={rateLimitError} onRetry={vi.fn()} />,
      );

      const retryButton = screen.getByRole("button", {
        name: /retry/i,
      });
      expect(retryButton).toBeDisabled();
    });

    it("倒计时结束后启用 Retry 按钮", () => {
      const error: AiErrorConfig = {
        type: "rate_limit",
        title: "Too Many Requests",
        description: "Please wait.",
        countdownSeconds: 2,
      };
      render(<AiErrorCard error={error} onRetry={vi.fn()} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      const retryButton = screen.getByRole("button", {
        name: /retry/i,
      });
      expect(retryButton).not.toBeDisabled();
    });


    it("新的 rate-limit 错误到来时重置倒计时与 ready 状态", () => {
      const { rerender } = render(
        <AiErrorCard
          error={{
            type: "rate_limit",
            title: "Too Many Requests",
            description: "Please wait.",
            countdownSeconds: 2,
          }}
          onRetry={vi.fn()}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText(/Ready to retry/i)).toBeInTheDocument();

      rerender(
        <AiErrorCard
          error={{
            type: "rate_limit",
            title: "Too Many Requests",
            description: "Please wait again.",
            countdownSeconds: 5,
          }}
          onRetry={vi.fn()}
        />,
      );

      expect(screen.getByText(/Try again in 5s/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // 类型安全
  // ---------------------------------------------------------------------------

  describe("类型安全", () => {
    it("AiErrorCardProps 不包含 demo-only 属性 simulateDelay 和 retryWillSucceed", () => {
      type HasSimulateDelay =
        "simulateDelay" extends keyof AiErrorCardProps ? true : false;
      type HasRetryWillSucceed =
        "retryWillSucceed" extends keyof AiErrorCardProps ? true : false;

      const hasSimulateDelay: HasSimulateDelay = false;
      const hasRetryWillSucceed: HasRetryWillSucceed = false;

      expect(hasSimulateDelay).toBe(false);
      expect(hasRetryWillSucceed).toBe(false);
    });
  });
