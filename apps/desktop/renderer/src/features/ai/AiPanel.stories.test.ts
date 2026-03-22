import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { composeStories } from "@storybook/react";
import { describe, expect, it } from "vitest";

import * as chatStories from "./AiChat.stories";
import * as statesStories from "./AiStates.stories";

const { EmptyState, GeneratingState } = composeStories(chatStories);
const { ErrorState, SendButtonStates } = composeStories(statesStories);

describe("AiPanel stories", () => {
  it("[CMI-S2-SA-S1] asserts key render elements and initial state", () => {
    const emptyView = render(EmptyState({}));
    expect(
      screen.getAllByText("Ask the AI to help with your writing").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTitle("输入内容后可发送")).toBeDisabled();
    emptyView.unmount();

    const generatingView = render(GeneratingState({}));
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask the AI...")).toBeDisabled();
    generatingView.unmount();

    const errorView = render(ErrorState({}));
    expect(screen.getByText("请求失败")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
    errorView.unmount();
  });

  it("[CMI-S2-SA-S2] fails when interaction feedback regresses", async () => {
    const user = userEvent.setup();
    render(SendButtonStates({}));

    const emptyStateButton = screen.getByRole("button", { name: "1. Empty" });
    const hasInputStateButton = screen.getByRole("button", {
      name: "2. Has Input",
    });

    expect(emptyStateButton.getAttribute("style")).toContain(
      "var(--color-accent)",
    );

    await user.click(hasInputStateButton);

    expect(hasInputStateButton.getAttribute("style")).toContain(
      "var(--color-accent)",
    );
    expect(emptyStateButton.getAttribute("style")).toContain(
      "var(--color-border-default)",
    );
  });
});
