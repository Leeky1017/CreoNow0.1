/**
 * v1-02 Button 变体行为测试 —— 边界完整版
 *
 * 覆盖范围：
 * - pill variant：圆角、继承 secondary 行为、组合性
 * - icon size：正方形约束、zero padding、组合性
 * - 禁用/加载态 × 新 variant 矩阵
 * - fullWidth × 新 variant
 * - 回归：现有 variant/size 不受影响
 * - 可访问性：role=button、disabled 属性、ref 透传
 * - 边界：空 children、超长文本、emoji
 */

import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ButtonVariant, ButtonSize } from "./Button";
import { Button } from "./Button";

describe("Button v1-02 行为测试", () => {
  // ===========================================================================
  // pill variant 行为
  // ===========================================================================
  describe("pill variant", () => {
    it("渲染为 role=button", () => {
      render(<Button variant="pill">Pill</Button>);
      expect(screen.getByRole("button", { name: "Pill" })).toBeInTheDocument();
    });

    it("使用 radius-full 圆角", () => {
      render(<Button variant="pill">Pill</Button>);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("rounded-[var(--radius-full)]");
    });

    it("不使用 radius-sm 或 radius-md", () => {
      render(<Button variant="pill">Pill</Button>);
      const btn = screen.getByRole("button");
      expect(btn.className).not.toContain("rounded-[var(--radius-sm)]");
      expect(btn.className).not.toContain("rounded-[var(--radius-md)]");
    });

    it("继承 secondary 的边框行为", () => {
      render(<Button variant="pill">Pill</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("border");
    });

    it("继承 secondary 的 hover 样式类", () => {
      render(<Button variant="pill">Pill</Button>);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("hover:bg-[var(--color-bg-hover)]");
    });

    it("disabled 时 opacity-50 且 cursor-not-allowed", () => {
      render(
        <Button variant="pill" disabled>
          Pill
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(btn).toHaveClass("disabled:opacity-50");
      expect(btn).toHaveClass("disabled:cursor-not-allowed");
    });

    it("loading 时显示 spinner 且 disabled", () => {
      render(
        <Button variant="pill" loading>
          Pill
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      const spinner = btn.querySelector("svg.animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("fullWidth + pill 有 w-full 类", () => {
      render(
        <Button variant="pill" fullWidth>
          Pill
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("w-full");
    });

    it("pill + sm size 保持 radius-full", () => {
      render(
        <Button variant="pill" size="sm">
          Pill Small
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("rounded-[var(--radius-full)]");
      expect(btn).toHaveClass("h-7");
    });

    it("pill + lg size 保持 radius-full", () => {
      render(
        <Button variant="pill" size="lg">
          Pill Large
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("rounded-[var(--radius-full)]");
      expect(btn).toHaveClass("h-11");
    });

    it("点击事件正常触发", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button variant="pill" onClick={onClick}>
          Pill
        </Button>,
      );
      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("disabled 时点击不触发", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button variant="pill" disabled onClick={onClick}>
          Pill
        </Button>,
      );
      await user.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // icon size 行为
  // ===========================================================================
  describe("icon size", () => {
    it("渲染为正方形（w-10 h-10）", () => {
      render(<Button size="icon">X</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("w-10");
      expect(btn).toHaveClass("h-10");
    });

    it("padding 为 0", () => {
      render(<Button size="icon">X</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("p-0");
    });

    it("内容居中（flex + items-center + justify-center）", () => {
      render(<Button size="icon">X</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("items-center");
      expect(btn).toHaveClass("justify-center");
    });

    it("icon + primary 可组合", () => {
      render(
        <Button variant="primary" size="icon">
          X
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("w-10");
      expect(btn).toHaveClass("h-10");
      expect(btn).toHaveClass("p-0");
      expect(btn.className).toContain("bg-[var(--color-fg-default)]");
    });

    it("icon + ghost 可组合", () => {
      render(
        <Button variant="ghost" size="icon">
          X
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("w-10");
      expect(btn).toHaveClass("p-0");
      // ghost 使用 border-0（无边框），不应有带宽度的 border 类
      expect(btn.className).toContain("border-0");
    });

    it("icon + danger 可组合", () => {
      render(
        <Button variant="danger" size="icon">
          X
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("w-10");
      expect(btn.className).toContain("text-[var(--color-error)]");
    });

    it("icon + pill 产生圆形按钮", () => {
      render(
        <Button variant="pill" size="icon">
          X
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("rounded-[var(--radius-full)]");
      expect(btn).toHaveClass("w-10");
      expect(btn).toHaveClass("h-10");
      expect(btn).toHaveClass("p-0");
    });

    it("icon disabled 正常工作", () => {
      render(
        <Button size="icon" disabled>
          X
        </Button>,
      );
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("icon loading 显示 spinner", () => {
      render(
        <Button size="icon" loading>
          X
        </Button>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(btn.querySelector("svg.animate-spin")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 回归：现有 variant 不受影响
  // ===========================================================================
  describe("回归：现有 variant 行为不变", () => {
    const existingVariants: ButtonVariant[] = [
      "primary",
      "secondary",
      "ghost",
      "danger",
    ];
    const existingSizes: ButtonSize[] = ["sm", "md", "lg"];

    for (const variant of existingVariants) {
      it(`${variant} 仍可正常渲染`, () => {
        render(<Button variant={variant}>{variant}</Button>);
        expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
      });
    }

    for (const size of existingSizes) {
      it(`size=${size} 仍可正常渲染`, () => {
        render(<Button size={size}>{size}</Button>);
        expect(screen.getByRole("button", { name: size })).toBeInTheDocument();
      });
    }

    it("默认 variant 为 secondary", () => {
      render(<Button>Default</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("border");
    });

    it("默认 size 为 md", () => {
      render(<Button>Default</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("h-9");
    });
  });

  // ===========================================================================
  // Variant × Size 全矩阵
  // ===========================================================================
  describe("Variant × Size 全矩阵渲染", () => {
    const allVariants: ButtonVariant[] = [
      "primary",
      "secondary",
      "ghost",
      "danger",
      "pill",
    ];
    const allSizes: ButtonSize[] = ["sm", "md", "lg", "icon"];

    const combinations = allVariants.flatMap((variant) =>
      allSizes.map((size) => ({ variant, size })),
    );

    it.each(combinations)(
      "$variant × $size 渲染不报错",
      ({ variant, size }) => {
        render(
          <Button variant={variant} size={size}>
            Test
          </Button>,
        );
        expect(screen.getByRole("button")).toBeInTheDocument();
      },
    );
  });

  // ===========================================================================
  // 可访问性
  // ===========================================================================
  describe("可访问性", () => {
    it("type 默认为 button（非 submit）", () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("aria-label 透传", () => {
      render(<Button aria-label="Close">X</Button>);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("ref 透传", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("data-testid 透传", () => {
      render(<Button data-testid="my-btn">Test</Button>);
      expect(screen.getByTestId("my-btn")).toBeInTheDocument();
    });

    it("键盘 Enter 触发点击", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);
      screen.getByRole("button").focus();
      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("键盘 Space 触发点击", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);
      screen.getByRole("button").focus();
      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // 边界情况
  // ===========================================================================
  describe("边界情况", () => {
    it("className 合并不覆盖", () => {
      render(<Button className="custom-class">C</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("custom-class");
      // 基础样式仍在
      expect(btn).toHaveClass("inline-flex");
    });

    it("超长文本不溢出（有 overflow-hidden）", () => {
      render(<Button>{"A".repeat(200)}</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("overflow-hidden");
    });

    it("emoji children 正常渲染", () => {
      render(<Button>🚀 Launch</Button>);
      expect(screen.getByRole("button", { name: "🚀 Launch" })).toBeInTheDocument();
    });

    it("focus-visible 有 outline", () => {
      render(<Button>Focus</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("focus-visible:outline");
    });
  });
});
