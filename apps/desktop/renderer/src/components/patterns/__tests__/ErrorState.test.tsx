import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "../ErrorState";
import { i18n } from "../../../i18n";

/** 通过 i18n 获取预期翻译值，使测试与具体语言解耦 */
const t = (key: string) => i18n.t(key);

describe("ErrorState", () => {
  describe("variant='inline'（默认）", () => {
    it("渲染 role=alert 元素和错误消息", () => {
      render(<ErrorState message="字段必填" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("字段必填")).toBeInTheDocument();
    });

    it("severity='warning' 渲染警告消息", () => {
      render(<ErrorState severity="warning" message="连接不稳定" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("连接不稳定")).toBeInTheDocument();
    });

    it("severity='info' 渲染提示消息", () => {
      render(<ErrorState severity="info" message="已自动保存" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("已自动保存")).toBeInTheDocument();
    });
  });

  describe("variant='banner'", () => {
    it("渲染 banner 样式的错误提示", () => {
      render(
        <ErrorState
          variant="banner"
          title="保存失败"
          message="请检查网络连接"
        />,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("保存失败")).toBeInTheDocument();
      expect(screen.getByText("请检查网络连接")).toBeInTheDocument();
    });

    it("dismissible=true 时渲染关闭按钮并触发 onDismiss", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <ErrorState
          variant="banner"
          message="临时提示"
          dismissible
          onDismiss={onDismiss}
        />,
      );
      const closeLabel = t("patterns.errorState.close");
      const closeBtn = screen.getByRole("button", { name: new RegExp(closeLabel, "i") });
      expect(closeBtn).toBeInTheDocument();
      await user.click(closeBtn);
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it("actionLabel + onAction 渲染操作链接", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <ErrorState
          variant="banner"
          message="加载失败"
          actionLabel="重试"
          onAction={onAction}
        />,
      );
      const actionBtn = screen.getByText("重试");
      await user.click(actionBtn);
      expect(onAction).toHaveBeenCalledOnce();
    });

    it("不传 dismissible 时不渲染关闭按钮", () => {
      render(<ErrorState variant="banner" message="错误" />);
      const closeLabel = t("patterns.errorState.close");
      expect(screen.queryByRole("button", { name: new RegExp(closeLabel, "i") })).not.toBeInTheDocument();
    });
  });

  describe("variant='card'", () => {
    it("渲染卡片样式的错误状态", () => {
      render(
        <ErrorState
          variant="card"
          severity="error"
          title="加载失败"
          message="无法获取数据"
        />,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("加载失败")).toBeInTheDocument();
      expect(screen.getByText("无法获取数据")).toBeInTheDocument();
    });

    it("渲染主操作和次要操作按钮", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const onSecondary = vi.fn();
      render(
        <ErrorState
          variant="card"
          message="出错了"
          actionLabel="重试"
          onAction={onAction}
          secondaryActionLabel="忽略"
          onSecondaryAction={onSecondary}
        />,
      );
      await user.click(screen.getByRole("button", { name: "重试" }));
      expect(onAction).toHaveBeenCalledOnce();
      await user.click(screen.getByRole("button", { name: "忽略" }));
      expect(onSecondary).toHaveBeenCalledOnce();
    });

    it("不传 onAction 时不渲染按钮区域", () => {
      render(<ErrorState variant="card" message="静默错误" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("variant='fullPage'", () => {
    it("渲染全页错误状态", () => {
      render(
        <ErrorState
          variant="fullPage"
          title="页面不存在"
          message="该页面已被移除"
          actionLabel="返回首页"
          onAction={vi.fn()}
        />,
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("页面不存在")).toBeInTheDocument();
      expect(screen.getByText("该页面已被移除")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "返回首页" }),
      ).toBeInTheDocument();
    });

    it("不传 title 时使用默认标题", () => {
      render(<ErrorState variant="fullPage" message="未知错误" />);
      expect(
        screen.getByText(t("patterns.errorState.defaultTitle")),
      ).toBeInTheDocument();
    });
  });

  describe("severity 标识区分", () => {
    it("severity='error' 在 alert 上设置 data-severity=error", () => {
      render(<ErrorState variant="card" severity="error" message="e" />);
      expect(screen.getByRole("alert")).toHaveAttribute("data-severity", "error");
    });

    it("severity='warning' 在 alert 上设置 data-severity=warning", () => {
      render(<ErrorState variant="card" severity="warning" message="w" />);
      expect(screen.getByRole("alert")).toHaveAttribute("data-severity", "warning");
    });

    it("severity='info' 在 alert 上设置 data-severity=info", () => {
      render(<ErrorState variant="card" severity="info" message="i" />);
      expect(screen.getByRole("alert")).toHaveAttribute("data-severity", "info");
    });
  });

  describe("className 传递", () => {
    it("inline variant 接收 className", () => {
      const { container } = render(
        <ErrorState message="err" className="custom-err" />,
      );
      expect(container.firstChild).toHaveClass("custom-err");
    });
  });
});
