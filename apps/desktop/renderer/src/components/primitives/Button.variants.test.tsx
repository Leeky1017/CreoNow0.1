import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button pill/icon variants", () => {
  // ===========================================================================
  // pill variant 专项测试
  // ===========================================================================
  describe("pill variant", () => {
    it("pill 应该使用 radius-full 圆角", () => {
      render(<Button variant="pill">Pill</Button>);

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-[var(--radius-full)]");
    });

    it("pill 应该有 border（继承 secondary 样式）", () => {
      render(<Button variant="pill">Pill</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
    });

    it("pill + icon size 可组合使用", () => {
      render(
        <Button variant="pill" size="icon">
          X
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-[var(--radius-full)]");
      expect(button).toHaveClass("p-0");
    });
  });

  // ===========================================================================
  // icon size 专项测试
  // ===========================================================================
  describe("icon size", () => {
    it("icon size 应该有 padding 0", () => {
      render(<Button size="icon">X</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("p-0");
    });

    it("icon + primary 可组合使用", () => {
      render(
        <Button variant="primary" size="icon">
          X
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });

    it("icon + ghost 可组合使用", () => {
      render(
        <Button variant="ghost" size="icon">
          X
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
      expect(button).toHaveClass("p-0");
    });
  });
});
