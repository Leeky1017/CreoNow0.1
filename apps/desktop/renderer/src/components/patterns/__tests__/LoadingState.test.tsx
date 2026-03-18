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
    it("渲染单行文本骨架（高度为 h-4 结构）", () => {
      const { container } = render(<Skeleton type="text" />);
      // text 骨架是一个单一块，不含子行
      expect(container.firstChild?.childNodes).toHaveLength(0);
    });

    it("width prop 通过 style.width 应用", () => {
      const { container } = render(<Skeleton type="text" width="200px" />);
      expect((container.firstChild as HTMLElement).style.width).toBe("200px");
    });

    it("height prop 通过 style.height 应用", () => {
      const { container } = render(<Skeleton type="text" height="32px" />);
      expect((container.firstChild as HTMLElement).style.height).toBe("32px");
    });

    it("className prop 传递到骨架根元素", () => {
      const { container } = render(
        <Skeleton type="text" className="my-skeleton" />,
      );
      expect(container.firstChild).toHaveClass("my-skeleton");
    });
  });

  describe("type='title'", () => {
    it("渲染标题骨架（宽度受 3/4 约束，无子元素）", () => {
      const { container } = render(<Skeleton type="title" />);
      // title 是单一块，无子行
      expect(container.firstChild?.childNodes).toHaveLength(0);
    });

    it("className prop 传递到骨架根元素", () => {
      const { container } = render(
        <Skeleton type="title" className="title-skel" />,
      );
      expect(container.firstChild).toHaveClass("title-skel");
    });
  });

  describe("type='paragraph'", () => {
    it("默认渲染 3 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" />);
      expect(container.firstChild?.childNodes).toHaveLength(3);
    });

    it("lines=5 时渲染 5 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" lines={5} />);
      expect(container.firstChild?.childNodes).toHaveLength(5);
    });
  });

  describe("type='avatar'", () => {
    it("渲染单一圆形头像块（无子元素）", () => {
      const { container } = render(<Skeleton type="avatar" />);
      expect(container.firstChild?.childNodes).toHaveLength(0);
    });

    it("width/height props 自定义头像尺寸", () => {
      const { container } = render(
        <Skeleton type="avatar" width="48px" height="48px" />,
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.width).toBe("48px");
      expect(el.style.height).toBe("48px");
    });
  });

  describe("type='card'", () => {
    it("渲染卡片骨架（内部包含多个占位块）", () => {
      const { container } = render(<Skeleton type="card" />);
      // card 类型：外层 div > div.space-y-4 > 多个子块
      const inner = container.firstChild?.firstChild as HTMLElement;
      expect(inner?.childNodes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("type='list'", () => {
    it("默认渲染 3 个列表项骨架", () => {
      const { container } = render(<Skeleton type="list" />);
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

  it("className prop 传递到 progressbar 根元素", () => {
    render(<ProgressBar className="custom-progress" />);
    expect(screen.getByRole("progressbar")).toHaveClass("custom-progress");
  });
});
