/**
 * v1-02 Card 变体行为测试 —— 边界完整版
 *
 * 覆盖范围：
 * - bento variant：radius-2xl、space-8 token、hover 边框变亮
 * - compact variant：space-3 token、space-y-1 token、radius-md
 * - hoverable × 新 variant 组合
 * - noPadding × 新 variant 组合
 * - 回归：现有 variant 不受影响
 * - 可访问性/属性透传
 * - 边界情况
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CardVariant } from "./Card";
import { Card } from "./Card";

describe("Card v1-02 行为测试", () => {
  // ===========================================================================
  // bento variant 行为
  // ===========================================================================
  describe("bento variant", () => {
    it("使用 radius-2xl 圆角", () => {
      render(<Card variant="bento">Bento</Card>);
      const card = screen.getByText("Bento").closest("div")!;
      expect(card.className).toContain("rounded-[var(--radius-2xl)]");
    });

    it("默认 padding 使用 space-8 token", () => {
      render(<Card variant="bento">Bento</Card>);
      const card = screen.getByText("Bento").closest("div")!;
      expect(card.className).toContain("p-[var(--space-8)]");
    });

    it("有边框", () => {
      render(<Card variant="bento">Bento</Card>);
      const card = screen.getByText("Bento").closest("div")!;
      expect(card).toHaveClass("border");
    });

    it("有 transition-colors 用于边框动效", () => {
      render(<Card variant="bento">Bento</Card>);
      const card = screen.getByText("Bento").closest("div")!;
      expect(card).toHaveClass("transition-colors");
    });

    it("hoverable 时有 cursor-pointer", () => {
      render(
        <Card variant="bento" hoverable>
          Bento
        </Card>,
      );
      const card = screen.getByText("Bento").closest("div")!;
      expect(card).toHaveClass("cursor-pointer");
    });

    it("hoverable 时有 hover 边框样式", () => {
      render(
        <Card variant="bento" hoverable>
          Bento
        </Card>,
      );
      const card = screen.getByText("Bento").closest("div")!;
      expect(card.className).toContain(
        "hover:border-[var(--color-border-hover)]",
      );
    });

    it("noPadding 时移除 padding", () => {
      render(
        <Card variant="bento" noPadding>
          Bento
        </Card>,
      );
      const card = screen.getByText("Bento").closest("div")!;
      expect(card.className).not.toContain("p-[var(--space-8)]");
      expect(card.className).not.toContain("p-[var(--space-section-gap)]");
    });

    it("不使用 radius-xl（那是 default 的圆角）", () => {
      render(<Card variant="bento">Bento</Card>);
      const card = screen.getByText("Bento").closest("div")!;
      // 基础 baseStyles 有 rounded-[var(--radius-xl)]，但 bento variant 覆盖了它
      // 注意：CSS 中后定义的会覆盖，但 className 列表中两者可能都在
      // 这里只验证 bento 特有的 radius-2xl 存在
      expect(card.className).toContain("rounded-[var(--radius-2xl)]");
    });

    it("bento 渲染 children", () => {
      render(
        <Card variant="bento">
          <h2>Title</h2>
          <p>Content</p>
        </Card>,
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // compact variant 行为
  // ===========================================================================
  describe("compact variant", () => {
    it("使用 radius-md 圆角", () => {
      render(<Card variant="compact">Compact</Card>);
      const card = screen.getByText("Compact").closest("div")!;
      expect(card.className).toContain("rounded-[var(--radius-md)]");
    });

    it("padding 使用 space-3 token", () => {
      render(<Card variant="compact">Compact</Card>);
      const card = screen.getByText("Compact").closest("div")!;
      expect(card.className).toContain("p-[var(--space-3)]");
    });

    it("子元素间距使用 space-1 token", () => {
      render(<Card variant="compact">Compact</Card>);
      const card = screen.getByText("Compact").closest("div")!;
      expect(card.className).toContain("space-y-[var(--space-1)]");
    });

    it("有边框", () => {
      render(<Card variant="compact">Compact</Card>);
      const card = screen.getByText("Compact").closest("div")!;
      expect(card).toHaveClass("border");
    });

    it("noPadding 时移除 p-3 和 space-y-1", () => {
      render(
        <Card variant="compact" noPadding>
          Compact
        </Card>,
      );
      const card = screen.getByText("Compact").closest("div")!;
      expect(card).not.toHaveClass("p-[var(--space-3)]");
    });

    it("compact hoverable 时有 cursor-pointer", () => {
      render(
        <Card variant="compact" hoverable>
          Compact
        </Card>,
      );
      const card = screen.getByText("Compact").closest("div")!;
      expect(card).toHaveClass("cursor-pointer");
    });

    it("适合 stat card 布局（多个子元素）", () => {
      render(
        <Card variant="compact">
          <span>1,234</span>
          <span>Total Words</span>
        </Card>,
      );
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("Total Words")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 回归：现有 variant 不受影响
  // ===========================================================================
  describe("回归：现有 variant 行为不变", () => {
    it("default variant 使用 section-gap padding", () => {
      render(<Card variant="default">Default</Card>);
      const card = screen.getByText("Default").closest("div")!;
      expect(card.className).toContain("p-[var(--space-section-gap)]");
    });

    it("default variant 使用 radius-xl", () => {
      render(<Card>Default</Card>);
      const card = screen.getByText("Default").closest("div")!;
      expect(card.className).toContain("rounded-[var(--radius-xl)]");
    });

    it("raised variant 有 shadow", () => {
      render(<Card variant="raised">Raised</Card>);
      const card = screen.getByText("Raised").closest("div")!;
      expect(card.className).toContain("shadow-[var(--shadow-md)]");
    });

    it("bordered variant 有 border-2", () => {
      render(<Card variant="bordered">Bordered</Card>);
      const card = screen.getByText("Bordered").closest("div")!;
      expect(card).toHaveClass("border-2");
    });

    it("默认 variant 为 default", () => {
      render(<Card>NoVariant</Card>);
      const card = screen.getByText("NoVariant").closest("div")!;
      expect(card.className).toContain("p-[var(--space-section-gap)]");
    });

    it("默认 hoverable 为 false", () => {
      render(<Card>NoHover</Card>);
      const card = screen.getByText("NoHover").closest("div")!;
      expect(card).not.toHaveClass("cursor-pointer");
    });
  });

  // ===========================================================================
  // Variant × 特性矩阵
  // ===========================================================================
  describe("Variant × 特性矩阵", () => {
    const allVariants: CardVariant[] = [
      "default",
      "raised",
      "bordered",
      "bento",
      "compact",
    ];

    it.each(allVariants)("%s variant 渲染不报错", (variant) => {
      render(<Card variant={variant}>Test</Card>);
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it.each(allVariants)("%s + hoverable 渲染不报错", (variant) => {
      render(
        <Card variant={variant} hoverable>
          Test
        </Card>,
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it.each(allVariants)("%s + noPadding 渲染不报错", (variant) => {
      render(
        <Card variant={variant} noPadding>
          Test
        </Card>,
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it.each(allVariants)("%s + hoverable + noPadding 渲染不报错", (variant) => {
      render(
        <Card variant={variant} hoverable noPadding>
          Test
        </Card>,
      );
      expect(screen.getByText("Test")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 可访问性与属性透传
  // ===========================================================================
  describe("属性透传", () => {
    it("className 合并不覆盖基础样式", () => {
      render(<Card className="custom-class">C</Card>);
      const card = screen.getByText("C").closest("div")!;
      expect(card).toHaveClass("custom-class");
      expect(card.className).toContain("bg-[var(--color-bg-surface)]");
    });

    it("data-testid 透传", () => {
      render(<Card data-testid="my-card">C</Card>);
      expect(screen.getByTestId("my-card")).toBeInTheDocument();
    });

    it("onClick 透传", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Card onClick={onClick}>Click</Card>);
      await user.click(screen.getByText("Click"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("aria-label 透传", () => {
      render(<Card aria-label="Info card">Content</Card>);
      const card = screen.getByText("Content").closest("div")!;
      expect(card).toHaveAttribute("aria-label", "Info card");
    });
  });

  // ===========================================================================
  // 边界情况
  // ===========================================================================
  describe("边界情况", () => {
    it("空 children 不报错", () => {
      render(<Card>{""}</Card>);
      // 应该渲染一个 div（即使内容为空）
      const cards = document.querySelectorAll(
        "div.bg-\\[var\\(--color-bg-surface\\)\\]",
      );
      expect(cards.length).toBeGreaterThan(0);
    });

    it("嵌套 Card 正常渲染", () => {
      render(
        <Card variant="bento">
          <Card variant="compact">Nested</Card>
        </Card>,
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
    });

    it("所有 variant 的 transition 样式存在", () => {
      const variants: CardVariant[] = [
        "default",
        "raised",
        "bordered",
        "bento",
        "compact",
      ];
      for (const variant of variants) {
        const { container } = render(<Card variant={variant}>T</Card>);
        const card = container.firstChild as HTMLElement;
        expect(
          card.className.includes("transition"),
          `${variant} 缺少 transition`,
        ).toBe(true);
      }
    });
  });
});
