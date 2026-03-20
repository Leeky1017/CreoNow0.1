/**
 * AiEmptyState 行为测试
 *
 * AC-6: 48px sunburst icon + 居中引导文案 + 渐入动画
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "ai.emptyHint": "向 AI 提问，开始创作",
      };
      return map[key] ?? key;
    },
  }),
}));

import { AiEmptyState } from "../AiEmptyState";

describe("AiEmptyState", () => {
  it("renders a sunburst icon at 48px visual size", () => {
    render(<AiEmptyState />);
    const icon = screen.getByTestId("ai-empty-state-icon");
    expect(icon).toBeInTheDocument();
    // CSS class w-12 h-12 provides 48px visual size; Lucide base size stays guard-compliant
    expect(icon.classList.toString()).toMatch(/w-12/);
    expect(icon.classList.toString()).toMatch(/h-12/);
  });

  it("renders centered guidance text", () => {
    render(<AiEmptyState />);
    expect(screen.getByText("向 AI 提问，开始创作")).toBeInTheDocument();
  });

  it("icon container has spin animation class", () => {
    render(<AiEmptyState />);
    const icon = screen.getByTestId("ai-empty-state-icon");
    // The icon's parent wrapper div has the spin-slow animation
    const wrapper = icon.parentElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper!.className).toMatch(/animate-spin/);
  });

  it("root container has fade-in animation class", () => {
    render(<AiEmptyState />);
    const root = screen.getByTestId("ai-empty-state");
    expect(root.className).toMatch(/animate-fade-in|fade-in/);
  });
});
