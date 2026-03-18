import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BadgeVariant, BadgeSize } from "./Badge";
import { Badge } from "./Badge";

describe("Badge", () => {
  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 badge 内容", () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText("Test Badge")).toBeInTheDocument();
    });

    it("应该应用自定义 className", () => {
      render(<Badge className="custom-class">Custom</Badge>);

      expect(screen.getByText("Custom")).toHaveClass("custom-class");
    });

    it("应该传递原生属性", () => {
      render(
        <Badge data-testid="test-badge" aria-label="Status badge">
          Test
        </Badge>,
      );

      const badge = screen.getByTestId("test-badge");
      expect(badge).toHaveAttribute("aria-label", "Status badge");
    });
  });

  // ===========================================================================
  // Variant 测试
  // ===========================================================================
  describe("variants", () => {
    const variants: BadgeVariant[] = [
      "default",
      "success",
      "warning",
      "error",
      "info",
    ];

    it.each(variants)("应该渲染 %s variant", (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);

      expect(screen.getByText(variant)).toBeInTheDocument();
    });

    it("默认应该是 default variant", () => {
      render(<Badge>Default</Badge>);

      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-[var(--color-bg-hover)]");
    });
  });

  // ===========================================================================
  // Size 测试
  // ===========================================================================
  describe("sizes", () => {
    const sizeClasses: Record<BadgeSize, string> = {
      sm: "h-[18px]",
      md: "h-[22px]",
    };

    it.each(Object.entries(sizeClasses))(
      "应该渲染 %s size 并有 %s 类",
      (size, expectedClass) => {
        render(<Badge size={size as BadgeSize}>{size}</Badge>);

        expect(screen.getByText(size)).toHaveClass(expectedClass);
      },
    );

    it("默认应该是 md size", () => {
      render(<Badge>Default</Badge>);

      expect(screen.getByText("Default")).toHaveClass("h-[22px]");
    });
  });

  // ===========================================================================
  // CSS Variables 检查
  // ===========================================================================
  describe("CSS Variables", () => {
    it("应该使用 CSS Variables 定义颜色", () => {
      render(<Badge variant="success">Test</Badge>);

      const badge = screen.getByText("Test");
      expect(badge.className).toContain("var(--");
    });

    it("class 中不应该包含硬编码的十六进制颜色", () => {
      render(<Badge variant="error">Test</Badge>);

      const badge = screen.getByText("Test");
      expect(badge.className).not.toMatch(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/);
    });
  });

  // ===========================================================================
  // 边界情况测试
  // ===========================================================================
  describe("边界情况", () => {
    it("应该处理数字内容", () => {
      render(<Badge>{99}</Badge>);

      expect(screen.getByText("99")).toBeInTheDocument();
    });

    it("应该处理超长文本", () => {
      const longText = "Very Long Badge Text";
      render(<Badge>{longText}</Badge>);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("应该处理 emoji", () => {
      render(<Badge>🎉 New</Badge>);

      expect(screen.getByText("🎉 New")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Variant × Size 矩阵测试
  // ===========================================================================
  describe("Variant × Size 矩阵", () => {
    const variants: BadgeVariant[] = [
      "default",
      "success",
      "warning",
      "error",
      "info",
      "pill",
    ];
    const sizes: BadgeSize[] = ["sm", "md"];

    const combinations = variants.flatMap((variant) =>
      sizes.map((size) => ({ variant, size })),
    );

    it.each(combinations)(
      "应该正确渲染 $variant × $size 组合",
      ({ variant, size }) => {
        render(
          <Badge variant={variant} size={size}>
            Test
          </Badge>,
        );

        expect(screen.getByText("Test")).toBeInTheDocument();
      },
    );
  });

  // ===========================================================================
  // pill variant 专项测试
  // ===========================================================================
  describe("pill variant", () => {
    it("pill 应该有 uppercase", () => {
      render(<Badge variant="pill">Tag</Badge>);

      const badge = screen.getByText("Tag");
      expect(badge).toHaveClass("uppercase");
    });

    it("pill 应该有 tracking-wide", () => {
      render(<Badge variant="pill">Tag</Badge>);

      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("tracking-[var(--tracking-wide)]");
    });

    it("pill 应该有 weight-semibold", () => {
      render(<Badge variant="pill">Tag</Badge>);

      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("font-[var(--weight-semibold)]");
    });

    it("pill 应该有 radius-full 圆角", () => {
      render(<Badge variant="pill">Tag</Badge>);

      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("rounded-[var(--radius-full)]");
    });

    it("pill md 应该有正确的 padding", () => {
      render(
        <Badge variant="pill" size="md">
          Tag
        </Badge>,
      );

      const badge = screen.getByText("Tag");
      expect(badge).toHaveClass("px-3.5");
      expect(badge).toHaveClass("py-1.5");
    });
  });
});
