import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card bento/compact variants", () => {
  // ===========================================================================
  // bento variant 测试
  // ===========================================================================
  describe("bento variant", () => {
    it("bento 应该有 radius-2xl 圆角", () => {
      render(<Card variant="bento">Bento</Card>);

      const card = screen.getByText("Bento").closest("div")!;
      expect(card.className).toContain("rounded-[var(--radius-2xl)]");
    });

    it("bento 应该有 p-8 padding", () => {
      render(<Card variant="bento">Bento</Card>);

      const card = screen.getByText("Bento").closest("div")!;
      expect(card).toHaveClass("p-8");
    });

    it("bento + hoverable 应该工作", () => {
      render(
        <Card variant="bento" hoverable>
          Bento
        </Card>,
      );

      const card = screen.getByText("Bento").closest("div")!;
      expect(card).toHaveClass("cursor-pointer");
    });

    it("bento + noPadding 应该去掉 padding", () => {
      render(
        <Card variant="bento" noPadding>
          Bento
        </Card>,
      );

      const card = screen.getByText("Bento").closest("div")!;
      expect(card).not.toHaveClass("p-8");
    });
  });

  // ===========================================================================
  // compact variant 测试
  // ===========================================================================
  describe("compact variant", () => {
    it("compact 应该有 p-3 padding", () => {
      render(<Card variant="compact">Compact</Card>);

      const card = screen.getByText("Compact").closest("div")!;
      expect(card).toHaveClass("p-3");
    });

    it("compact 应该有 space-y-1 间距", () => {
      render(<Card variant="compact">Compact</Card>);

      const card = screen.getByText("Compact").closest("div")!;
      expect(card).toHaveClass("space-y-1");
    });

    it("compact 应该有 radius-md 圆角", () => {
      render(<Card variant="compact">Compact</Card>);

      const card = screen.getByText("Compact").closest("div")!;
      expect(card.className).toContain("rounded-[var(--radius-md)]");
    });
  });
});
