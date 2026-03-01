import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RightPanel } from "./RightPanel";
import { LayoutTestWrapper } from "./test-utils";
import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";

function renderRightPanel(): void {
  render(
    <LayoutTestWrapper>
      <RightPanel width={LAYOUT_DEFAULTS.panel.default} collapsed={false} />
    </LayoutTestWrapper>,
  );
}

describe("RightPanel.ai-tabbar-actions", () => {
  it("[WB-FE-AI-TAB-S1] AI tab 激活时在 tab bar 提供 History/NewChat 动作入口", () => {
    renderRightPanel();

    const historyAction = screen.getByTestId("right-panel-ai-history-action");
    const newChatAction = screen.getByTestId("right-panel-ai-new-chat-action");

    expect(historyAction).toHaveAttribute("type", "button");
    expect(newChatAction).toHaveAttribute("type", "button");
    expect(historyAction.className).toContain("h-6");
    expect(historyAction.className).toContain("w-6");
    expect(newChatAction.className).toContain("h-6");
    expect(newChatAction.className).toContain("w-6");
  });

  it("[WB-FE-AI-TAB-S1b] 非 AI tab 激活时隐藏 History/NewChat 动作入口", () => {
    renderRightPanel();

    fireEvent.click(screen.getByTestId("right-panel-tab-info"));

    expect(
      screen.queryByTestId("right-panel-ai-history-action"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("right-panel-ai-new-chat-action"),
    ).not.toBeInTheDocument();
  });
});
