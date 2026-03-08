import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatHistory } from "./ChatHistory";

describe("ChatHistory placeholder UI closure", () => {
  it("Scenario: ChatHistory 空态展示 Coming Soon 文案", () => {
    const onSelectChat = vi.fn();

    render(
      <ChatHistory open onOpenChange={vi.fn()} onSelectChat={onSelectChat} />,
    );

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("Scenario: ChatHistory onSelectChat 不会被调用（无可点击条目）", async () => {
    const user = userEvent.setup();
    const onSelectChat = vi.fn();

    render(
      <ChatHistory open onOpenChange={vi.fn()} onSelectChat={onSelectChat} />,
    );

    // Click inside the dialog area — should not trigger onSelectChat
    const dialog = screen.getByRole("dialog");
    await user.click(dialog);

    expect(onSelectChat).not.toHaveBeenCalled();
  });

  it("Scenario: ChatHistory 关闭时不渲染", () => {
    render(
      <ChatHistory
        open={false}
        onOpenChange={vi.fn()}
        onSelectChat={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
