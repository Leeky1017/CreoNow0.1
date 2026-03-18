import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState, Skeleton, ProgressBar } from "../LoadingState";

describe("LoadingState", () => {
  describe("variant='spinner'（默认）", () => {
    it("渲染 role=status 的加载状态容器", () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("传入 text 时渲染加载提示文字", () => {
      render(<LoadingState variant="spinner" text="加载中..." />);
      expect(screen.getByText("加载中...")).toBeInTheDocument();
    });

    it("不传 text 时不渲染文字", () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
    });

    it("size='sm' 在 status 容器上反映 data-size 属性", () => {
      render(<LoadingState variant="spinner" size="sm" />);
      expect(screen.getByRole("status")).toHaveAttribute("data-size", "sm");
    });

    it("size='lg' 在 status 容器上反映 data-size 属性", () => {
      render(<LoadingState variant="spinner" size="lg" />);
      expect(screen.getByRole("status")).toHaveAttribute("data-size", "lg");
    });
  });

  describe("variant='skeleton'", () => {
    it("渲染 role=status 的骨架占位结构（默认 3 行）", () => {
      render(<LoadingState variant="skeleton" />);
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      // skeleton 内部为 paragraph 型结构，默认 3 行
      expect(status.firstChild?.childNodes).toHaveLength(3);
    });
  });

  describe("variant='progress'", () => {
    it("渲染 progressbar role 元素", () => {
      render(<LoadingState variant="progress" />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("variant='inline'", () => {
    it("渲染内联指示器（不包含 role=status 居中容器）", () => {
      render(<LoadingState variant="inline" />);
      // inline 用于按钮/文字内嵌，不渲染独立 status 容器
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("className 传递", () => {
    it("spinner variant 接收 className", () => {
      render(<LoadingState variant="spinner" className="my-custom" />);
      expect(screen.getByRole("status")).toHaveClass("my-custom");
    });
  });
});

describe("Skeleton", () => {
  describe("type='text'（默认）", () => {
    it("渲染单行文本骨架", () => {
      const { container } = render(<Skeleton type="text" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("type='title'", () => {
    it("渲染标题骨架", () => {
      const { container } = render(<Skeleton type="title" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("type='paragraph'", () => {
    it("默认渲染 3 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" />);
      // paragraph 默认 3 行，每行 1 个子元素
      expect(container.firstChild?.childNodes).toHaveLength(3);
    });

    it("lines=5 时渲染 5 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" lines={5} />);
      expect(container.firstChild?.childNodes).toHaveLength(5);
    });
  });

  describe("type='avatar'", () => {
    it("渲染头像骨架", () => {
      const { container } = render(<Skeleton type="avatar" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("type='card'", () => {
    it("渲染卡片骨架（含多层结构）", () => {
      const { container } = render(<Skeleton type="card" />);
      expect(container.firstChild).not.toBeEmptyDOMElement();
    });
  });

  describe("type='list'", () => {
    it("默认渲染 3 个列表项骨架", () => {
      const { container } = render(<Skeleton type="list" />);
      // 每个列表项渲染为一个 flex 行
      expect(container.firstChild?.childNodes).toHaveLength(3);
    });

    it("lines=5 渲染 5 个列表项", () => {
      const { container } = render(<Skeleton type="list" lines={5} />);
      expect(container.firstChild?.childNodes).toHaveLength(5);
    });
  });
});

describe("ProgressBar", () => {
  it("indeterminate 模式渲染 progressbar", () => {
    render(<ProgressBar />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    // indeterminate 不应有 aria-valuenow
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("determinate 模式设置进度值", () => {
    render(<ProgressBar indeterminate={false} value={42} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
  });

  it("value 被限制在 0-100 范围", () => {
    render(<ProgressBar indeterminate={false} value={150} />);
    const bar = screen.getByRole("progressbar");
    // 虽然传入 150，但 fill 宽度被 clamp 到 100%
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill).toBeInTheDocument();
    expect(fill.style.width).toBe("100%");
  });
});
