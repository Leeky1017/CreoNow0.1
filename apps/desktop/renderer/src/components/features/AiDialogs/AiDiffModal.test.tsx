import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiDiffModal } from "./AiDiffModal";
import type { AiDiffModalProps, DiffChange } from "./types";

// =============================================================================
// 测试数据
// =============================================================================

const twoChanges: DiffChange[] = [
  {
    id: "1",
    before: "The platform supports XML and JSON",
    after: "The platform supports XML, JSON, and CSV",
  },
  {
    id: "2",
    before: "Basic security protocols",
    after: "ISO 27001 compliant security protocols",
  },
];

const singleChange: DiffChange[] = [
  { id: "1", before: "Old text here", after: "New text here" },
];

function renderDiffModal(overrides?: Partial<AiDiffModalProps>) {
  const defaults: AiDiffModalProps = {
    open: true,
    onOpenChange: vi.fn(),
    changes: twoChanges,
    onAcceptAll: vi.fn(),
    onRejectAll: vi.fn(),
    onApplyChanges: vi.fn(),
  };
  return render(<AiDiffModal {...defaults} {...overrides} />);
}

// =============================================================================
// AiDiffModal
// =============================================================================

describe("AiDiffModal", () => {
  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  describe("渲染", () => {
    it("open=true 时渲染 modal 标题 'Review Changes'", () => {
      renderDiffModal();
      expect(screen.getByText("Review Changes")).toBeInTheDocument();
    });

    it("open=false 时不渲染 modal 内容", () => {
      renderDiffModal({ open: false });
      expect(
        screen.queryByText("Review Changes"),
      ).not.toBeInTheDocument();
    });

    it("显示正确的变更数量信息", () => {
      renderDiffModal();
      expect(screen.getByText(/2 paragraph/i)).toBeInTheDocument();
    });

    it("显示 Before 和 After 面板标签", () => {
      renderDiffModal();
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("显示当前变更的 before/after 差异内容", () => {
      renderDiffModal();
      // Word-diff splits into individual word spans; verify unique words from each panel
      expect(screen.getByText("XML")).toBeInTheDocument(); // before content
      expect(screen.getByText("CSV")).toBeInTheDocument(); // after-only word
    });

    it("统计面板显示 added 和 removed 数量", () => {
      renderDiffModal();
      expect(screen.getByText(/added/i)).toBeInTheDocument();
      expect(screen.getByText(/removed/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 交互
  // ---------------------------------------------------------------------------

  describe("交互", () => {
    it("点击 Accept All 触发 onAcceptAll 回调", async () => {
      const onAcceptAll = vi.fn();
      const user = userEvent.setup();
      renderDiffModal({ onAcceptAll });

      await user.click(
        screen.getByRole("button", { name: "Accept All" }),
      );
      expect(onAcceptAll).toHaveBeenCalledTimes(1);
    });

    it("点击 Reject All 触发 onRejectAll 回调", async () => {
      const onRejectAll = vi.fn();
      const user = userEvent.setup();
      renderDiffModal({ onRejectAll });

      await user.click(
        screen.getByRole("button", { name: "Reject All" }),
      );
      expect(onRejectAll).toHaveBeenCalledTimes(1);
    });

    it("点击 Apply Changes 触发 onApplyChanges 回调", async () => {
      const onApplyChanges = vi.fn();
      const user = userEvent.setup();
      renderDiffModal({ onApplyChanges, simulateDelay: 10 });

      await user.click(
        screen.getByRole("button", { name: "Apply Changes" }),
      );

      await waitFor(() => {
        expect(onApplyChanges).toHaveBeenCalledTimes(1);
      });
    });

    it("多个变更时导航箭头切换变更，触发 onCurrentIndexChange", async () => {
      const onCurrentIndexChange = vi.fn();
      const user = userEvent.setup();
      renderDiffModal({ currentIndex: 0, onCurrentIndexChange });

      // Verify navigation counter is displayed
      const counterText = screen.getByText(/Change 1 of 2/i);
      expect(counterText).toBeInTheDocument();

      // The nav container has [prevBtn, counterSpan, nextBtn]
      // At index 0, prev is disabled, next is enabled
      const navContainer = counterText.parentElement!;
      const navButtons = Array.from(
        navContainer.querySelectorAll("button"),
      );

      expect(navButtons).toHaveLength(2);
      expect(navButtons[0]).toBeDisabled(); // prev at index 0
      expect(navButtons[1]).not.toBeDisabled(); // next

      await user.click(navButtons[1]);
      expect(onCurrentIndexChange).toHaveBeenCalledWith(1);
    });

    it("提供 onEditManually 时显示 Edit Manually 按钮并触发回调", async () => {
      const onEditManually = vi.fn();
      const user = userEvent.setup();
      renderDiffModal({ onEditManually });

      const editBtn = screen.getByRole("button", {
        name: "Edit Manually",
      });
      await user.click(editBtn);
      expect(onEditManually).toHaveBeenCalledTimes(1);
    });

    it("点击 Accept this change 按钮后当前变更标记为 Accepted", async () => {
      const user = userEvent.setup();
      renderDiffModal();

      // Initially the state indicator shows "Pending"
      expect(screen.getByText("Pending")).toBeInTheDocument();

      await user.click(screen.getByTitle("Accept this change"));

      expect(screen.getByText("Accepted")).toBeInTheDocument();
      // Per-change buttons disappear after accepting
      expect(
        screen.queryByTitle("Accept this change"),
      ).not.toBeInTheDocument();
    });

    it("点击 Reject this change 按钮后当前变更标记为 Rejected", async () => {
      const user = userEvent.setup();
      renderDiffModal();

      await user.click(screen.getByTitle("Reject this change"));

      expect(screen.getByText("Rejected")).toBeInTheDocument();
      expect(
        screen.queryByTitle("Reject this change"),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 状态
  // ---------------------------------------------------------------------------

  describe("状态", () => {
    it("点击 Apply Changes 后显示 'Applying...' 加载状态", async () => {
      const user = userEvent.setup();
      renderDiffModal({ simulateDelay: 100_000 });

      await user.click(
        screen.getByRole("button", { name: "Apply Changes" }),
      );

      expect(screen.getByText("Applying...")).toBeInTheDocument();
    });

    it("Accept All 后统计区显示 accepted 数量", async () => {
      const user = userEvent.setup();
      renderDiffModal();

      await user.click(
        screen.getByRole("button", { name: "Accept All" }),
      );

      expect(screen.getByText("Accepted")).toBeInTheDocument();
      expect(screen.getByText(/2 accepted/i)).toBeInTheDocument();
    });

    it("Reject All 后统计区显示 rejected 数量", async () => {
      const user = userEvent.setup();
      renderDiffModal();

      await user.click(
        screen.getByRole("button", { name: "Reject All" }),
      );

      expect(screen.getByText("Rejected")).toBeInTheDocument();
      expect(screen.getByText(/2 rejected/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 边界情况
  // ---------------------------------------------------------------------------

  describe("边界情况", () => {
    it("空变更列表时显示 0 paragraph 并渲染空 diff", () => {
      renderDiffModal({ changes: [] });
      expect(screen.getByText(/0 paragraph/i)).toBeInTheDocument();
      expect(screen.getByText("Before")).toBeInTheDocument();
      expect(screen.getByText("After")).toBeInTheDocument();
    });

    it("单个变更时不显示导航控件", () => {
      renderDiffModal({ changes: singleChange });
      expect(screen.getByText(/1 paragraph/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/Change \d+ of \d+/),
      ).not.toBeInTheDocument();
    });

    it("未提供 onEditManually 时不显示 Edit Manually 按钮", () => {
      renderDiffModal({ onEditManually: undefined });
      expect(
        screen.queryByRole("button", { name: "Edit Manually" }),
      ).not.toBeInTheDocument();
    });
  });
});
