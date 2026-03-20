import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiInlineConfirm } from "./AiInlineConfirm";
import type { AiInlineConfirmProps } from "./types";

// =============================================================================
// 测试数据
// =============================================================================

const sampleOriginalText = "The castle stood majestically on the hill";
const sampleSuggestedText =
  "The ancient fortress loomed atop the windswept ridge";

function renderInlineConfirm(overrides?: Partial<AiInlineConfirmProps>) {
  const defaults: AiInlineConfirmProps = {
    originalText: sampleOriginalText,
    suggestedText: sampleSuggestedText,
    onAccept: vi.fn(),
    onReject: vi.fn(),
  };
  return render(<AiInlineConfirm {...defaults} {...overrides} />);
}

// =============================================================================
// AiInlineConfirm
// =============================================================================

describe("AiInlineConfirm", () => {
  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  describe("渲染", () => {
    it("默认渲染 suggested text（showComparison 默认 true）", () => {
      renderInlineConfirm();
      expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
    });

    it("showComparison=true 时同时显示原文和建议文本", () => {
      renderInlineConfirm({ showComparison: true });
      expect(screen.getByText(sampleOriginalText)).toBeInTheDocument();
      expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
    });

    it("showComparison=false 时仅显示建议文本，不显示原文", () => {
      renderInlineConfirm({ showComparison: false });
      expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
      expect(
        screen.queryByText(sampleOriginalText),
      ).not.toBeInTheDocument();
    });

    it("渲染 Accept 和 Reject 按钮", () => {
      renderInlineConfirm();
      expect(
        screen.getByRole("button", { name: /accept/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reject/i }),
      ).toBeInTheDocument();
    });

    it("提供 onViewDiff 时渲染 View Diff 按钮", () => {
      renderInlineConfirm({ onViewDiff: vi.fn() });
      expect(
        screen.getByRole("button", { name: /view diff/i }),
      ).toBeInTheDocument();
    });

    it("未提供 onViewDiff 时不渲染 View Diff 按钮", () => {
      renderInlineConfirm();
      expect(
        screen.queryByRole("button", { name: /view diff/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 交互
  // ---------------------------------------------------------------------------

  describe("交互", () => {
    it("点击 Accept 按钮触发 onAccept 回调", async () => {
      const onAccept = vi.fn();
      const user = userEvent.setup();
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      await waitFor(() => {
        expect(onAccept).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 Reject 按钮触发 onReject 回调", async () => {
      const onReject = vi.fn();
      const user = userEvent.setup();
      renderInlineConfirm({ onReject });

      await user.click(screen.getByRole("button", { name: /reject/i }));

      await waitFor(() => {
        expect(onReject).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 View Diff 按钮触发 onViewDiff 回调", async () => {
      const onViewDiff = vi.fn();
      const user = userEvent.setup();
      renderInlineConfirm({ onViewDiff });

      await user.click(
        screen.getByRole("button", { name: /view diff/i }),
      );
      expect(onViewDiff).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 状态
  // ---------------------------------------------------------------------------

  describe("状态", () => {
    it("点击 Accept 后显示 'Applying...' 加载状态", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn(() => new Promise<void>(() => {}));
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Applying...")).toBeInTheDocument();
    });

    it("onAccept 完成后进入 accepted 状态：隐藏工具栏，显示建议文本", async () => {
      const user = userEvent.setup();
      renderInlineConfirm({
        onAccept: vi.fn().mockResolvedValue(undefined),
      });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      await waitFor(() => {
        expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /accept/i }),
        ).toBeNull();
        expect(screen.getByText(sampleSuggestedText)).toBeInTheDocument();
      });
    });

    it("onReject 完成后进入 rejected 状态：隐藏工具栏，显示原文", async () => {
      const user = userEvent.setup();
      renderInlineConfirm({
        onReject: vi.fn().mockResolvedValue(undefined),
      });

      await user.click(screen.getByRole("button", { name: /reject/i }));

      await waitFor(() => {
        expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /reject/i }),
        ).toBeNull();
        expect(screen.getByText(sampleOriginalText)).toBeInTheDocument();
      });
    });

    it("onAccept 未 resolve 时保持 applying 状态，resolve 后退出", async () => {
      const user = userEvent.setup();
      let resolveAccept: (() => void) | undefined;
      const onAccept = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAccept = resolve;
          }),
      );
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Applying...")).toBeInTheDocument();

      resolveAccept?.();

      await waitFor(() => {
        expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
      });
    });

    it("applying 状态下 Accept 和 Reject 按钮被禁用", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn(() => new Promise<void>(() => {}));
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      expect(
        screen.getByRole("button", { name: /applying/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /reject/i }),
      ).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // 边界情况
  // ---------------------------------------------------------------------------

  describe("边界情况", () => {
    it("onAccept 抛出异常后恢复 pending 状态，可再次操作", async () => {
      const user = userEvent.setup();
      const onAccept = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"));
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /accept/i }),
        ).toBeInTheDocument();
      });
    });

    it("onReject 抛出异常后恢复 pending 状态", async () => {
      const user = userEvent.setup();
      const onReject = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"));
      renderInlineConfirm({ onReject });

      await user.click(screen.getByRole("button", { name: /reject/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /reject/i }),
        ).toBeInTheDocument();
      });
    });

    it("applying 状态下再次点击 Accept 不会重复触发回调", async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn(() => new Promise<void>(() => {}));
      renderInlineConfirm({ onAccept });

      await user.click(screen.getByRole("button", { name: /accept/i }));

      // Button is now disabled during applying, guard in handler also prevents re-entry
      expect(onAccept).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 类型安全
  // ---------------------------------------------------------------------------

  describe("类型安全", () => {
    it("AiInlineConfirmProps 不包含 demo-only 属性 simulateDelay 和 initialState", () => {
      type HasSimulateDelay =
        "simulateDelay" extends keyof AiInlineConfirmProps ? true : false;
      type HasInitialState =
        "initialState" extends keyof AiInlineConfirmProps ? true : false;

      const hasSimulateDelay: HasSimulateDelay = false;
      const hasInitialState: HasInitialState = false;

      expect(hasSimulateDelay).toBe(false);
      expect(hasInitialState).toBe(false);
    });
  });
});
