import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState, Skeleton, ProgressBar } from "../LoadingState";

describe("LoadingState", () => {
  describe("variant='spinner'（默认）", () => {
    it("渲染 spinner SVG 动画", () => {
      const { container } = render(<LoadingState variant="spinner" />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("animate-spin");
    });

    it("传入 text 时渲染加载提示文字", () => {
      render(<LoadingState variant="spinner" text="加载中..." />);
      expect(screen.getByText("加载中...")).toBeInTheDocument();
    });

    it("不传 text 时不渲染文字", () => {
      const { container } = render(<LoadingState variant="spinner" />);
      // 只有 SVG，没有文字
      expect(container.querySelectorAll("span")).toHaveLength(0);
    });

    it("size='sm' 渲染小尺寸 spinner", () => {
      const { container } = render(
        <LoadingState variant="spinner" size="sm" />,
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-4", "h-4");
    });

    it("size='lg' 渲染大尺寸 spinner", () => {
      const { container } = render(
        <LoadingState variant="spinner" size="lg" />,
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-8", "h-8");
    });
  });

  describe("variant='skeleton'", () => {
    it("渲染段落骨架占位", () => {
      const { container } = render(<LoadingState variant="skeleton" />);
      // Skeleton paragraph 默认 3 行
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("variant='progress'", () => {
    it("渲染 progressbar role 元素", () => {
      render(<LoadingState variant="progress" />);
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("variant='inline'", () => {
    it("渲染内联 spinner（无外层居中容器）", () => {
      const { container } = render(<LoadingState variant="inline" />);
      // inline 直接渲染 SVG，无 wrapper div
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("animate-spin");
    });
  });

  describe("className 传递", () => {
    it("spinner variant 接收 className", () => {
      const { container } = render(
        <LoadingState variant="spinner" className="my-custom" />,
      );
      expect(container.firstChild).toHaveClass("my-custom");
    });
  });
});

describe("Skeleton", () => {
  describe("type='text'（默认）", () => {
    it("渲染单行文本骨架", () => {
      const { container } = render(<Skeleton type="text" />);
      expect(container.firstChild).toHaveClass("animate-pulse");
    });
  });

  describe("type='title'", () => {
    it("渲染标题骨架（3/4 宽度）", () => {
      const { container } = render(<Skeleton type="title" />);
      expect(container.firstChild).toHaveClass("w-3/4");
    });
  });

  describe("type='paragraph'", () => {
    it("默认渲染 3 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" />);
      const lines = container.querySelectorAll(".animate-pulse");
      expect(lines).toHaveLength(3);
    });

    it("lines=5 时渲染 5 行骨架", () => {
      const { container } = render(<Skeleton type="paragraph" lines={5} />);
      const lines = container.querySelectorAll(".animate-pulse");
      expect(lines).toHaveLength(5);
    });

    it("最后一行较短（w-2/3）", () => {
      const { container } = render(<Skeleton type="paragraph" lines={3} />);
      const lines = container.querySelectorAll(".animate-pulse");
      expect(lines[2]).toHaveClass("w-2/3");
    });
  });

  describe("type='avatar'", () => {
    it("渲染圆形头像骨架", () => {
      const { container } = render(<Skeleton type="avatar" />);
      expect(container.firstChild).toHaveClass("rounded-full");
    });
  });

  describe("type='card'", () => {
    it("渲染卡片骨架（含多层结构）", () => {
      const { container } = render(<Skeleton type="card" />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("type='list'", () => {
    it("默认渲染 3 个列表项骨架", () => {
      const { container } = render(<Skeleton type="list" />);
      // 每个列表项有 avatar + 2 lines = 3 pulse per row
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThanOrEqual(3);
    });

    it("lines=5 渲染 5 个列表项", () => {
      const { container } = render(<Skeleton type="list" lines={5} />);
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThanOrEqual(5);
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
    const { container } = render(
      <ProgressBar indeterminate={false} value={150} />,
    );
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill?.style.width).toBe("100%");
  });
});
