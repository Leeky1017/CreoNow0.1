import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SystemDialog } from "./SystemDialog";
import type { SystemDialogProps } from "./types";

// =============================================================================
// 测试数据
// =============================================================================

function renderSystemDialog(overrides?: Partial<SystemDialogProps>) {
  const defaults: SystemDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    type: "delete",
    onPrimaryAction: vi.fn(),
  };
  return render(<SystemDialog {...defaults} {...overrides} />);
}

// =============================================================================
// SystemDialog
// =============================================================================

describe("SystemDialog", () => {
  // ---------------------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------------------

  describe("渲染", () => {
    it("open=true 时渲染对话框内容", () => {
      renderSystemDialog({ type: "delete" });
      expect(screen.getByText("Delete Document?")).toBeInTheDocument();
    });

    it("open=false 时不渲染对话框内容", () => {
      renderSystemDialog({ open: false });
      expect(screen.queryByText("Delete Document?")).not.toBeInTheDocument();
    });

    it("delete 类型显示正确的默认标题和描述", () => {
      renderSystemDialog({ type: "delete" });
      expect(screen.getByText("Delete Document?")).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it("unsaved_changes 类型显示正确的默认标题和描述", () => {
      renderSystemDialog({ type: "unsaved_changes" });
      expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
      expect(screen.getByText(/You have unsaved changes/i)).toBeInTheDocument();
    });

    it("export_complete 类型显示正确的默认标题和描述", () => {
      renderSystemDialog({ type: "export_complete" });
      expect(screen.getByText("Export Complete")).toBeInTheDocument();
      expect(screen.getByText(/exported successfully/i)).toBeInTheDocument();
    });

    it("支持自定义标题和描述覆盖默认值", () => {
      renderSystemDialog({
        type: "delete",
        title: "Custom Title",
        description: "Custom description text",
      });
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom description text")).toBeInTheDocument();
    });

    it("支持自定义按钮标签", () => {
      renderSystemDialog({
        type: "delete",
        primaryLabel: "Remove",
        secondaryLabel: "Keep",
        onSecondaryAction: vi.fn(),
      });
      expect(screen.getByText("Remove")).toBeInTheDocument();
      expect(screen.getByText("Keep")).toBeInTheDocument();
    });

    it("showKeyboardHints=true 时显示键盘提示", () => {
      renderSystemDialog({ showKeyboardHints: true });
      expect(screen.getByText("Enter")).toBeInTheDocument();
      expect(screen.getByText("Esc")).toBeInTheDocument();
    });

    it("showKeyboardHints=false 时隐藏键盘提示", () => {
      renderSystemDialog({ showKeyboardHints: false });
      expect(screen.queryByText("Enter")).not.toBeInTheDocument();
      expect(screen.queryByText("Esc")).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 交互 — delete
  // ---------------------------------------------------------------------------

  describe("交互 — delete 对话框", () => {
    it("点击 Delete 按钮触发 onPrimaryAction 回调", async () => {
      const onPrimaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "delete",
        onPrimaryAction,
        simulateDelay: 10,
      });

      await user.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(onPrimaryAction).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 Cancel 按钮触发 onSecondaryAction 回调", async () => {
      const onSecondaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "delete",
        onSecondaryAction,
      });

      await user.click(screen.getByText("Cancel"));
      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 交互 — unsaved_changes
  // ---------------------------------------------------------------------------

  describe("交互 — unsaved_changes 对话框", () => {
    it("渲染三个操作按钮: Discard, Cancel, Save", () => {
      renderSystemDialog({
        type: "unsaved_changes",
        onSecondaryAction: vi.fn(),
        onTertiaryAction: vi.fn(),
      });
      expect(screen.getByText("Discard")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("点击 Discard 触发 onTertiaryAction 回调", async () => {
      const onTertiaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "unsaved_changes",
        onTertiaryAction,
      });

      await user.click(screen.getByText("Discard"));
      expect(onTertiaryAction).toHaveBeenCalledTimes(1);
    });

    it("点击 Save 触发 onPrimaryAction 回调", async () => {
      const onPrimaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "unsaved_changes",
        onPrimaryAction,
        simulateDelay: 10,
      });

      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(onPrimaryAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 交互 — export_complete
  // ---------------------------------------------------------------------------

  describe("交互 — export_complete 对话框", () => {
    it("渲染 Done 和 Open File 两个按钮", () => {
      renderSystemDialog({
        type: "export_complete",
        onSecondaryAction: vi.fn(),
      });
      expect(screen.getByText("Done")).toBeInTheDocument();
      expect(screen.getByText("Open File")).toBeInTheDocument();
    });

    it("点击 Open File 触发 onPrimaryAction 回调", async () => {
      const onPrimaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "export_complete",
        onPrimaryAction,
        simulateDelay: 10,
      });

      await user.click(screen.getByText("Open File"));

      await waitFor(() => {
        expect(onPrimaryAction).toHaveBeenCalledTimes(1);
      });
    });

    it("点击 Done 触发 onSecondaryAction 回调", async () => {
      const onSecondaryAction = vi.fn();
      const user = userEvent.setup();
      renderSystemDialog({
        type: "export_complete",
        onSecondaryAction,
      });

      await user.click(screen.getByText("Done"));
      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 状态
  // ---------------------------------------------------------------------------

  describe("状态", () => {
    it("点击主操作按钮后显示 'Processing...' 加载状态", async () => {
      const user = userEvent.setup();
      renderSystemDialog({
        type: "delete",
        simulateDelay: 100_000,
      });

      await user.click(screen.getByText("Delete"));

      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("加载状态下按钮被禁用，阻止重复点击", async () => {
      const user = userEvent.setup();
      renderSystemDialog({
        type: "delete",
        simulateDelay: 100_000,
        onSecondaryAction: vi.fn(),
      });

      await user.click(screen.getByText("Delete"));

      expect(screen.getByTestId("system-dialog-primary")).toBeDisabled();
      expect(screen.getByTestId("system-dialog-secondary")).toBeDisabled();
    });
  });
});
