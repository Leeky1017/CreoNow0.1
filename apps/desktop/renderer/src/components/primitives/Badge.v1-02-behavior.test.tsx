/**
 * v1-02 Badge 变体行为测试 —— 边界完整版
 *
 * 覆盖范围：
 * - pill variant：uppercase、tracking-wide、weight-semibold、radius-full
 * - pill × size 矩阵（sm/md padding 差异）
 * - 回归：现有 variant 不受影响
 * - 可访问性
 * - 边界：空/超长/数字/CJK 内容
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BadgeVariant, BadgeSize } from "./Badge";
import { Badge } from "./Badge";

describe("Badge v1-02 行为测试", () => {
  // ===========================================================================
  // pill variant — 视觉结构
  // ===========================================================================
  describe("pill variant — 视觉结构", () => {
    it("有 uppercase 文字", () => {
      render(<Badge variant="pill">Tag</Badge>);
      expect(screen.getByText("Tag")).toHaveClass("uppercase");
    });

    it("使用 tracking-wide 字间距", () => {
      render(<Badge variant="pill">Tag</Badge>);
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("tracking-[var(--tracking-wide)]");
    });

    it("使用 weight-semibold 字重", () => {
      render(<Badge variant="pill">Tag</Badge>);
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("font-[var(--weight-semibold)]");
    });

    it("使用 radius-full 圆角", () => {
      render(<Badge variant="pill">Tag</Badge>);
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("rounded-[var(--radius-full)]");
    });

    it("背景色使用 bg-hover token", () => {
      render(<Badge variant="pill">Tag</Badge>);
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("bg-[var(--color-bg-hover)]");
    });

    it("文字颜色使用 fg-muted token", () => {
      render(<Badge variant="pill">Tag</Badge>);
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("text-[var(--color-fg-muted)]");
    });
  });

  // ===========================================================================
  // pill × size 矩阵
  // ===========================================================================
  describe("pill × size 矩阵", () => {
    it("pill + md 有 px-3.5 和 py-1.5 padding", () => {
      render(
        <Badge variant="pill" size="md">
          Tag
        </Badge>,
      );
      const badge = screen.getByText("Tag");
      expect(badge).toHaveClass("px-3.5");
      expect(badge).toHaveClass("py-1.5");
    });

    it("pill + sm 有 px-2.5 和 py-1 padding", () => {
      render(
        <Badge variant="pill" size="sm">
          Tag
        </Badge>,
      );
      const badge = screen.getByText("Tag");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-1");
    });

    it("pill 不使用标准 height token（h-[22px]）", () => {
      render(
        <Badge variant="pill" size="md">
          Tag
        </Badge>,
      );
      const badge = screen.getByText("Tag");
      // pill 使用独立的 padding 系统，不用 height
      expect(badge).not.toHaveClass("h-[22px]");
    });

    it("pill sm 不使用标准 height token（h-[18px]）", () => {
      render(
        <Badge variant="pill" size="sm">
          Tag
        </Badge>,
      );
      const badge = screen.getByText("Tag");
      expect(badge).not.toHaveClass("h-[18px]");
    });

    it("pill md 使用 label-size 字号", () => {
      render(
        <Badge variant="pill" size="md">
          Tag
        </Badge>,
      );
      const badge = screen.getByText("Tag");
      expect(badge.className).toContain("text-[var(--text-label-size)]");
    });
  });

  // ===========================================================================
  // 回归：现有 variant 行为不变
  // ===========================================================================
  describe("回归：现有 variant 不变", () => {
    const existingVariants: BadgeVariant[] = [
      "default",
      "success",
      "warning",
      "error",
      "info",
    ];

    for (const variant of existingVariants) {
      it(`${variant} variant 仍可渲染`, () => {
        render(<Badge variant={variant}>{variant}</Badge>);
        expect(screen.getByText(variant)).toBeInTheDocument();
      });
    }

    it("default variant 使用 bg-hover 背景", () => {
      render(<Badge variant="default">D</Badge>);
      const badge = screen.getByText("D");
      expect(badge.className).toContain("bg-[var(--color-bg-hover)]");
    });

    it("success variant 使用 success-subtle 背景", () => {
      render(<Badge variant="success">S</Badge>);
      const badge = screen.getByText("S");
      expect(badge.className).toContain("bg-[var(--color-success-subtle)]");
    });

    it("error variant 使用 error-subtle 背景", () => {
      render(<Badge variant="error">E</Badge>);
      const badge = screen.getByText("E");
      expect(badge.className).toContain("bg-[var(--color-error-subtle)]");
    });

    it("默认 variant 为 default", () => {
      render(<Badge>None</Badge>);
      const badge = screen.getByText("None");
      expect(badge.className).toContain("bg-[var(--color-bg-hover)]");
    });

    it("默认 size 为 md", () => {
      render(<Badge>None</Badge>);
      const badge = screen.getByText("None");
      expect(badge).toHaveClass("h-[22px]");
    });

    it("现有 variant 不应有 uppercase", () => {
      for (const variant of existingVariants) {
        render(<Badge variant={variant}>{`t-${variant}`}</Badge>);
        expect(screen.getByText(`t-${variant}`)).not.toHaveClass("uppercase");
      }
    });
  });

  // ===========================================================================
  // 全矩阵渲染
  // ===========================================================================
  describe("Variant × Size 全矩阵", () => {
    const allVariants: BadgeVariant[] = [
      "default",
      "success",
      "warning",
      "error",
      "info",
      "pill",
    ];
    const allSizes: BadgeSize[] = ["sm", "md"];

    const combinations = allVariants.flatMap((variant) =>
      allSizes.map((size) => ({ variant, size })),
    );

    it.each(combinations)(
      "$variant × $size 渲染不报错",
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
  // CSS Variables 安全
  // ===========================================================================
  describe("CSS Variables 安全", () => {
    it("所有 variant 使用 CSS Variables 定义颜色", () => {
      const allVariants: BadgeVariant[] = [
        "default",
        "success",
        "warning",
        "error",
        "info",
        "pill",
      ];
      for (const variant of allVariants) {
        render(<Badge variant={variant}>{`v-${variant}`}</Badge>);
        const badge = screen.getByText(`v-${variant}`);
        expect(badge.className, `${variant} 缺少 CSS Variable`).toContain(
          "var(--",
        );
      }
    });

    it("不应包含硬编码十六进制颜色", () => {
      const allVariants: BadgeVariant[] = [
        "default",
        "success",
        "warning",
        "error",
        "info",
        "pill",
      ];
      for (const variant of allVariants) {
        render(<Badge variant={variant}>{`hex-${variant}`}</Badge>);
        const badge = screen.getByText(`hex-${variant}`);
        expect(badge.className).not.toMatch(
          /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/,
        );
      }
    });
  });

  // ===========================================================================
  // 可访问性
  // ===========================================================================
  describe("可访问性", () => {
    it("渲染为 span 元素", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge.tagName).toBe("SPAN");
    });

    it("className 合并不覆盖", () => {
      render(<Badge className="my-class">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveClass("my-class");
      expect(badge).toHaveClass("inline-flex");
    });

    it("data-testid 透传", () => {
      render(<Badge data-testid="badge-1">Test</Badge>);
      expect(screen.getByTestId("badge-1")).toBeInTheDocument();
    });

    it("aria-label 透传", () => {
      render(<Badge aria-label="status badge">Test</Badge>);
      const badge = screen.getByText("Test");
      expect(badge).toHaveAttribute("aria-label", "status badge");
    });
  });

  // ===========================================================================
  // 边界情况
  // ===========================================================================
  describe("边界情况", () => {
    it("处理数字内容", () => {
      render(<Badge variant="pill">{42}</Badge>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("处理 emoji 内容", () => {
      render(<Badge variant="pill">🏷️</Badge>);
      expect(screen.getByText("🏷️")).toBeInTheDocument();
    });

    it("处理 CJK 内容", () => {
      render(<Badge variant="pill">标签</Badge>);
      expect(screen.getByText("标签")).toBeInTheDocument();
    });

    it("处理超长文本（有 whitespace-nowrap）", () => {
      const longText = "VeryLongBadgeText";
      render(<Badge variant="pill">{longText}</Badge>);
      const badge = screen.getByText(longText);
      expect(badge).toHaveClass("whitespace-nowrap");
    });

    it("多个 badge 共存", () => {
      render(
        <div>
          <Badge variant="pill">A</Badge>
          <Badge variant="success">B</Badge>
          <Badge variant="error">C</Badge>
        </div>,
      );
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("空 children 不报错", () => {
      const { container } = render(<Badge variant="pill">{""}</Badge>);
      const badge = container.querySelector("span");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("inline-flex");
    });
  });
});
