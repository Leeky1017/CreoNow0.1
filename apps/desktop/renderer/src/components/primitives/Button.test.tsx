import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ButtonVariant, ButtonSize } from "./Button";
import { Button } from "./Button";

describe("Button", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染按钮文本", () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole("button")).toHaveTextContent("Click me");
    });

    it("应该有正确的 type 属性", () => {
      render(<Button>Submit</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("应该应用自定义 className", () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("应该传递原生 button 属性", () => {
      render(
        <Button data-testid="test-btn" aria-label="Test button">
          Test
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-testid", "test-btn");
      expect(button).toHaveAttribute("aria-label", "Test button");
    });
  });

  // ===========================================================================
  // Variant 测试（全覆盖）
  // ===========================================================================
  describe("variants", () => {
    const variants: ButtonVariant[] = [
      "primary",
      "secondary",
      "ghost",
      "danger",
      "pill",
    ];

    it.each(variants)("应该渲染 %s variant", (variant) => {
      render(<Button variant={variant}>{variant}</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(variant);
    });

    it("默认应该是 secondary variant", () => {
      render(<Button>Default</Button>);

      // secondary variant 有 border class
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
    });
  });

  // ===========================================================================
  // Size 测试（全覆盖）
  // ===========================================================================
  describe("sizes", () => {
    const sizeClasses: Record<ButtonSize, string> = {
      sm: "h-7",
      md: "h-9",
      lg: "h-11",
      icon: "h-10",
    };

    it.each(Object.entries(sizeClasses))(
      "应该渲染 %s size 并有 %s 类",
      (size, expectedClass) => {
        render(<Button size={size as ButtonSize}>{size}</Button>);

        const button = screen.getByRole("button");
        expect(button).toHaveClass(expectedClass);
      },
    );

    it("默认应该是 md size", () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
    });

    it("icon size 应该有相等的宽高", () => {
      render(<Button size="icon">X</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
      expect(button).toHaveClass("p-0");
    });
  });

  // ===========================================================================
  // 状态测试
  // ===========================================================================
  describe("状态", () => {
    it("应该处理 disabled 状态", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("应该在 loading 时显示 spinner 并禁用", () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      // Spinner 应该存在（通过 SVG 检测）
      expect(button.querySelector("svg")).toBeInTheDocument();
      // 应该有动画类
      expect(button.querySelector("svg")).toHaveClass("animate-spin");
    });

    it("loading 时仍然显示 children", () => {
      render(<Button loading>Loading Text</Button>);

      expect(screen.getByRole("button")).toHaveTextContent("Loading Text");
    });

    it("应该渲染 fullWidth 样式", () => {
      render(<Button fullWidth>Full Width</Button>);

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });

    it("同时设置 disabled 和 loading 应该禁用", () => {
      render(
        <Button disabled loading>
          Both
        </Button>,
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("应该在点击时调用 onClick", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disabled 状态下不应该响应点击", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );

      await user.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("loading 状态下不应该响应点击", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>,
      );

      await user.click(screen.getByRole("button"));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("应该可以通过 Tab 键聚焦", async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);

      await user.tab();

      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("disabled 时不应该可以通过 Tab 键聚焦", async () => {
      const user = userEvent.setup();
      render(<Button disabled>Cannot focus</Button>);

      await user.tab();

      expect(screen.getByRole("button")).not.toHaveFocus();
    });
  });

  // ===========================================================================
  // Focus 样式测试
  // ===========================================================================
  describe("Focus 样式", () => {
    it("应该有 focus-visible 相关类", () => {
      render(<Button>Focus Test</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline");
    });
  });

  // ===========================================================================
  // CSS Variables 检查（不使用硬编码颜色）
  // ===========================================================================
  describe("CSS Variables", () => {
    it("class 中不应该包含硬编码的十六进制颜色", () => {
      const { container } = render(<Button variant="primary">Test</Button>);

      const button = container.querySelector("button");
      const classNames = button?.className ?? "";

      // 检查 class 中不包含硬编码的颜色值（如 #ffffff, #000000 等）
      // Tailwind 的 CSS Variable 引用格式是 [var(--xxx)]
      expect(classNames).not.toMatch(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/);
    });

    it("应该使用 CSS Variables 定义颜色", () => {
      const { container } = render(<Button variant="primary">Test</Button>);

      const button = container.querySelector("button");
      const classNames = button?.className ?? "";

      // 检查使用了 CSS Variables
      expect(classNames).toContain("var(--");
    });
  });

  // ===========================================================================
  // 边界情况测试
  // ===========================================================================
  describe("边界情况", () => {
    it("应该处理空字符串 children", () => {
      // 空字符串作为 children 是 React 允许的边界情况
      render(<Button>{""}</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("应该处理超长文本", () => {
      const longText =
        "This is an extremely long button text that should still render correctly without breaking the layout";
      render(<Button>{longText}</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(longText);
    });

    it("应该处理单字符", () => {
      render(<Button>X</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("X");
    });

    it("应该处理 emoji", () => {
      render(<Button>🚀 Launch</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("🚀 Launch");
    });

    it("应该处理 React 节点作为 children", () => {
      render(
        <Button>
          <span data-testid="icon">icon</span>
          <span>Text</span>
        </Button>,
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveTextContent("Text");
    });
  });

  // ===========================================================================
  // 完整 Variant × Size 矩阵测试
  // ===========================================================================
  describe("Variant × Size 矩阵", () => {
    const variants: ButtonVariant[] = [
      "primary",
      "secondary",
      "ghost",
      "danger",
      "pill",
    ];
    const sizes: ButtonSize[] = ["sm", "md", "lg", "icon"];
    const sizeClasses: Record<ButtonSize, string> = {
      sm: "h-7",
      md: "h-9",
      lg: "h-11",
      icon: "h-10",
    };

    // 生成所有组合的测试用例
    const combinations = variants.flatMap((variant) =>
      sizes.map((size) => ({ variant, size })),
    );

    it.each(combinations)(
      "应该正确渲染 $variant × $size 组合",
      ({ variant, size }) => {
        render(
          <Button variant={variant} size={size}>
            Test
          </Button>,
        );

        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass(sizeClasses[size]);
      },
    );
  });

  // ===========================================================================
  // 无障碍 (a11y) 测试
  // ===========================================================================
  describe("无障碍", () => {
    it("应该支持 aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName("Close dialog");
    });

    it("应该支持 aria-describedby", () => {
      render(
        <>
          <span id="desc">This button submits the form</span>
          <Button aria-describedby="desc">Submit</Button>
        </>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "desc");
    });

    it("disabled 按钮应该有正确的 aria 属性", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("disabled");
    });
  });
});
