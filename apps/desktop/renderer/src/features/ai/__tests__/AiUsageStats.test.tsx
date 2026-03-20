/**
 * AiUsageStats 行为测试
 *
 * AC-7: token count + cost 分行展示 + 小字注释
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "ai.panel.usagePrompt": "提示:",
        "ai.usageOutput": "输出:",
        "ai.usageSessionTotal": "本轮合计:",
        "ai.usageCostEstimate": "预估费用:",
        "ai.usageAnnotation": "本轮对话消耗",
      };
      return map[key] ?? key;
    },
  }),
}));

import { AiUsageStats } from "../AiUsageStats";

describe("AiUsageStats", () => {
  const baseProps = {
    promptTokens: 150,
    completionTokens: 200,
    sessionTotalTokens: 350,
    estimatedCostUsd: 0.0012,
  };

  it("renders prompt tokens in a dedicated row", () => {
    render(<AiUsageStats {...baseProps} />);
    const promptEl = screen.getByTestId("ai-usage-prompt-tokens");
    expect(promptEl).toBeInTheDocument();
    expect(promptEl.textContent).toContain("150");
  });

  it("renders completion tokens in a dedicated row", () => {
    render(<AiUsageStats {...baseProps} />);
    const completionEl = screen.getByTestId("ai-usage-completion-tokens");
    expect(completionEl).toBeInTheDocument();
    expect(completionEl.textContent).toContain("200");
  });

  it("renders session total tokens", () => {
    render(<AiUsageStats {...baseProps} />);
    const totalEl = screen.getByTestId("ai-usage-session-total-tokens");
    expect(totalEl).toBeInTheDocument();
    expect(totalEl.textContent).toContain("350");
  });

  it("renders estimated cost", () => {
    render(<AiUsageStats {...baseProps} />);
    const costEl = screen.getByTestId("ai-usage-estimated-cost");
    expect(costEl).toBeInTheDocument();
  });

  it("token count and cost are in separate rows (not same flex row)", () => {
    const { container } = render(<AiUsageStats {...baseProps} />);
    // Each stat should be in its own row — using flex-col or space-y layout
    const rows = container.querySelectorAll(
      "[data-testid='ai-usage-stats'] > *",
    );
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it("renders annotation text", () => {
    render(<AiUsageStats {...baseProps} />);
    const annotation = screen.getByTestId("ai-usage-annotation");
    expect(annotation).toBeInTheDocument();
  });

  it("does not render cost when estimatedCostUsd is undefined", () => {
    const { promptTokens, completionTokens, sessionTotalTokens } = baseProps;
    render(
      <AiUsageStats
        promptTokens={promptTokens}
        completionTokens={completionTokens}
        sessionTotalTokens={sessionTotalTokens}
      />,
    );
    expect(
      screen.queryByTestId("ai-usage-estimated-cost"),
    ).not.toBeInTheDocument();
  });
});
