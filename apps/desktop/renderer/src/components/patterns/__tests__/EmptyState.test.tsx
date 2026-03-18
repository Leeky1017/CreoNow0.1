import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  describe("默认渲染（generic variant）", () => {
    it("渲染标题和描述", () => {
      render(<EmptyState title="没有内容" description="这里还没有内容" />);
      expect(screen.getByText("没有内容")).toBeInTheDocument();
      expect(screen.getByText("这里还没有内容")).toBeInTheDocument();
    });

    it("不传 description 时不渲染描述区域", () => {
      render(<EmptyState title="空空如也" />);
      expect(screen.getByText("空空如也")).toBeInTheDocument();
      // 仅渲染标题和默认 illustration，无描述
      expect(screen.queryByText("这里还没有内容")).not.toBeInTheDocument();
    });

    it("渲染默认 illustration（SVG icon）", () => {
      const { container } = render(<EmptyState title="空" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("自定义 illustration", () => {
    it("传入 illustration 时使用自定义内容替代默认 icon", () => {
      render(
        <EmptyState
          title="自定义"
          illustration={<div data-testid="custom-illustration">🎨</div>}
        />,
      );
      expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    });
  });

  describe("action 按钮", () => {
    it("传入 onAction 时渲染主操作按钮并响应点击", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <EmptyState
          title="无文件"
          actionLabel="新建文件"
          onAction={onAction}
        />,
      );
      const btn = screen.getByRole("button", { name: "新建文件" });
      expect(btn).toBeInTheDocument();
      await user.click(btn);
      expect(onAction).toHaveBeenCalledOnce();
    });

    it("不传 onAction 时不渲染按钮", () => {
      render(<EmptyState title="无内容" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("传入 secondaryAction 时渲染次要按钮", async () => {
      const user = userEvent.setup();
      const onSecondary = vi.fn();
      render(
        <EmptyState
          title="空"
          secondaryActionLabel="了解更多"
          onSecondaryAction={onSecondary}
        />,
      );
      const btn = screen.getByRole("button", { name: "了解更多" });
      await user.click(btn);
      expect(onSecondary).toHaveBeenCalledOnce();
    });
  });

  describe("variant 预设", () => {
    it("variant='files' 使用预设文案", () => {
      render(<EmptyState variant="files" />);
      // i18n en: "No Files"
      expect(screen.getByText("No Files")).toBeInTheDocument();
    });

    it("variant='search' 使用搜索预设文案", () => {
      render(<EmptyState variant="search" />);
      expect(screen.getByText("No matching results")).toBeInTheDocument();
    });

    it("variant='characters' 使用角色预设文案", () => {
      render(<EmptyState variant="characters" />);
      expect(screen.getByText("No Characters")).toBeInTheDocument();
    });

    it("variant='project' 使用项目预设文案", () => {
      render(<EmptyState variant="project" />);
      expect(screen.getByText("Create your first file")).toBeInTheDocument();
    });

    it("自定义 title 覆盖 variant 默认值", () => {
      render(<EmptyState variant="files" title="自定义标题" />);
      expect(screen.getByText("自定义标题")).toBeInTheDocument();
      expect(screen.queryByText("No Files")).not.toBeInTheDocument();
    });
  });

  describe("className 传递", () => {
    it("外层容器接收 className", () => {
      const { container } = render(
        <EmptyState title="空" className="custom-class" />,
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
